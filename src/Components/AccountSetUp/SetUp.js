import React, { useState } from 'react';
import questions from './SetupQuestions';
import '../../Styling/AccountSetUp/SetUp.css' // Assuming you have a questions.js file with your questions

const SetUp = () => {
    const [answers, setAnswers] = useState({});
    const [current, setCurrent] = useState(0);
    const [role, setRole] = useState(null);

    const selectedRole = answers[questions[0].id] || role;

    const filteredQuestions = selectedRole
        ? questions.filter(q => q.roles.includes(selectedRole.toLowerCase()))
        : [questions[0]];

    const question = filteredQuestions[current];

    if (!question) {
        return (
            <div>
                <h2>SetUp complete</h2>
                <p>Answers: {JSON.stringify(answers)}</p>
            </div>
        );
    }

    const handleBack = (e) => {
        e.preventDefault();
        if (current > 0) {
            setCurrent(current - 1);
        }
    };

    const handleChange = (id, value) => {
        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [id]: value
        }));

        if(id === questions[0].id){
            setRole(value);
            setCurrent(1);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Setup complete! Answers: ' + JSON.stringify(answers));
    };

    const handleMultiSelect = (id, option) => {
        setAnswers(prevAnswers => {
            const selected = prevAnswers[id] || [];
            if (selected.includes(option)) {
                // Remove option
                return {
                    ...prevAnswers,
                    [id]: selected.filter(item => item !== option)
                };
            } else {
                // Add option
                return {
                    ...prevAnswers,
                    [id]: [...selected, option]
                };
            }
        });
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (current < questions.length - 1) {
            setCurrent(current + 1);
        }
    };
    return (
        <form className="setup-form" onSubmit={current === questions.length - 1 ? handleSubmit : handleNext}>
                <div className="question-container" key={question.id}>
                    <label>{question.text}</label>
                    {question.type === 'text' && (
                        <input
                            type="text"
                            value={answers[question.id] || ''}
                            onChange={(e) => handleChange(question.id, e.target.value)}
                        />
                    )}
                    {question.type === 'select' && (
                        <select
                            value={answers[question.id] || ''}
                            onChange={(e) => handleChange(question.id, e.target.value)}
                            required
                        >
                            <option value="">Select...</option>
                            {question.options.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    )}
                    {question.type === 'date' && (
                        <input
                            type="date"
                            value={answers[question.id] || ''}
                            onChange={(e) => handleChange(question.id, e.target.value)}
                        />
                    )}
                    {question.type === 'boolean' && (
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    value="true"
                                    checked={answers[question.id] === true}
                                    onChange={() => handleChange(question.id, true)}
                                /> Yes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="false"
                                    checked={answers[question.id] === false}
                                    onChange={() => handleChange(question.id, false)}
                                /> No
                            </label>
                        </div>
                    )}
                    {question.type === 'multiselect' && (
                        <div>
                            {question.options.map(option => (
                                <label key={option} style={{ marginRight: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={answers[question.id]?.includes(option) || false}
                                        onChange={() => handleMultiSelect(question.id, option)}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    {current > 0 && (<button type="button" onClick={handleBack}>Back</button>)}
                </div>
            <button type="submit">{current < questions.length - 1 ? 'Next' : 'Finished'}</button>
        </form>
    );
}

export default SetUp;
