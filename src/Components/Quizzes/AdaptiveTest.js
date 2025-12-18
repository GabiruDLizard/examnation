import React, { useState, useRef, useEffect } from 'react';
import { askGPT } from '../../Worker/chat';
import { useParams, useNavigate } from 'react-router-dom';
import questions from '../data/generated_bgcs_questions_200_named_deduped.json';
import { addStyles, EditableMathField } from 'react-mathquill';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import '../../Styling/PracticeArea/PracticeArea.css';
import { renderFeedback } from '../../Worker/feedbackRender';
import { needAHint } from '../../Worker/chat';
import DesmosGraph from '../DesmosGraph/DesmosGraph';
import { saveTestResults, saveUserProgress } from './Servicing';

const token = localStorage.getItem('token');

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
};
addStyles();

const AdaptiveTest = () => {
  const stepReference = useRef([]);
  const navigate = useNavigate();
  
  // Test configuration
  const TOTAL_QUESTIONS = 20;
  const POINTS = {
    Easy: 1,
    Medium: 3,
    Hard: 5
  };

  const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

  // State declarations
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [testAnswers, setTestAnswers] = useState([]); // Store all answers
  const [difficultyLevel, setDifficultyLevel] = useState("Medium"); // Start at medium
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
        
        if (testData.currentIndex >= TOTAL_QUESTIONS) {
          setIsTestComplete(true);
        } else {
          // Get next question at current difficulty
          const nextQuestion = getRandomQuestionAtDifficulty(testData.difficultyLevel);
          setCurrentQuestion(nextQuestion);
        }
      } else {
            // Start new test
            setTestAnswers(new Array(TOTAL_QUESTIONS).fill(null));
            const firstQuestion = getRandomQuestionAtDifficulty("Medium");
            setCurrentQuestion(firstQuestion);
            
            // Save initial test state
            const initialTestData = {
            currentIndex: 0,
            totalScore: 0,
            correctAnswers: 0,
            answers: new Array(TOTAL_QUESTIONS).fill(null),
            difficultyLevel: "Medium",
            elapsedTime: 0,
            startTime: Date.now()
            };
            localStorage.setItem('adaptiveTest', JSON.stringify(initialTestData));
        }
        
        // Start timer
        setStartTime(Date.now());
        setIsTimerRunning(true);
        };

        initializeTest();
    }
  }, [token, navigate]);

  // Get random question at specific difficulty
  const getRandomQuestionAtDifficulty = (difficulty) => {
    const questionsAtDifficulty = questions.filter(q => q.Difficulty === difficulty);
    if (questionsAtDifficulty.length === 0) {
      // Fallback to Medium if no questions at requested difficulty
      const fallbackQuestions = questions.filter(q => q.Difficulty === "Medium");
      const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
      return fallbackQuestions[randomIndex];
    }
    
    const randomIndex = Math.floor(Math.random() * questionsAtDifficulty.length);
    setCurrentQuestionStartTime(Date.now());
    return questionsAtDifficulty[randomIndex];
  };

  // Adjust difficulty based on performance
  const adjustDifficulty = (wasCorrect) => {
    const currentIndex = DIFFICULTY_LEVELS.indexOf(difficultyLevel);
    
    if (wasCorrect && currentIndex < DIFFICULTY_LEVELS.length - 1) {
      // Increase difficulty if correct and not already at hardest
      const newDifficulty = DIFFICULTY_LEVELS[currentIndex + 1];
      setDifficultyLevel(newDifficulty);
      console.log(`✅ Correct! Difficulty increased to: ${newDifficulty}`);
      return newDifficulty;
    } else if (!wasCorrect && currentIndex > 0) {
      // Decrease difficulty if incorrect and not already at easiest
      const newDifficulty = DIFFICULTY_LEVELS[currentIndex - 1];
      setDifficultyLevel(newDifficulty);
      console.log(`❌ Incorrect! Difficulty decreased to: ${newDifficulty}`);
      return newDifficulty;
    }
    
    console.log(`🔄 Staying at difficulty: ${difficultyLevel}`);
    return difficultyLevel;
  };

  // Save test state to localStorage whenever important state changes
  useEffect(() => {
    if (currentQuestionIndex > 0 || totalScore > 0) {
      const testData = {
        currentIndex: currentQuestionIndex,
        totalScore: totalScore,
        correctAnswers: correctAnswers,
        answers: testAnswers,
        difficultyLevel: difficultyLevel,
        elapsedTime: elapsedTime,
        timePerQuestion: timePerQuestion,
        startTime: startTime,
        isComplete: isTestComplete
      };
      localStorage.setItem('adaptiveTest', JSON.stringify(testData));
    }
  }, [currentQuestionIndex, totalScore, correctAnswers, testAnswers, difficultyLevel, elapsedTime, isTestComplete, timePerQuestion]);

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
    // Check for empty or whitespace-only answers
    if (!userAnswer || userAnswer.trim() === '') {
      return false; // Empty answers are always incorrect
    }
    
    if (!correctSolution || correctSolution.trim() === '') {
      return false; // No correct solution provided
    }

    const normalizeAnswer = (answer) => {
      return answer.toString()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[°]/g, '')
        .replace(/cm\^?2/g, 'cm²')
        .replace(/m\^?2/g, 'm²')
        .replace(/m\^?3/g, 'm³')
        .replace(/\$/g, '')
        .replace(/,/g, '');
    };

    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(correctSolution);

    // Check if normalized answers are empty after processing
    if (normalizedUser === '' || normalizedCorrect === '') {
      return false;
    }

    // Direct match
    if (normalizedUser === normalizedCorrect) return true;

    // Check for multiple possible answers
    if (normalizedCorrect.includes(' or ')) {
      const possibleAnswers = normalizedCorrect.split(' or ').map(ans => normalizeAnswer(ans.trim()));
      return possibleAnswers.some(ans => normalizedUser.includes(ans) || ans.includes(normalizedUser));
    }

    // Check for fraction equivalents
    try {
      const userNum = parseFloat(normalizedUser);
      const correctNum = parseFloat(normalizedCorrect);
      if (!isNaN(userNum) && !isNaN(correctNum)) {
        return Math.abs(userNum - correctNum) < 0.01;
      }
    } catch (e) {
      // Continue with string comparison
    }

    // Partial match for complex answers
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

      // Calculate points for this question
      const questionPoints = correct ? POINTS[currentQuestion.Difficulty] : 0;
      
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
        timeSpent: elapsedTime,
        timeToAnswer: timePerQuestion[currentQuestionIndex] || elapsedTime
      };

      const newTestAnswers = [...testAnswers];
      newTestAnswers[currentQuestionIndex] = answerData;
      setTestAnswers(newTestAnswers);

      // **ADAPTIVE DIFFICULTY ADJUSTMENT**
      adjustDifficulty(correct);

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
       
      // Get next question at the current (possibly adjusted) difficulty level
      const nextQuestion = getRandomQuestionAtDifficulty(difficultyLevel);
      setCurrentQuestion(nextQuestion);
      
      clearField();
      setIsCorrect(null);
    } else {
      // Test completed
      setIsTimerRunning(false);
      setIsTestComplete(true);

      // Get user ID from token
      const getUserIdFromToken = (token) => {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.userId || payload.sub || payload.id; // Adjust based on your token structure
        } catch (error) {
          console.error('Error parsing token:', error);
          return null;
        }
      };

      const userId = getUserIdFromToken(token);

      // Create API payload - transform testAnswers to match Answer model
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

      // Save to API
      saveTestResults(apiPayload)
        .then(response => {
          console.log('Test results saved to database:', response);
        })
        .catch(error => {
          console.error('Error saving test results:', error);
        });
      
      const userProgress = {
        userId: userId,
        subjectId: 1,
        questionsAttempted: 20,
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
                    <p><strong>Q{index + 1}:</strong> {answer.difficulty} ({POINTS[answer.difficulty]} pts)</p>
                    <p><strong>Your Answer:</strong> {answer.userAnswer}</p>
                    <p><strong>Correct Answer:</strong> {answer.correctAnswer}</p>
                    <p><strong>Points:</strong> {answer.pointsEarned}/{POINTS[answer.difficulty]}</p>
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
                {currentQuestion?.Difficulty || 'Medium'} ({POINTS[currentQuestion?.Difficulty || 'Medium']} pts)
              </span>
            </div>
            <div className="questionBlock">
              <strong>Question:</strong>
              <div className="questionText">
                {currentQuestion["Question Text"]}
              </div>
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
                  <p>Points Earned: {isCorrect ? POINTS[currentQuestion.Difficulty] : 0}/{POINTS[currentQuestion.Difficulty]}</p>
                  <p className="difficulty-change">
                    📊 Next Difficulty: <span className={`${difficultyLevel?.toLowerCase() || 'medium'}`}>{difficultyLevel}</span>
                  </p>
                </div>
              )}
              
              {feedback && (
                <div className="practice-feedback">
                  <strong>Detailed Feedback:</strong>
                  <div>
                    <strong>Solution Breakdown:</strong>
                    {currentQuestion["Solution Breakdown"]}
                  </div>
                  <button className="next-question-btn" onClick={goToNextQuestion}>
                    {currentQuestionIndex < TOTAL_QUESTIONS - 1 ? 'Next Question' : 'Finish Test'}
                  </button>
                </div>
              )}
              
              <div className="submissionButtons">
                <button className="ClearField" onClick={clearField}>Clear Field</button>
                {hint && (
                  <div className="practice-hint">
                    <strong>Hint:</strong>
                    <div>{renderFeedback(hint)}</div>
                  </div>
                )}
                {!hint && !feedback && (
                  <button className="practice-add-step" onClick={handleHint} disabled={loading}>
                    {hintload ? 'Loading...' : 'Need a Hint?'}
                  </button>
                )}
                {!feedback && (
                  <button className="practice-add-step" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Analyzing...' : 'Submit Answer'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MathJaxContext>
  );
};

export default AdaptiveTest;