import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import questions from './SetupQuestions';
import { useNavigate } from 'react-router-dom';
import { register } from './SetUpService';
import { login } from '../Authentication/AuthService';
import { toast } from 'react-toastify';
import './SetUp.css' // Assuming you have a questions.js file with your questions

const SetUp = () => {
    const location = useLocation();
    const initialAnswers = location.state || {};
    const [answers, setAnswers] = useState(initialAnswers);
    const [current, setCurrent] = useState(0);
    const [role, setRole] = useState(null);
    const navigate = useNavigate();

    const selectedRole = answers[questions[0].key] || role;

    const filteredQuestions = selectedRole
        ? questions.filter(q => q.roles.includes(selectedRole.toLowerCase()))
        : [questions[0]];

    const question = filteredQuestions[current];

    const handleBack = (e) => {
        e.preventDefault();
        if (current > 0) {
            setCurrent(current - 1);
        }
    };

    const handleChange = (key, value) => {
        setAnswers(prevAnswers => ({ ...prevAnswers, [key]: value }));
        if (key === questions[0].key) {
            setRole(value);
        }
    };

    const submitRegistration = async (ans) => {
        const payload = {
            Username: ans.username,
            Email: ans.email,
            FirstName: ans.firstName,
            LastName: ans.lastName,
            PasswordHash: ans.password,
            Role: ans.role,
            Birthdate: ans.DOB
        };
        try {
            const response = await register(payload);
            if (response.success || response.id || response.user || response.token) {
                const data = await login(ans.username, ans.password);
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    navigate('/studentdashboard');
                } else {
                    toast.error(data.message || 'Login failed — please try logging in manually');
                }
            } else {
                toast.error(response.message || 'Registration failed');
            }
        } catch (error) {
            let message = error.message || 'Error connecting to server';
            try {
                const parsed = JSON.parse(message);
                if (parsed.error?.includes('duplicate key') || parsed.error?.includes('23505')) {
                    message = 'An account with that email or username already exists. Please log in instead.';
                } else {
                    message = parsed.message || message;
                }
            } catch {}
            toast.error(message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await submitRegistration(answers);
    };

    const handleMultiSelect = (key, option) => {
        setAnswers(prevAnswers => {
            const selected = prevAnswers[key] || [];
            if (selected.includes(option)) {
                // Remove option
                return {
                    ...prevAnswers,
                    [key]: selected.filter(item => item !== option)
                };
            } else {
                // Add option
                return {
                    ...prevAnswers,
                    [key]: [...selected, option]
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
                    <li>Practice real exam questions</li>
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
                <div className="question-container" key={question.key}>
                    <label>{question.text}</label>
                    {question.type === 'text' && (
                        <input
                            type="text"
                            value={answers[question.key] || ''}
                            onChange={(e) => handleChange(question.key, e.target.value)}
                            required={question.required}
                        />
                    )}
                    {question.type === 'select' && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                            {question.options.map(option => (
                                <button
                                    key={option}
                                    type="button"
                                    className={answers[question.key] === option ? 'selected-btn' : ''}
                                    onClick={() => handleChange(question.key, option)}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '6px',
                                        border: answers[question.key] === option ? '2px solid #61dafb' : '1px solid #cfd8dc',
                                        background: answers[question.key] === option ? '#e3f7ff' : '#fff',
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
                            value={answers[question.key] || ''}
                            onChange={(e) => handleChange(question.key, e.target.value)}
                            required={question.required}
                        />
                    )}
                    {question.type === 'boolean' && (
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    value="true"
                                    checked={answers[question.key] === true}
                                    onChange={() => handleChange(question.key, true)}
                                    required={question.required}
                                /> Yes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="false"
                                    checked={answers[question.key] === false}
                                    onChange={() => handleChange(question.key, false)}
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
                                        checked={answers[question.key]?.includes(option) || false}
                                        onChange={() => handleMultiSelect(question.key, option)}
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
                                value={answers[question.key] || ''}
                                onChange={(e) => handleChange(question.key, e.target.value)}
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
                <button type="submit" disabled={current === 0 && !answers[questions[0].key]}>
                    {current < filteredQuestions.length - 1 ? 'Next' : 'Finish'}
                </button>
            </form>
        </div>
    );
}

export default SetUp;
