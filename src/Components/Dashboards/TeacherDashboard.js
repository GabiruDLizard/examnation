import React, { useState } from 'react';
import { addStyles, EditableMathField } from 'react-mathquill';

addStyles(); // Loads MathQuill CSS

const TeacherDashboard = () => {
  const [steps, setSteps] = useState(['']);
  const handleStepChange = (idx, latex) => {
    const newSteps = [...steps];
    newSteps[idx] = latex;
    setSteps(newSteps);
    console.log(latexString)
  };

  const addStep = () => setSteps([...steps, '']);

  const latexString = steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n');

  return (
    <div style={{ padding: 32 }}>
      <h2>Show Your Working</h2>
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
            boxSizing: 'border-box'
          }}
        />
      ))}
      <button onClick={addStep} style={{ marginTop: 8 }}>Add Step</button>
      <div style={{ marginTop: 16 }}>
        <strong>LaTeX Output:</strong>
        <ol>
          {steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default TeacherDashboard;