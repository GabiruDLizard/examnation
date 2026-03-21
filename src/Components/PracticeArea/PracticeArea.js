import React, { useState, useRef, useEffect } from 'react';
import { askGPT } from '../../Worker/chat';
import { useParams, useNavigate } from 'react-router-dom';
import questions from '../data/generated_bgcs_questions_200_named_deduped.json';
import { addStyles, EditableMathField } from 'react-mathquill';
import { MathJaxContext } from 'better-react-mathjax';
import './PracticeArea.css';
import { renderFeedback, renderQuestionText } from '../../Worker/feedbackRender';
import { needAHint } from '../../Worker/chat';
import DesmosGraph from '../DesmosGraph/DesmosGraph';

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
};
addStyles(); // Loads MathQuill CSS

const getAnswerFormatHint = (solution) => {
  if (!solution) return null;
  const s = solution.trim();

  if (/\(a\)/i.test(s))                                              return { text: 'Answer each part separately, labelled (a), (b), etc.',  example: '(a) 12   (b) x = 3' };
  if (/\$/.test(s))                                                  return { text: 'Give your answer in dollars.',                           example: '$12.50' };
  if (/^\d[\d\s]*:\s*\d[\d\s]*$/.test(s))                           return { text: 'Give your answer as a ratio in the form a : b.',         example: '3 : 4' };
  if (/^\([-\d.,\s]+\)$/.test(s))                                   return { text: 'Give your answer as coordinates.',                       example: '(2, 5)' };
  if (/\d+\.?\d*\s*[x×]\s*10\^/.test(s))                           return { text: 'Give your answer in standard form.',                     example: '3.2 × 10³' };
  if (/^[a-z0-9]+\^[\{]?[\w-]+[\}]?$/i.test(s))                   return { text: 'Give your answer in index form.',                        example: '2⁶' };
  if (/\^\d.*[×x×]|[×x×].*\^\d/.test(s))                          return { text: 'Express as a product of prime factors in index form.',   example: '2² × 3 × 5' };
  if (/°/.test(s))                                                   return { text: 'Give your answer in degrees.',                           example: '45°' };
  if (/\d\s*(cm²?|m²?|km|kg|g|ml|L|s|hours?|minutes?)\b/i.test(s)) return { text: 'Include appropriate units in your answer.',             example: '12 cm' };
  if (/^\d+\/\d+$/.test(s))                                         return { text: 'Give your answer as a fraction in its simplest form.',   example: '3/4' };
  if (/,/.test(s))                                                   return { text: 'List all values separated by commas.',                   example: '2, 4, 6, 8' };
  if (/^-?\d+(\.\d+)?$/.test(s))                                    return { text: 'Give your answer as a single number.',                   example: '42' };
  return null;
};

