import React, { useState, useEffect } from 'react';
import { BiPlus, BiBarChart, BiEdit, BiTrendingUp, BiCalendar, BiFile, BiGroup, BiSave, BiX, BiArrowBack, BiBrain, BiBullseye } from 'react-icons/bi';
import { createCompleteAssignment } from './AssignmentService';
import '../Assignments.css';

const AssignmentQuestionCreationPage = ({ onBack }) => {
    const [formData, setFormData] = useState({
        questionText: '',
        imageAssociated: null,
        difficultyLevel: 1,
        answerType: 'Short Answer',
        multipleChoiceOptions: [],
        points: 1.0
    });
    const [questionsArray, setQuestionsArray] = useState([]); // Store all questions
    
    // Load assignment data from localStorage immediately during initialization
    const [assignmentData, setAssignmentData] = useState(() => {
        const savedAssignmentData = localStorage.getItem('currentAssignmentData');
        if (savedAssignmentData) {
            try {
                return JSON.parse(savedAssignmentData);
            } catch (error) {
                console.error('❌ Error parsing assignment data from localStorage:', error);
                return null;
            }
        }
        return null;
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(() => {
        // Set error state based on whether we have assignment data
        const savedAssignmentData = localStorage.getItem('currentAssignmentData');
        return savedAssignmentData ? null : 'No assignment data found. Please create an assignment first.';
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddingImgDescription, setIsAddingImgDescription] = useState(false);

    const handleAddMore = () => {
        // Add current formData to questions array
        const newQuestion = {
            id: Date.now(), // Simple ID generation
            ...formData,
            subject: assignmentData?.subject || 'General',
            createdAt: new Date().toISOString()
        };
        
        setQuestionsArray(prev => [...prev, newQuestion]);
        
        // Reset form for next question
        handleReset();
        
        console.log('Question added to array:', newQuestion);
        console.log('Total questions:', questionsArray.length + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            // Add current form data to array if it has content
            let finalQuestionsArray = [...questionsArray];
            if (formData.questionText.trim()) {
                finalQuestionsArray.push({
                    id: Date.now(),
                    ...formData,
                    subject: assignmentData?.subject || 'General',
                    createdAt: new Date().toISOString()
                });
            }

            if (finalQuestionsArray.length === 0) {
                alert('Please add at least one question to the assignment.');
                setIsSubmitting(false);
                return;
            }

            // Combine assignment data with questions
            const completeAssignment = {
                ...assignmentData,
                questions: finalQuestionsArray,
                totalQuestions: finalQuestionsArray.length,
                completedAt: new Date().toISOString()
            };
            
            console.log('Complete assignment for submission:', completeAssignment);
            
            // Call the real API to create complete assignment with questions
            const result = await createCompleteAssignment(assignmentData, finalQuestionsArray);
            console.log('✅ Assignment created successfully:', result);
            
            // Clear localStorage
            localStorage.removeItem('currentAssignmentData');
            
            alert(`Assignment "${assignmentData?.title}" created successfully with ${finalQuestionsArray.length} questions!`);
            
            // Go back using callback
            if (onBack) {
                onBack();
            }
            
        } catch (error) {
            console.error('Error creating complete assignment:', error);
            alert('Error creating assignment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            questionText: '',
            imageAssociated: null,
            difficultyLevel: 1,
            answerType: 'Short Answer',
            multipleChoiceOptions: [],
            points: 1.0
        });
    };

    return (
        <div className="assignment-question-page">
            {loading && (
                <div className="loading-state">
                    <h2>Loading Assignment Data...</h2>
                </div>
            )}

            {error && (
                <div className="error-state">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={() => onBack && onBack()}>Go Back</button>
                </div>
            )}

            {!loading && !error && assignmentData && (
                <>
                    <div className="assignment-info">
                        <h2>Add Questions to: {assignmentData.title}</h2>
                        <div className="assignment-meta">
                            <span>Subject: {assignmentData.subject}</span>
                            <span>Grade: {assignmentData.grade}</span>
                            <span>Due: {assignmentData.dueDate}</span>
                            <span>Duration: {assignmentData.duration} minutes</span>
                        </div>
                    </div>

                    <form className="assignment-question-form" onSubmit={handleSubmit}>
                        <div className="form-sections">
                            <div className="form-group">
                                <label>Question Text</label>
                                <textarea
                                    value={formData.questionText || ''}
                                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                    required
                                    placeholder='Enter the question text here...'
                                />
                            </div>

                            <div className="form-group">
                                <label>Image Associated (optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setFormData({ ...formData, imageAssociated: e.target.files[0] })}
                                />
                                <label className="file-hint">Accepted formats: JPG, PNG, GIF. Max size: 5MB.</label>
                                <input
                                    type="checkbox"
                                    checked={isAddingImgDescription}
                                    onChange={(e) => setIsAddingImgDescription(e.target.checked)}
                                /> Add Image Description
                                {isAddingImgDescription && (
                                    <textarea
                                        value={formData.imageDescription || ''}
                                        onChange={(e) => setFormData({ ...formData, imageDescription: e.target.value })}
                                        placeholder="Enter image description for accessibility"
                                    />
                                )}
                            </div>

                            <div className="form-group">
                                <label>Difficulty Level</label>
                                <select
                                    value={formData.difficultyLevel}
                                    onChange={(e) => setFormData({ ...formData, difficultyLevel: parseInt(e.target.value) })}
                                >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                    <option value={5}>5</option>   
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Answer Type</label>
                                <select
                                    value={formData.answerType}
                                    onChange={(e) => setFormData({ ...formData, answerType: e.target.value })}
                                >
                                    <option value="Short Answer">Short Answer</option>
                                    <option value="Multiple Choice">Multiple Choice</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Points</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    value={formData.points}
                                    onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) })}
                                    placeholder="Question points value"
                                />
                            </div>

                            {formData.answerType === 'Multiple Choice' && (
                                <div className="form-group">
                                    <label>Multiple Choice Options</label>
                                    {formData.multipleChoiceOptions.map((option, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...formData.multipleChoiceOptions];
                                                newOptions[index] = e.target.value;
                                                setFormData({ ...formData, multipleChoiceOptions: newOptions });
                                            }}
                                            placeholder={`Option ${index + 1}`}
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ 
                                            ...formData, 
                                            multipleChoiceOptions: [...formData.multipleChoiceOptions, ''] 
                                        })}
                                    >
                                        Add Option
                                    </button>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Solution *</label>
                                <textarea
                                    value={formData.solution || ''}
                                    onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                                    placeholder='Enter the solution or answer here...'
                                    required
                                />
                                <label>Answer Breakdown (optional)</label>
                                <textarea
                                    value={formData.answerBreakdown || ''}
                                    onChange={(e) => setFormData({ ...formData, answerBreakdown: e.target.value })}
                                    placeholder='Enter the answer breakdown here...'
                                />
                            </div>
                        </div>

                        {/* Show added questions
                        {questionsArray.length > 0 && (
                            <div className="added-questions">
                                <h3>Added Questions ({questionsArray.length})</h3>
                                {questionsArray.map((question, index) => (
                                    <div key={question.id} className="question-preview">
                                        <div className="question-header">
                                            <span className="question-number">Q{index + 1}</span>
                                            <span className="question-difficulty">
                                                {question.difficultyLevel === 1 ? 'Easy' : 
                                                 question.difficultyLevel === 2 ? 'Medium' : 'Hard'}
                                            </span>
                                            <span className="question-type">{question.answerType}</span>
                                        </div>
                                        <div className="question-text">{question.questionText}</div>
                                        {question.answerType === 'Multiple Choice' && question.multipleChoiceOptions.length > 0 && (
                                            <div className="question-options">
                                                {question.multipleChoiceOptions.map((option, optIndex) => (
                                                    <div key={optIndex} className="option">• {option}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )} */}
                        
                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="btn-secondary"
                                disabled={isSubmitting}
                            >
                                <BiX /> Reset
                            </button>
                            <button
                                type="button"
                                onClick={handleAddMore}
                                className="btn-secondary"
                                disabled={isSubmitting || !formData.questionText.trim()}
                            >
                                <BiPlus />Add More ({questionsArray.length} added)
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isSubmitting}
                            >
                                <BiSave />
                                {isSubmitting ? 'Creating...' : 'Create Assignment'}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}

export default AssignmentQuestionCreationPage;

