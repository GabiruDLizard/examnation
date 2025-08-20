import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import questions from './SetupQuestions';
import { useNavigate } from 'react-router-dom';
import '../../Styling/AccountSetUp/SetUp.css' // Assuming you have a questions.js file with your questions

const SetUp = () => {
    const location = useLocation();
    const initialAnswers = location.state || {};
    const [answers, setAnswers] = useState(initialAnswers);
    const [current, setCurrent] = useState(0);
    const [role, setRole] = useState(null);
    const navigate = useNavigate();

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
        navigate('/studentdashboard', {state: answers});
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
        if (current < filteredQuestions.length - 1) {
            setCurrent(current + 1);
        }
    };

    return (
        <div className="setup-flexpage">
            <article className="setup-welcome">
                <h2>Welcome to Examnation!</h2>
                <p>
                    We’re excited to help you prepare for your exams.  
                    This quick setup will personalize your experience and recommend the best resources for you.  
                    Answer each question to get started, and feel free to explore our dashboard once you’re done!
                </p>
                <ul>
                    <li>Practice real CXC questions</li>
                    <li>Track your progress</li>
                    <li>Get personalized recommendations</li>
                </ul>
                <p>
                    Let’s get started!
                </p>
            </article>
            <form className="setup-form" onSubmit={current === filteredQuestions.length - 1 ? handleSubmit : handleNext}>
                {current > 0 && (
                    <button type="button" className="setup-back-btn" onClick={handleBack}>
                        &#8592; Back
                    </button>
                )}
                <div className="question-container" key={question.id}>
                    <label>{question.text}</label>
                    {question.type === 'text' && (
                        <input
                            type="text"
                            value={answers[question.id] || ''}
                            onChange={(e) => handleChange(question.id, e.target.value)}
                            required={question.required}
                        />
                    )}
                    {question.type === 'select' && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                            {question.options.map(option => (
                                <button
                                    key={option}
                                    type="button"
                                    className={answers[question.id] === option ? 'selected-btn' : ''}
                                    onClick={() => handleChange(question.id, option)}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '6px',
                                        border: answers[question.id] === option ? '2px solid #61dafb' : '1px solid #cfd8dc',
                                        background: answers[question.id] === option ? '#e3f7ff' : '#fff',
                                        color: '#282c34',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}
                    {question.type === 'date' && (
                        <input
                            type="date"
                            value={answers[question.id] || ''}
                            onChange={(e) => handleChange(question.id, e.target.value)}
                            required={question.required}
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
                                    required={question.required}
                                /> Yes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="false"
                                    checked={answers[question.id] === false}
                                    onChange={() => handleChange(question.id, false)}
                                    required={question.required}
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
                                        required={question.required}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    )}
                    {question.type === 'number' && (
                        <div>
                            <input
                                type="number"
                                value={answers[question.id] || ''}
                                onChange={(e) => handleChange(question.id, e.target.value)}
                                required={question.required}
                                min="0"
                                style={{ width: '100%', padding: '10px 12px', marginBottom: '18px', borderRadius: '6px', border: '1px solid #cfd8dc' }}
                            />
                        </div>
                    )}
                </div>
                {/* <div>
                    {current > 0 && (<button type="button" onClick={handleBack}>Back</button>)}
                </div> */}
                <button type="submit">
                    {filteredQuestions.length === 1 || current < filteredQuestions.length - 1 ? 'Next' : 'Finished'}
                </button>
            </form>
        </div>
    );
}

export default SetUp;
