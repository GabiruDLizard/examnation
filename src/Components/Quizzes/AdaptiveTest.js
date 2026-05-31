import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { askGPT } from '../../Worker/chat';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { authFetch } from '../../utils/api';
import { addStyles, EditableMathField } from 'react-mathquill';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import '../PracticeArea/PracticeArea.css';
import { renderFeedback } from '../../Worker/feedbackRender';
import { needAHint } from '../../Worker/chat';
import DesmosGraph from '../DesmosGraph/DesmosGraph';
import { saveTestResults, saveUserProgress } from './Servicing';
import { updateStudentTopicAbility, getStudentTopicAbility, recordStudentReadiness } from '../Dashboards/TeacherDashboard/TeacherDashboardService';
import { abilityEstimate } from '../Dashboards/Charts/ReadinessLogic';
import { analyzeMistakePatterns } from '../PerformanceEngine/^PerformanceAnalysis';
import { getUserIdFromToken } from '../../utils/tokenUtils';
import MathText from '../Shared/MathText';

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
};
addStyles();

const AdaptiveTest = () => {
  const stepReference = useRef([]);
  const answerBlockRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Adaptive difficulty state sets next question based on user's performance
  const [nextIfCorrect, setNextIfCorrect] = useState(null);
  const [nextIfWrong, setNextIfWrong] = useState(null);

  // Get question count from navigation state or default to 10
  const TOTAL_QUESTIONS = location.state?.questionCount || 5;
  const curatedIds = location.state?.curatedQuizIds;
  const classId    = location.state?.classId ?? null;

  const preQueue = (currentId, seenIds) => {
    const excludeIds = new Set([...seenIds, currentId]);
    setNextIfCorrect(getQuestionAtScore(targetScore + 1.5, excludeIds));
    setNextIfWrong(getQuestionAtScore(targetScore - 1.0, excludeIds));
  };

  // Composite difficulty score normalised to [1.5, 14] range
  // Weights: difficulty 40%, paper 35%, points 25% (log-scaled)
  const DIFF_NAME_MAP = { 'easy': 1, 'medium': 2, 'medium-hard': 3, 'hard': 4, 'very hard': 5 };
  const getQuestionScore = (q) => {
    const rawDiff = q.difficultyLevel ?? q.Difficulty ?? 2;
    const diff    = typeof rawDiff === 'string' && isNaN(rawDiff)
      ? (DIFF_NAME_MAP[rawDiff.toLowerCase()] ?? 2)
      : parseFloat(rawDiff) || 2;
    const paperLevel = { 'Paper 1': 1, 'Paper 2': 2, 'Paper 3': 3 }[q.paper] ?? 1;
    const points     = parseFloat(q.points ?? q.marks ?? 1) || 1;

    const pointsNorm  = Math.log(points + 1) / Math.log(13);
    const normalized  = (diff / 5 * 0.4) + (paperLevel / 3 * 0.35) + (pointsNorm * 0.25);
    return 1.5 + normalized * 12.5;
  };

  const [questionPool, setQuestionPool] = useState([]);

  // State declarations
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const exampleFormat = useMemo(() => {
    const src = currentQuestion?.['outputFormat'] || currentQuestion?.correctAnswer;
    if (!src) return null;
    const stripped = src.replace(/[\r\n]+/g, (_, offset, str) => {
      const before = str.slice(0, offset).trimEnd();
      return before.endsWith(',') ? ' ' : ', ';
    }).trim();
    if (currentQuestion?.['outputFormat']) return stripped;
    return stripped.replace(/\d+/g, n => {
      const orig = parseInt(n);
      let r;
      do { r = Math.floor(Math.random() * 9) + 1; } while (r === orig);
      return r;
    });
  }, [currentQuestion?.id]);
  const [testAnswers, setTestAnswers] = useState([]); // Store all answers
  const [difficultyLevel, setDifficultyLevel] = useState("Medium"); // Display label (last question's difficulty)
  const [targetScore, setTargetScore] = useState(4.5); // Continuous difficulty score; Medium ~3marks×1.5=4.5
  const [hint, setHint] = useState('');
  const [hintload, setHintload] = useState(false);
  const [steps, setSteps] = useState(['']);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [graphState, setGraphState] = useState(null);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState([]);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  // Per-topic theta map: { "Algebra (Linear Equations)": 0.5, ... }
  const [topicThetas, setTopicThetas] = useState({});

  const [usedQuestionIds, setUsedQuestionIds] = useState(() => {
    // Load seen question IDs from localStorage (persists across sessions)
    try {
      const stored = localStorage.getItem('adaptiveSeenQuestions');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  // Get authentication token
  const token = localStorage.getItem('token');

  // Fetch questions from DB on mount
  useEffect(() => {
    authFetch('/question?source=admin')
      .then(r => r.json())
      .then(data => {
        const pool = curatedIds?.length
          ? data.filter(q => curatedIds.includes(q.id))
          : data;
        setQuestionPool(pool);
      })
      .catch(() => toast.error('Failed to load questions'));
  }, []);

  // Block copy / paste / right-click during the test
  useEffect(() => {
    const blockPaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toast.warn('Pasting is not allowed during a test.', { toastId: 'no-paste', autoClose: 2000 });
    };
    const blockCopy = (e) => { e.preventDefault(); e.stopPropagation(); };
    const blockCtx  = (e) => e.preventDefault();

    // capture: true fires BEFORE MathQuill's hidden textarea handles the event
    document.addEventListener('paste',       blockPaste, { capture: true });
    document.addEventListener('copy',        blockCopy,  { capture: true });
    document.addEventListener('cut',         blockCopy,  { capture: true });
    document.addEventListener('contextmenu', blockCtx,   { capture: true });
    return () => {
      document.removeEventListener('paste',       blockPaste, { capture: true });
      document.removeEventListener('copy',        blockCopy,  { capture: true });
      document.removeEventListener('cut',         blockCopy,  { capture: true });
      document.removeEventListener('contextmenu', blockCtx,   { capture: true });
    };
  }, []);

  useEffect(() => {
    if(!token) { navigate('/login'); return; }
    if(questionPool.length === 0) return; // wait for questions to load

    const initializeTest = () => {
      // Curated sessions always start fresh — don't restore an unrelated saved test
      if (curatedIds?.length) {
        localStorage.removeItem('adaptiveTest');
      }

      // Check if there's a saved test in localStorage
      const savedTest = localStorage.getItem('adaptiveTest');

      if (savedTest) {
        const testData = JSON.parse(savedTest);
        setCurrentQuestionIndex(testData.currentIndex);
        setTotalScore(testData.totalScore);
        setCorrectAnswers(testData.correctAnswers);
        setTestAnswers(testData.answers);
        setDifficultyLevel(testData.difficultyLevel);
        setElapsedTime(testData.elapsedTime);
        if (testData.usedIds) {
          setUsedQuestionIds(new Set(testData.usedIds));
        }

        if (testData.currentIndex >= TOTAL_QUESTIONS) {
          setIsTestComplete(true);
        } else {
          // Get next question at saved target score
          setTargetScore(testData.targetScore || 4.5);
          const nextQuestion = getQuestionAtScore(testData.targetScore || 4.5, new Set(testData.usedIds || []));
          setCurrentQuestion(nextQuestion);
        }
      } else {
            // Start new test
            setTestAnswers(new Array(TOTAL_QUESTIONS).fill(null));
            const seenIds = (() => {
              try {
                const stored = localStorage.getItem('adaptiveSeenQuestions');
                return stored ? new Set(JSON.parse(stored)) : new Set();
              } catch { return new Set(); }
            })();
            const firstQuestion = getQuestionAtScore(4.5, seenIds);
            setCurrentQuestion(firstQuestion);
            preQueue(firstQuestion?.id, seenIds);

            // Save initial test state
            const initialTestData = {
            currentIndex: 0,
            totalScore: 0,
            correctAnswers: 0,
            answers: new Array(TOTAL_QUESTIONS).fill(null),
            difficultyLevel: "Medium",
            targetScore: 4.5,
            elapsedTime: 0,
            startTime: Date.now(),
            usedIds: firstQuestion ? [firstQuestion.id] : []
            };
            localStorage.setItem('adaptiveTest', JSON.stringify(initialTestData));
        }

        // Start timer
        setStartTime(Date.now());
        setIsTimerRunning(true);
    };

    initializeTest();

    // Load existing per-topic thetas so we start from the student's current ability
    const userId = getUserIdFromToken();
    if (userId) {
        getStudentTopicAbility(userId).then(rows => {
            const map = {};
            rows.forEach(r => { map[r.topic] = r.theta; });
            setTopicThetas(map);
        }).catch(() => {});
    }
  }, [token, navigate, questionPool]);

  // Get question whose score is closest to targetScore, excluding already-seen questions
  const getQuestionAtScore = (score, seenIds = usedQuestionIds) => {
    // Filter out seen questions; fall back to full pool only if exhausted
    const available = questionPool.filter(q => !seenIds.has(q.id));
    const pool = available.length > 0 ? available : questionPool;

    const scored = pool.map(q => ({ q, dist: Math.abs(getQuestionScore(q) - score) }));
    scored.sort((a, b) => a.dist - b.dist);
    const candidates = scored.slice(0, 8);
    const picked = candidates[Math.floor(Math.random() * candidates.length)].q;
    setCurrentQuestionStartTime(Date.now());
    setDifficultyLevel(picked.difficultyLevel ?? picked.Difficulty ?? 'Medium');
    return picked;
  };

  // Nudge targetScore up on correct, down on wrong; clamp to [1.5, 14]
  const adjustDifficulty = (wasCorrect) => {
    const next = wasCorrect ? targetScore + 1.5 : targetScore - 1.0;
    const clamped = Math.max(1.5, Math.min(14.0, next));
    setTargetScore(clamped);
    return clamped;
  };

  // Save test state to localStorage whenever important state changes
  useEffect(() => {
    if (currentQuestionIndex > 0 || totalScore > 0) {
      const usedIdsArray = Array.from(usedQuestionIds);
      const testData = {
        currentIndex: currentQuestionIndex,
        totalScore: totalScore,
        correctAnswers: correctAnswers,
        answers: testAnswers,
        difficultyLevel: difficultyLevel,
        targetScore: targetScore,
        elapsedTime: elapsedTime,
        timePerQuestion: timePerQuestion,
        startTime: startTime,
        isComplete: isTestComplete,
        usedIds: usedIdsArray
      };
      localStorage.setItem('adaptiveTest', JSON.stringify(testData));
      // Also persist seen IDs globally so the next test avoids them
      localStorage.setItem('adaptiveSeenQuestions', JSON.stringify(usedIdsArray));
    }
  }, [currentQuestionIndex, totalScore, correctAnswers, testAnswers, difficultyLevel, targetScore, elapsedTime, isTestComplete, timePerQuestion, usedQuestionIds]);

  // Timer effect
  useEffect(() => {
    let timer = null;
    if (isTimerRunning && startTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, startTime]);

  // Function to check if answer is correct
  const checkAnswer = (userAnswer, correctSolution) => {
    if (!userAnswer || userAnswer.trim() === '') return false;
    if (!correctSolution || correctSolution.trim() === '') return false;

    const normalize = (ans) => {
      return ans.toString()
        .toLowerCase()
        // Strip newlines
        .replace(/[\r\n]+/g, ' ')
        // Strip LaTeX commands from MathQuill (e.g. \left( \right) \text{} \frac{}{})
        .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/\\\\/g, '')
        // Strip part labels: (a) (b) (c) (d) (e) (i) (ii) (iii) (iv)
        .replace(/\([a-e]\)\s*/gi, ' ')
        .replace(/\(i{1,3}v?\)\s*/gi, ' ')
        // Strip currency labels
        .replace(/bsd\$?/gi, '')
        .replace(/\$/g, '')
        // Strip units
        .replace(/\b(km\/h|m\/s|cm²|m²|cm³|m³|cm|km|mm|mg|ml|kg|g|l)\b/gi, '')
        .replace(/\b(litres?|minutes?|hours?|seconds?|hrs?|mins?|secs?|pounds?|lbs?)\b/gi, '')
        // Strip degree symbol and other symbols
        .replace(/[°×÷≈]/g, '')
        // Normalize separators to space
        .replace(/[,;:]/g, ' ')
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedUser = normalize(userAnswer);
    const normalizedCorrect = normalize(correctSolution);

    if (normalizedUser === '' || normalizedCorrect === '') return false;
    if (normalizedUser === normalizedCorrect) return true;

    // OR alternatives (e.g. "x = 3 or x = -5")
    if (normalizedCorrect.includes(' or ')) {
      const alts = normalizedCorrect.split(' or ').map(a => normalize(a));
      if (alts.some(a => normalizedUser === a || normalizedUser.includes(a))) return true;
    }

    // Number-sequence comparison: extract all numbers from both and compare positionally
    // Handles differences in units, labels, spacing, and small rounding
    const extractNums = (s) => (s.match(/-?\d+\.?\d*/g) || []).map(Number);
    const correctNums = extractNums(normalizedCorrect);
    const userNums = extractNums(normalizedUser);

    if (correctNums.length > 0 && correctNums.length === userNums.length) {
      return correctNums.every((cn, i) => Math.abs(cn - userNums[i]) < 0.05);
    }

    // Partial match fallback (e.g. student writes subset of multi-part answer)
    return normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStepChange = (idx, latex) => {
    const newSteps = [...steps];
    newSteps[idx] = latex;
    setSteps(newSteps);

    const combinedAnswer = newSteps.filter(step => step.trim() !== '').join('; ');
    setCurrentAnswer(combinedAnswer);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newSteps = [...steps];
      newSteps.splice(index + 1, 0, "");
      setSteps(newSteps);
      setTimeout(() => stepReference.current[index + 1]?.focus(), 0);
    } else if (e.key === "Backspace") {
      if (steps[index] === "" && steps.length > 1) {
        e.preventDefault();
        const newSteps = steps.filter((_, i) => i !== index);
        setSteps(newSteps);
        setTimeout(() => {
          const prevIndex = Math.max(index - 1, 0);
          stepReference.current[prevIndex]?.focus();
        }, 0);
      }
    }
  };

  const handleHint = async () => {
    const submission = steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');
    const latexString = `Question: ${currentQuestion.questionText}\n\nUser Solution:\n${submission}`;
    setHintload(true);
    try {
      const response = await needAHint(latexString);
      setHint(response);
      setHintload(false);
    } catch {
      setHintload(false);
    }
  };

  const handleGraphStateChange = (graphState) => {
    setGraphState(graphState);
    if (graphState && graphState.expressions) {
      const graphAnswer = JSON.stringify(graphState.expressions);
      setCurrentAnswer(graphAnswer);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Calculate time spent on this question
      const elapsedTime = Math.floor((Date.now() - currentQuestionStartTime) / 1000);
      setTimePerQuestion(prev => [...prev, elapsedTime]);

      // Get user's working steps and final answer
      let workingSteps = '';
      let submittedFinalAnswer = '';
      let answerStepsJSON = [];

      if (currentQuestion?.subject === "Graphs") {
        submittedFinalAnswer = graphState ? JSON.stringify(graphState.expressions) : '';
        workingSteps = submittedFinalAnswer;
      } else {
        const nonEmptySteps = steps.filter(step => step.trim() !== '');
        if (nonEmptySteps.length > 0) {
          answerStepsJSON = nonEmptySteps.map((step, idx) => ({ stepNumber: idx + 1, stepText: step }));
        }
        workingSteps = nonEmptySteps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');
        submittedFinalAnswer = finalAnswer.trim() || nonEmptySteps[nonEmptySteps.length - 1] || '';
      }

      // Check if answer is correct using the final answer
      const correct = checkAnswer(submittedFinalAnswer, currentQuestion.correctAnswer);
      setIsCorrect(correct);

      // Calculate points for this question using marks × paperWeight
      const questionPoints = correct ? Math.round(getQuestionScore(currentQuestion) * 10) / 10 : 0;

      // Update scores
      const newTotalScore = totalScore + questionPoints;
      const newCorrectAnswers = correctAnswers + (correct ? 1 : 0);

      setTotalScore(newTotalScore);
      setCorrectAnswers(newCorrectAnswers);

      // Store the answer with separated working and final answer
      const answerData = {
        questionId: currentQuestion['Question ID'],
        questionText: currentQuestion.questionText,
        workingSteps: workingSteps,           // ALL steps they wrote
        finalAnswer: submittedFinalAnswer,
        userAnswer: submittedFinalAnswer,
        answerStepsJSON: answerStepsJSON,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: correct,
        pointsEarned: questionPoints,
        difficulty: currentQuestion.difficultyLevel ?? currentQuestion.Difficulty,
        topic: currentQuestion.subject,
        timeSpent: elapsedTime,
        timeToAnswer: timePerQuestion[currentQuestionIndex] || elapsedTime
      };

      const newTestAnswers = [...testAnswers];
      newTestAnswers[currentQuestionIndex] = answerData;
      setTestAnswers(newTestAnswers);

      // **ADAPTIVE DIFFICULTY ADJUSTMENT**
      const nextTargetScore = adjustDifficulty(correct);

      preQueue(currentQuestion?.id, new Set([...usedQuestionIds, currentQuestion?.id]));

      // Update per-topic IRT theta
      const topic = currentQuestion.subject;
      if (topic) {
          // Seed new topics from current average Rasch theta instead of cold 0
          const existingThetas = Object.values(topicThetas);
          const currentAvgTheta = existingThetas.length > 0
              ? existingThetas.reduce((a, b) => a + b, 0) / existingThetas.length
              : 0;
          const priorTopicTheta = topicThetas[topic] ?? currentAvgTheta;
          const topicQCount = Object.values(testAnswers).filter(
              a => a && a.topic === topic
          ).length;
          const newTopicTheta = abilityEstimate(
              currentQuestion.difficultyLevel ?? currentQuestion.Difficulty,
              correct,
              priorTopicTheta,
              topicQCount
          );
          const updatedTopicThetas = { ...topicThetas, [topic]: newTopicTheta };
          setTopicThetas(updatedTopicThetas);

          const userId = getUserIdFromToken();
          if (userId) {
              const totalForTopic = (topicQCount + 1);
              updateStudentTopicAbility(userId, topic, newTopicTheta, totalForTopic).catch(() => {});
          }
      }

      // Get GPT feedback
      const submission = steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');
      const latexString = `Question: ${currentQuestion.questionText}\n\nUser Solution:\n${submission}\n\nCorrect Answer: ${currentQuestion.correctAnswer}`;

       const response = await askGPT(latexString);
       setFeedback(response);

      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const goToNextQuestion = async (scoreOverride) => {
    if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // Mark current question as seen before picking next
      const newSeen = new Set(usedQuestionIds);
      if (currentQuestion) newSeen.add(currentQuestion.id ?? currentQuestion['Question ID']);
      setUsedQuestionIds(newSeen);

      // Use pre-queued question based on last answer, fall back to on-demand if missing
      const preQueued = isCorrect ? nextIfCorrect : nextIfWrong;
      const nextQuestion = preQueued ?? getQuestionAtScore(scoreOverride ?? targetScore, newSeen);
      setCurrentQuestion(nextQuestion);
      setNextIfCorrect(null);
      setNextIfWrong(null);

      // Pre-queue the next pair for the question we just loaded
      if (nextQuestion) preQueue(nextQuestion.id, new Set([...newSeen, nextQuestion.id]));

      clearField();
      setFinalAnswer('');
      setIsCorrect(null);
    } else {
      // Test completed — snapshot elapsed time and stop timer
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      setIsTimerRunning(false);
      setStartTime(null);
      setIsTestComplete(true);

      const userId = getUserIdFromToken();

      const apiPayload = testAnswers
        .filter(answer => answer !== null)
        .map(answer => ({
           UserId: userId,
          QuestionId: answer.questionId,
          AnswerText: answer.workingSteps,
          AnswerSteps: answer.answerStepsJSON,
          IsCorrect: answer.isCorrect,
          AnsweredAt: new Date().toISOString(),
          TimeSpentSeconds: answer.timeSpent,
          DifficultyLevel: answer.difficulty,
          AttemptMode: "adaptive_test"
        }));

      // Collect wrong answers with full context for TA analysis
      const wrongAnswers = testAnswers.filter(ans => ans && !ans.isCorrect);

      // Save to API
      saveTestResults(apiPayload)
        .then(async response => {
          if (wrongAnswers.length > 0) {
            try {
              await analyzeMistakePatterns(
                wrongAnswers.map(a => a.workingSteps),
                wrongAnswers.map(a => a.questionText),
                {
                  studentId: userId,
                  questionIds: wrongAnswers.map(a => a.questionId),
                  topics: wrongAnswers.map(a => a.topic || 'General'),
                  difficulties: wrongAnswers.map(a => a.difficulty),
                  correctAnswers: wrongAnswers.map(a => a.correctAnswer),
                  studentAnswers: wrongAnswers.map(a => a.finalAnswer || a.workingSteps),
                  source: 'adaptive_test'
                }
              );
            } catch {
            }
          }
        })
        .catch(error => {
        });

      const userProgress = {
        userId: userId,
        subjectId: 1,
        questionsAttempted: TOTAL_QUESTIONS,
        questionsCorrect: correctAnswers,
        score: totalScore,
        lastPracticed: new Date().toISOString()
      };

      try {
        await saveUserProgress(userProgress);
      } catch {
      }

      // Record readiness immediately so the dashboard chart updates on return
      try {
        const topicValues = Object.values(topicThetas);
        const avgTheta = topicValues.length > 0
          ? topicValues.reduce((a, b) => a + b, 0) / topicValues.length
          : 0;
        const readinessPercentage = Math.max(0, Math.min(100, ((avgTheta + 4) / 8) * 100));
        await recordStudentReadiness(userId, classId, {
          readinessPercentage,
          questionsAnswered: TOTAL_QUESTIONS,
          correctAnswers,
          studyTimeMinutes: Math.round(elapsedTime / 60),
          abilityEstimate: avgTheta
        });
      } catch { /* non-fatal */ }

      const finalResults = {
        totalScore: totalScore,
        correctAnswers: correctAnswers,
        totalQuestions: TOTAL_QUESTIONS,
        timeSpent: elapsedTime,
        answers: testAnswers,
        finalDifficulty: difficultyLevel,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem('adaptiveTestResults', JSON.stringify(finalResults));
      localStorage.setItem('apiPayLoad', JSON.stringify(apiPayload));
    }
  };

  const clearField = () => {
    setSteps(['']);
    setFeedback('');
    setHint('');
    setGraphState(null);
    setCurrentAnswer('');
  };

  const resetTest = () => {
    localStorage.removeItem('adaptiveTest');
    localStorage.removeItem('adaptiveTestResults');
    localStorage.removeItem('adaptiveSeenQuestions');
    window.location.reload();
  };

  const cancelTest = async () => {
    const result = await Swal.fire({
      title: 'Cancel test?',
      text: 'Your progress will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#e2e8f0',
      confirmButtonText: 'Yes, cancel test',
      cancelButtonText: 'Keep going',
    });
    if (result.isConfirmed) {
      clearTestData();
      navigate('/testentrance');
    }
  }

  const clearTestData = () => {
    localStorage.removeItem('adaptiveTest');
    localStorage.removeItem('adaptiveTestResults');
  }

  const wrapMath = (s) => s && /[\\^_{}&]/.test(s) && !s.startsWith('$') ? `$${s}$` : (s || '—');

  // Test completion screen
  if (isTestComplete) {
    const percentage = ((correctAnswers / TOTAL_QUESTIONS) * 100).toFixed(1);

    return (
      <div className="practicebg">
        <div className="test-complete">
          <h1>🎉 Test Complete!</h1>
          <div className="test-results">
            <p><strong>Total Score:</strong> {totalScore} points</p>
            <p><strong>Correct Answers:</strong> {correctAnswers} / {TOTAL_QUESTIONS} ({percentage}%)</p>
            <p><strong>Final Difficulty:</strong> {difficultyLevel}</p>
            <p><strong>Time Taken:</strong> {formatTime(elapsedTime)}</p>
            <p><strong>Average per Question:</strong> {(totalScore / TOTAL_QUESTIONS).toFixed(1)} points</p>
          </div>

          <div className="answer-review">
            <h3>Review Your Answers:</h3>
            <div className="answers-grid">
              {testAnswers.map((answer, index) => (
                answer && (
                  <div key={index} className={`answer-card ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                    <p><strong>Q{index + 1}:</strong> {answer.difficulty} ({answer.pointsEarned} pts)</p>
                    <p><strong>Your Answer:</strong> <MathText>{wrapMath(answer.userAnswer)}</MathText></p>
                    <p><strong>Correct Answer:</strong> <MathText>{wrapMath(answer.correctAnswer)}</MathText></p>
                    <p><strong>Points:</strong> {answer.isCorrect ? answer.pointsEarned : 0}</p>
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="test-actions">
            <button onClick={() => {clearTestData();navigate('/studentdashboard');}}>Back to Dashboard</button>
            <button onClick={resetTest}>Take Test Again</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="practicebg">
        <div role="status" aria-live="polite">Loading adaptive test...</div>
      </div>
    );
  }

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <div className="practicebg">
        <div className="test-header">
          <div className="test-progress">
            <span>Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="test-score">
            <span>Score: {totalScore} points | Correct: {correctAnswers}/{currentQuestionIndex + (feedback ? 1 : 0)}</span>
          </div>
          <div className="difficulty-indicator">
            <span className={`current-difficulty ${difficultyLevel?.toLowerCase() || 'medium'}`}>
              📊 Current Difficulty: {difficultyLevel}
            </span>
          </div>
          <div className="timer">
            <span>Time: {formatTime(elapsedTime)}</span>
          </div>
          <div className="testcontrols">
            <button onClick={resetTest}>Reset Test</button>
            <button onClick={() => cancelTest()}>Cancel Test</button>
          </div>
        </div>

        <div className="practiceareagrid">
          <div className="questionCard">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <h2 className="practice-title">{currentQuestion?.UniqueName || "Adaptive Test"}</h2>
              <span className={`question-difficulty ${(currentQuestion?.difficultyLevel ?? currentQuestion?.Difficulty)?.toLowerCase() || 'medium'}`}>
                {currentQuestion?.difficultyLevel ?? currentQuestion?.Difficulty ?? 'Medium'} ({currentQuestion ? getQuestionScore(currentQuestion).toFixed(1) : '—'} pts)
              </span>
            </div>
            <div className="questionBlock">
              <strong>Question:</strong>
              <div className="questionText">
                <MathText>{currentQuestion.questionText}</MathText>
              </div>
              {(currentQuestion.figureBlobUrl || currentQuestion["Image URL"]) && (
                <div className="question-image">
                  <img src={currentQuestion.figureBlobUrl || currentQuestion["Image URL"]} alt="Question Visual" />
                </div>
              )}
              <div>
                <h2>How to Answer:</h2>
                <p>To get the question correct, you must leave your final answer in the same format as the example provided below.<br /> You must also leave your final answer as the last line of your response.</p>
                <br />
                {exampleFormat && (
                  <>
                    <strong>Example Final Answer Format:</strong>
                    <div className="example-answer-format">
                      <MathText>{exampleFormat}</MathText>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="answerBlock">
            {/* Buttons at top, matching PracticeArea layout */}
            <div className="tab-actions">
              <button className="clear-btn" onClick={clearField}>Clear</button>
              {!hint ? (
                <button className="hint-btn" onClick={handleHint} disabled={loading || !!feedback}>
                  {hintload ? 'Loading...' : 'Get Hint'}
                </button>
              ) : (
                <button className="clear-hint-btn" onClick={() => setHint('')}>Clear Hint</button>
              )}
              {!feedback && (
                <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Submit'}
                </button>
              )}
              {feedback && (
                <button className="submit-btn" onClick={goToNextQuestion}>
                  {currentQuestionIndex < TOTAL_QUESTIONS - 1 ? 'Next Question' : 'Finish Test'}
                </button>
              )}
            </div>

            {currentQuestion?.subject === "Graphs" ? (
              <div className="graph-submission">
                <div className="graph-instructions">
                  <strong>Interactive Graph:</strong>
                  <p>Use the graphing calculator below to plot your answer.</p>
                </div>
                <DesmosGraph
                  expressions={[]}
                  options={{
                    keypad: true,
                    expressions: false,
                    settingsMenu: true,
                    zoomButtons: true,
                    expressionsTopbar: true
                  }}
                  onStateChange={handleGraphStateChange}
                />
              </div>
            ) : (
              <div className="answerText">
                {steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ minWidth: 24, fontWeight: 500, color: '#888', marginRight: 8 }}>
                      {idx + 1}.
                    </span>
                    <EditableMathField
                      latex={step}
                      onChange={mf => handleStepChange(idx, mf.latex())}
                      style={{ minHeight: 28, width: '100%', maxWidth: '100%', padding: 2, borderRadius: 4, boxSizing: 'border-box', outline: 'none' }}
                      onKeyDown={e => handleKeyDown(e, idx)}
                      mathquillDidMount={field => (stepReference.current[idx] = field)}
                    />
                  </div>
                ))}
                <div className="final-answer-container">
                  <div className="final-answer-header">
                    <span className="final-answer-label">Final Answer</span>
                  </div>
                  <EditableMathField
                    latex={finalAnswer}
                    onChange={mf => setFinalAnswer(mf.latex())}
                    className="final-answer-input"
                    mathquillDidMount={field => (stepReference.current['final'] = field)}
                    onFocus={() => { if (stepReference.current) stepReference.current['final'] = stepReference.current['final']; }}
                  />
                </div>
              </div>
            )}

            <div className="submissionField">
              {isCorrect !== null && (
                <div className={`answer-result ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <strong>{isCorrect ? '✅ Correct!' : '❌ Incorrect'}</strong>
                  <p>Correct Answer: <MathText>{currentQuestion.correctAnswer}</MathText></p>
                  <p>Points Earned: {isCorrect ? getQuestionScore(currentQuestion).toFixed(1) : 0}/{getQuestionScore(currentQuestion).toFixed(1)}</p>
                  <p className="difficulty-change">
                    📊 Next Difficulty: <span className={`${difficultyLevel?.toLowerCase() || 'medium'}`}>{difficultyLevel}</span>
                  </p>
                </div>
              )}
              {hint && (
                <div className="practice-hint">
                  <strong>Hint:</strong>
                  <div>{renderFeedback(hint)}</div>
                </div>
              )}
              {feedback && (
                <div className="practice-feedback">
                  <strong>Detailed Feedback:</strong>
                  <div>
                    <strong>Solution Breakdown:</strong>
                    {currentQuestion["Solution Breakdown"]}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MathJaxContext>
  );
};

export default AdaptiveTest;
