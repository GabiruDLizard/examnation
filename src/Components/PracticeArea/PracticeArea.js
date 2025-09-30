import React, { useState } from 'react';
import { askGPT } from '../../Worker/chat';
import { useParams } from 'react-router-dom';
import questions from '../data/generated_bgcs_questions_200_named_adjusted.json';
import { addStyles, EditableMathField } from 'react-mathquill';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import '../../Styling/PracticeArea/PracticeArea.css';
import { renderFeedback } from '../../Worker/feedbackRender';

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
};

addStyles(); // Loads MathQuill CSS

const PracticeArea = () => {
    const { id } = useParams();
    const question = questions.find(q => String(q['Question ID']) === String(id));

  const [steps, setSteps] = useState(['']);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const handleStepChange = (idx, latex) => {
    const newSteps = [...steps];
    newSteps[idx] = latex;
    setSteps(newSteps);
    console.log(latexString)
  };
  const handleSubmit = async () => {
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

  const latexString = steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');

  
  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <div className="practice-area-bg">
        <div className="practice-area-card">
          <h2 className="practice-title">{question?.UniqueName || "Practice Area"}</h2>
          <div className="practice-question-block">
            <strong>Question:</strong>
            <div className="practice-question-text">
              {/* Render with MathJax if needed */}
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
      </div>
    </MathJaxContext>
  );
};

export default PracticeArea;