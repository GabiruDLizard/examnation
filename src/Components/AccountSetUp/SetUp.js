import React, { useState } from 'react';


const SetUp = () => {
    const [answers, setAnswers] = useState({});

    const handleChange = (id, value) => {
        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [id]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(answers);
    };

    return (
        <form onSubmit={handleSubmit}>
            {questions.map(question => (
                <div key={question.id}>
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
                        >
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
                </div>
            ))}
            <button type="submit">Submit</button>
        </form>
    );
}

const DynamicSetUp = () => {
    const [answers, setAnswers] = useState({});

    const handleChange = (id, value) => {
        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [id]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(answers);
    };

    return (
        <form onSubmit={handleSubmit}>
            {questions.map(question => (
                <div key={question.id}>
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
                        >
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
                </div>
            ))}
            <button type="submit">Submit</button>
        </form>
    );
};
export default SetUp;
