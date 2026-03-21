import React, { useState, useRef, useEffect } from 'react';
import { askGPT } from '../../Worker/chat';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import questions from '../data/generated_bgcs_questions_200_named_deduped.json';
import { addStyles, EditableMathField } from 'react-mathquill';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import '../PracticeArea/PracticeArea.css';
import { renderFeedback } from '../../Worker/feedbackRender';
import { needAHint } from '../../Worker/chat';
import DesmosGraph from '../DesmosGraph/DesmosGraph';
import { saveTestResults, saveUserProgress } from './Servicing';
import { updateStudentTopicAbility, getStudentTopicAbility } from '../Dashboards/TeacherDashboard/TeacherDashboardService';
import { abilityEstimate } from '../Dashboards/Charts/ReadinessLogic';
import { analyzeMistakePatterns } from '../PerformanceEngine/^PerformanceAnalysis';
import { getUserIdFromToken } from '../../utils/tokenUtils';

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
};
addStyles();

const AdaptiveTest = () => {
  const stepReference = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get question count from navigation state or default to 10
  const TOTAL_QUESTIONS = location.state?.questionCount || 5;
  // Marks-based scoring: score = marks × paperWeight
  const PAPER_WEIGHTS = { Easy: 1.0, Medium: 1.5, Hard: 2.0 };
  const DEFAULT_MARKS  = { Easy: 2,   Medium: 3,   Hard: 5   };

  const getQuestionScore = (q) => {
    const marks = q.marks || DEFAULT_MARKS[q.Difficulty] || 3;
    return marks * (PAPER_WEIGHTS[q.Difficulty] || 1.5);
  };

  // State declarations
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [testAnswers, setTestAnswers] = useState([]); // Store all answers
  const [difficultyLevel, setDifficultyLevel] = useState("Medium"); // Display label (last question's difficulty)
  const [targetScore, setTargetScore] = useState(4.5); // Continuous difficulty score; Medium ~3marks×1.5=4.5
  const [hint, setHint] = useState('');
  const [hintload, setHintload] = useState(false);
  const [steps, setSteps] = useState(['']);
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

  // Initialize test
  useEffect(() => {
    if(!token) {
      navigate('/login');
      return;
    }
    else{

    const initializeTest = () => {
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
            usedIds: firstQuestion ? [firstQuestion['Question ID']] : []
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
    }
  }, [token, navigate]);

  // Get question whose score is closest to targetScore, excluding already-seen questions
  const getQuestionAtScore = (score, seenIds = usedQuestionIds) => {
    // Filter out seen questions; fall back to full pool only if exhausted
    const available = questions.filter(q => !seenIds.has(q['Question ID']));
    const pool = available.length > 0 ? available : questions;

    const scored = pool.map(q => ({ q, dist: Math.abs(getQuestionScore(q) - score) }));
    scored.sort((a, b) => a.dist - b.dist);
    const candidates = scored.slice(0, 8);
    const picked = candidates[Math.floor(Math.random() * candidates.length)].q;
    setCurrentQuestionStartTime(Date.now());
    setDifficultyLevel(picked.Difficulty);
    return picked;
  };

  // Nudge targetScore up on correct, down on wrong; clamp to [1.5, 14]
  const adjustDifficulty = (wasCorrect) => {
    setTargetScore(prev => {
      const next = wasCorrect ? prev + 1.5 : prev - 1.0;
      return Math.max(1.5, Math.min(14.0, next));
    });
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
    const latexString = `Question: ${currentQuestion["Question Text"]}\n\nUser Solution:\n${submission}`;
    setHintload(true);
    try {
      const response = await needAHint(latexString);
      setHint(response);
      setHintload(false);
    } catch (error) {
      console.error('Error fetching GPT response:', error);
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
      let finalAnswer = '';
      let answerStepsJSON = [];
      
      if (currentQuestion?.Topic === "Graphs") {
        finalAnswer = graphState ? JSON.stringify(graphState.expressions) : '';
        workingSteps = finalAnswer; // For graphs, working = final

       // answerSteps = { [currentQuestion['Question ID']]: workingSteps };
      } else {
        // Get all non-empty steps
        const nonEmptySteps = steps.filter(step => step.trim() !== '');

        //let answerStepsJSON = [];
        if (nonEmptySteps.length > 0) {
          answerStepsJSON = nonEmptySteps.map((step, idx) => ({
          stepNumber: idx + 1,
          stepText: step
  }));
}

workingSteps = nonEmptySteps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');
finalAnswer = nonEmptySteps[nonEmptySteps.length - 1] || '';
      }

      // Check if answer is correct using the final answer
      const correct = checkAnswer(finalAnswer, currentQuestion.Solution);
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
        questionText: currentQuestion["Question Text"],
        workingSteps: workingSteps,           // ALL steps they wrote
        finalAnswer: finalAnswer,             // LAST step only
        userAnswer: finalAnswer,
        answerStepsJSON: answerStepsJSON,
        correctAnswer: currentQuestion.Solution,
        isCorrect: correct,
        pointsEarned: questionPoints,
        difficulty: currentQuestion.Difficulty,
        topic: currentQuestion.Topic,
        timeSpent: elapsedTime,
        timeToAnswer: timePerQuestion[currentQuestionIndex] || elapsedTime
      };

      const newTestAnswers = [...testAnswers];
      newTestAnswers[currentQuestionIndex] = answerData;
      setTestAnswers(newTestAnswers);

      // **ADAPTIVE DIFFICULTY ADJUSTMENT**
      adjustDifficulty(correct);

      // Update per-topic IRT theta
      const topic = currentQuestion.Topic;
      if (topic) {
          const priorTopicTheta = topicThetas[topic] ?? 0;
          const topicQCount = Object.values(testAnswers).filter(
              a => a && a.topic === topic
          ).length;
          const newTopicTheta = abilityEstimate(
              currentQuestion.Difficulty,
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
      const latexString = `Question: ${currentQuestion["Question Text"]}\n\nUser Solution:\n${submission}\n\nCorrect Answer: ${currentQuestion.Solution}`;
      
       const response = await askGPT(latexString);
       setFeedback(response);
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing submission:', error);
      setLoading(false);
    }
  };

  const goToNextQuestion = async () => {
    if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // Mark current question as seen before picking next
      const newSeen = new Set(usedQuestionIds);
      if (currentQuestion) newSeen.add(currentQuestion['Question ID']);
      setUsedQuestionIds(newSeen);

      // Get next question at the current (possibly adjusted) target score
      const nextQuestion = getQuestionAtScore(targetScore, newSeen);
      setCurrentQuestion(nextQuestion);
      
      clearField();
      setIsCorrect(null);
    } else {
      // Test completed
      setIsTimerRunning(false);
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
          console.log('✅ Test results saved to database:', response);

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
            } catch (error) {
              console.error('❌ Error analyzing mistakes:', error);
            }
          }
        })
        .catch(error => {
          console.error('Error saving test results:', error);
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
        const result = await saveUserProgress(userProgress);
        console.log('Progress saved:', result);
    // result will contain: { message, progress, action }
      } catch (error) {
        console.error('Failed to save progress:', error.message);
      }

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

  const cancelTest = () => {
    if(window.confirm("Are you sure you want to cancel the test? Your progress will be lost.")){
      clearTestData();
      navigate('/testentrance');
    }
  }

  const clearTestData = () => {
    localStorage.removeItem('adaptiveTest');
    localStorage.removeItem('adaptiveTestResults');
  }

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
                    <p><strong>Your Answer:</strong> {answer.userAnswer}</p>
                    <p><strong>Correct Answer:</strong> {answer.correctAnswer}</p>
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
        <div>Loading adaptive test...</div>
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
              <span className={`question-difficulty ${currentQuestion?.Difficulty?.toLowerCase() || 'medium'}`}>
                {currentQuestion?.Difficulty || 'Medium'} ({currentQuestion ? getQuestionScore(currentQuestion).toFixed(1) : '—'} pts)
              </span>
            </div>
            <div className="questionBlock">
              <strong>Question:</strong>
              <div className="questionText">
                {currentQuestion["Question Text"]}
              </div>
              {currentQuestion["Image URL"] && (
                <div className="question-image">
                  <img src={currentQuestion["Image URL"]} alt="Question Visual" />
                </div>
              )}
              <div>
                <h2>How to Answer:</h2>
                <p>To get the question correct, you must leave your final answer in the same format as the example provided below.<br /> You must also leave your final answer as the last line of your response.</p>
                <br />
                <strong>Example Final Answer Format:</strong>
                <div className="example-answer-format">
                  {currentQuestion["outputFormat"] || "N/A"}
                </div>
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

            {currentQuestion?.Topic === "Graphs" ? (
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
                      style={{
                        minHeight: 28,
                        width: '100%',
                        maxWidth: '100%',
                        padding: 2,
                        borderRadius: 4,
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                      onKeyDown={e => handleKeyDown(e, idx)}
                      mathquillDidMount={field => (stepReference.current[idx] = field)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="submissionField">
              {isCorrect !== null && (
                <div className={`answer-result ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <strong>{isCorrect ? '✅ Correct!' : '❌ Incorrect'}</strong>
                  <p>Correct Answer: {currentQuestion.Solution}</p>
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