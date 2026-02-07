import React, { useState, useRef, useEffect } from 'react';
import { askGPT } from '../../Worker/chat';
import { useParams, useNavigate } from 'react-router-dom';
import questions from '../data/generated_bgcs_questions_200_named_deduped.json';
import { addStyles, EditableMathField } from 'react-mathquill';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import './PracticeArea.css';
import { renderFeedback } from '../../Worker/feedbackRender';
import { needAHint } from '../../Worker/chat';
import DesmosGraph from '../DesmosGraph/DesmosGraph';
import InteractiveCartesianPlot from '../PlotlyGraph/PlotlyGraph';
import ClickToPlotChart from '../chartjs/Chartjs';

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
};
addStyles(); // Loads MathQuill CSS

const PracticeArea = () => {
  const stepReference = useRef([]);
  const { id } = useParams();
  const question = questions.find(q => String(q['Question ID']) === String(id));
  const [hint, setHint] = useState('');
  const [hintload, setHintload] = useState(false);
  const [steps, setSteps] = useState(['']);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [graphState, setGraphState] = useState(null);
  const [pointsInput, setPointsInput] = useState("");
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
    console.log(latexString)
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
    const submission = steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');
    const latexString = `Question: ${question["Question Text"]}\n\nUser Solution:\n${submission}`;
    setHintload(true);
    try{
        const response = await needAHint(latexString);
        setHint(response);
        setHintload(false);
    } catch (error) {
        console.error('Error fetching GPT response:', error);
        setHintload(false);
    }
    console.log(latexString);
    
    //const feedback = await askGPT(latexString);
    console.log(feedback);
  };
  const handleGraphStateChange = (graphState) => {
    setGraphState(graphState);
  };
  const handleSubmit = async () => {
    setIsTimerRunning(false);
    const finalTime = elapsedTime;
    console.log(`Time taken: ${formatTime(finalTime)}`);
    const submission = steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');
    const latexString = `Question: ${question["Question Text"]}\n\nUser Solution:\n${submission}`;
    setLoading(true);
    try{
        const response = await askGPT(latexString);
        setFeedback(response);
        setLoading(false);
    } catch (error) {
        console.error('Error fetching GPT response:', error);
        setLoading(false);
    }
    console.log(latexString);
    
    //const feedback = await askGPT(latexString);
    console.log(feedback);
  };
  if (!question) {
        return <div>Question not found</div>;
    }

  const addStep = () => setSteps([...steps, '']);

  const clearField = () => {
    setSteps(['']);
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
          <button onClick={goToPrevious} disabled={loading}>Previous question</button>
          <div className="timer">Time Elapsed: {formatTime(elapsedTime)}</div>
          <button onClick={goToNext} disabled={loading}>Next question</button>
          <button 
            onClick={() => navigate('/studentdashboard')} 
            title="Back to dashboard"
          >
            ←
          </button>
        </div>
        <div className="practiceareagrid">
          <div className= "questionCard">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <h2 className="practice-title">{question?.UniqueName || "Practice Area"}</h2>
              <span className={`question-difficulty ${question.Difficulty.toLowerCase()}`}>{question.Difficulty}</span>
            </div>
            <div className="questionBlock">
              <strong>Question:</strong>
              <div className="questionText">
                {question["Question Text"]}
              </div>
            </div>
          </div>
          <div className="answerBlock">
            {question?.Topic ==="Graphs" ? (
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
              {feedback && (
                <div className="practice-feedback">
                  <strong>Feedback:</strong>
                  <div>
                      {renderFeedback(feedback)}
                  </div>
                </div>
              )}
              <div className="submissionButtons">
                <button className="ClearField" onClick={clearField}>clear field</button>
                {hint && (
                  <div className="practice-hint">
                    <strong>Hint:</strong>
                    <div>
                        {renderFeedback(hint)}
                    </div>
                  </div>
                )}
                {!hint && (
                  <button className="practice-add-step" onClick={handleHint} disabled={loading}>
                    {hintload ? 'Loading...' : 'Need a Hint?'}
                  </button>
                )}
                {!feedback && (
                  <button className="practice-add-step" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Analyzing...' : 'Submit for Feedback'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="practice-area-bg">
        <div className="practice-area-card">
          <h2 className="practice-title">{question?.UniqueName || "Practice Area"}</h2>
          <div className="practice-question-block">
            <strong>Question:</strong>
            <div className="practice-question-text">
              {question["Question Text"]}
            </div>
          </div>
          <div className="practice-answer-block">
            <strong>Show Your Working:</strong>
            {steps.map((step, idx) => (
              <EditableMathField
                key={idx}
                latex={step}
                onChange={mf => handleStepChange(idx, mf.latex())}
                style={{
                  minHeight: 40,
                  width: '100%',
                  maxWidth: 600,
                  border: '1px solid #ccc',
                  padding: 8,
                  borderRadius: 4,
                  marginBottom: 8,
                  boxSizing: 'border-box',
                  background: '#fafafa'
                }}
                onKeyDown={e => handleKeyDown(e, idx)}
                mathquillDidMount={(field) => (stepReference.current[idx] = field)}
              />
            ))}
            <button className="practice-add-step" onClick={addStep}>Add Step</button>
            <button className="practice-add-step" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Analyzing...' : 'Submit for Feedback'}
            </button>
          </div>
          <div className="practice-latex-output">
            <strong>LaTeX Output:</strong>
            <ol>
              {steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
            {feedback && (
              <div className="practice-feedback">
                <strong>Feedback:</strong>
                <div>
                    {renderFeedback(feedback)}
                </div>
              </div>
            )}
        </div>
      </div> */}
    </MathJaxContext>
  );
};

export default PracticeArea;