const PracticeArea = () => {
  const stepReference = useRef([]);
  const { id } = useParams();
  const question = questions.find(q => String(q['Question ID']) === String(id));
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
  const [, setPointsInput] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Start timer when component mounts
    setStartTime(Date.now());
    setIsTimerRunning(true);
    setElapsedTime(0);
  }, [id]);

  useEffect(() => {
    let timer = null;
    if (isTimerRunning && startTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, startTime]);

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
  };
  const handleKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Insert a new step after current
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
    const workingSteps = steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');
    const hintString = `Question: ${question["Question Text"]}\n\nStudent Working:\n${workingSteps}\n\nCurrent Final Answer: ${finalAnswer}`;
    setHintload(true);
    try{
        const response = await needAHint(hintString);
        setHint(response);
        setHintload(false);
    } catch (error) {
        console.error('Error fetching GPT response:', error);
        setHintload(false);
    }
  };
  const handleGraphStateChange = (graphState) => {
    setGraphState(graphState);
  };
  const handleSubmit = async () => {
    setIsTimerRunning(false);
    const workingSteps = steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');
    const submissionString = `Question: ${question["Question Text"]}\n\nStudent Working:\n${workingSteps}\n\nFinal Answer: ${finalAnswer}`;
    setLoading(true);
    setHint(''); // Clear hint when submitting
    try{
        const response = await askGPT(submissionString);
        setFeedback(response);
        setLoading(false);
    } catch (error) {
        console.error('Error fetching GPT response:', error);
        setLoading(false);
    }
  };
  if (!question) {
        return <div>Question not found</div>;
    }

  const addStep = () => setSteps([...steps, '']);

  const clearField = () => {
    setSteps(['']);
    setFinalAnswer('');
    setFeedback('');
    setHint('');
    setGraphState(null);
  }

  const latexString = steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');

  // Find current question index
  const currentIndex = questions.findIndex(q => String(q['Question ID']) === String(id));

  // Calculate previous and next question IDs
  const previousQuestionId = currentIndex > 0 ? questions[currentIndex - 1]['Question ID'] : null;
  const nextQuestionId = currentIndex < questions.length - 1 ? questions[currentIndex + 1]['Question ID'] : null;

  // Navigation handlers
  const goToPrevious = () => {
    if (previousQuestionId) {
      clearField();
      navigate(`/practice/${previousQuestionId}`);
    }
  };

  const goToNext = () => {
    if (nextQuestionId) {
      clearField();
      navigate(`/practice/${nextQuestionId}`);
    }
  };

  
  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <div className = "practicebg">
        <div className="practice-navigation">
          <button className="nav-btn" onClick={goToPrevious} disabled={!previousQuestionId || loading}>← Prev</button>
          <div className="timer">Time Elapsed: {formatTime(elapsedTime)}</div>
          <button className="nav-btn" onClick={goToNext} disabled={!nextQuestionId || loading}>Next →</button>
          <button className="nav-btn" onClick={() => navigate('/exampage')} title="Back to question list">Question List</button>
        </div>
        <div className="practiceareagrid"> 
          {/* Question Panel - LeetCode Style */}
          <div className="questionCard">
            <div className="question-header">
              <div className="question-title">
                {question?.UniqueName || "Practice Problem"}
                <span className={`difficulty-badge ${question.Difficulty.toLowerCase()}`}>
                  {question.Difficulty}
                </span>
              </div>
            </div>
            <div className="question-content">
              <div className="problem-statement">
                <h4>Problem</h4>
                <div className="questionText">
                  {renderQuestionText(question["Question Text"])}
                </div>
                <div className="question-image">
                  {question["Image URL"] && <img src={question["Image URL"]} alt="Question Visual" />}
                </div>
                {(() => { const h = getAnswerFormatHint(question.Solution); return h && (
                  <div className="answer-format-hint">
                    <span className="answer-format-text">{h.text}</span>
                    <span className="answer-format-example">e.g. {h.example}</span>
                  </div>
                ); })()}
              </div>
            </div>
          </div>
          {/* Solution Panel - LeetCode Style */}
          <div className="answerBlock">
            <div className="solution-tabs">
              <div className="tab active">Solution</div>
              <div className="tab-actions">
                <button className="clear-btn" onClick={clearField}>Clear</button>
                {!hint ? (
                  <button className="hint-btn" onClick={handleHint} disabled={loading}>
                    {hintload ? 'Loading...' : 'Get Hint'}
                  </button>
                ) : (
                  <button className="clear-hint-btn" onClick={() => setHint('')}>
                    Clear Hint
                  </button>
                )}
                {!feedback && (
                  <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Analyzing...' : 'Submit'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="solution-content">
              {question?.Topic === "Graphs" ? (
                <div className="workingBlock">
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
                      onInputChange={setPointsInput}
                    />
                  </div>
                </div>
              ) : (
                <div className="workingBlock">
                  <div className="work-area">
                    <div className="work-header">
                      <span className="work-label">Show Your Work</span>
                    </div>
                    <div className="answerText">
                      {steps.map((step, idx) => (
                        <div key={idx} className="step-row">
                          <span className="step-number">{idx + 1}.</span>
                          <EditableMathField
                            latex={step}
                            onChange={mf => handleStepChange(idx, mf.latex())}
                            className="step-input"
                            onKeyDown={e => handleKeyDown(e, idx)}
                            mathquillDidMount={field => (stepReference.current[idx] = field)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="final-answer-container">
                    <div className="final-answer-header">
                      <span className="final-answer-label">Final Answer</span>
                    </div>
                    <EditableMathField
                      latex={finalAnswer}
                      onChange={mf => setFinalAnswer(mf.latex())}
                      className="final-answer-input"
                      placeholder="Enter your final answer here..."
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Console/Action Area */}
            <div className="console-area">
              {feedback && (
                <div className="console-output feedback-output">
                  <div className="console-header">Feedback</div>
                  <div className="console-content">
                    {renderFeedback(feedback)}
                  </div>
                </div>
              )}
              
              {hint && (
                <div className="console-output hint-output">
                  <div className="console-header">Hint</div>
                  <div className="console-content">
                    {renderFeedback(hint)}
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

export default PracticeArea;