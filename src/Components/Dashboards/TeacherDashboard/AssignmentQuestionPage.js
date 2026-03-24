import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { BiPlus, BiSave, BiX } from 'react-icons/bi';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import { createCompleteAssignment } from './AssignmentService';
import MathToolbar from './MathToolbar';
import MathInput from './MathInput';
import '../Assignments.css';
import './MathToolbar.css';
import './MathInput.css';

const mathJaxConfig = {
    loader: { load: ['input/tex', 'output/chtml'] },
};

// Convert $...$ inline delimiters → \(...\) which MathJax 3 always handles
const toMJ = (str) => (str || '').replace(/\$([^$\n]+)\$/g, '\\($1\\)');

const TOPICS = [
    'Number Properties', 'Percentages', 'Ratios & Proportions',
    'Speed/Distance/Time', 'Algebra (Linear Equations)',
    'Algebra (Simultaneous Equations)', 'Algebra (Quadratics)',
    'Algebra (Algebraic Fractions)', 'Sequences', 'Functions',
    'Coordinate Geometry', 'Graphs', 'Geometry (Angles/Triangles)',
    'Geometry (Circles/Area)', 'Mensuration (Area/Volume)',
    'Trigonometry', 'Statistics (Mean/Median/Mode)',
    'Probability', 'Matrices', 'Vectors'
];

const AssignmentQuestionCreationPage = ({ onBack }) => {
    const questionTextRef = useRef(null);
    const breakdownRef = useRef(null);

    const [formData, setFormData] = useState({
        questionText: '',
        imageAssociated: null,
        difficultyLevel: 'Medium',
        topic: TOPICS[0],
        answerType: 'Short Answer',
        multipleChoiceOptions: [],
        solution: '',
        answerBreakdown: '',
        points: 1.0
    });
    const [questionsArray, setQuestionsArray] = useState([]); // Store all questions
    
    // Load assignment data from localStorage immediately during initialization
    const [assignmentData, setAssignmentData] = useState(() => {
        const savedAssignmentData = localStorage.getItem('currentAssignmentData');
        if (savedAssignmentData) {
            try {
                const parsed = JSON.parse(savedAssignmentData);
                return parsed;
            } catch (error) {
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
                toast.warn('Please add at least one question to the assignment.');
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
            
            
            // Call the real API to create complete assignment with questions
            const result = await createCompleteAssignment(assignmentData, finalQuestionsArray);
            
            // Clear localStorage
            localStorage.removeItem('currentAssignmentData');
            
            toast.success(`Assignment "${assignmentData?.title}" created successfully with ${finalQuestionsArray.length} questions!`);
            
            // Go back using callback
            if (onBack) {
                onBack();
            }
            
        } catch (error) {
            toast.error('Error creating assignment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            questionText: '',
            imageAssociated: null,
            difficultyLevel: 'Medium',
            topic: TOPICS[0],
            answerType: 'Short Answer',
            multipleChoiceOptions: [],
            solution: '',
            answerBreakdown: '',
            points: 1.0
        });
    };

    return (
      <MathJaxContext version={3} config={mathJaxConfig}>
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

                            {/* Question Text */}
                            <div className="form-group">
                                <label>Question Text *</label>
                                <textarea
                                    ref={questionTextRef}
                                    className="math-textarea-field"
                                    value={formData.questionText || ''}
                                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                    required
                                    rows={4}
                                    placeholder="Type your question here…"
                                />
                                <MathToolbar textareaRef={questionTextRef} />
                                {formData.questionText && (
                                    <div className="math-preview">
                                        <div className="math-preview-label">Preview</div>
                                        <MathJax dynamic>{toMJ(formData.questionText)}</MathJax>
                                    </div>
                                )}
                            </div>

                            {/* Topic + Difficulty side by side */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Topic *</label>
                                    <select
                                        value={formData.topic}
                                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                        required
                                    >
                                        {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Difficulty *</label>
                                    <select
                                        value={formData.difficultyLevel}
                                        onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                                    >
                                        <option value="Very Easy">Very Easy</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                        <option value="Very Hard">Very Hard</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Points *</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        value={formData.points}
                                        onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) })}
                                    />
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
                            </div>

                            {/* Multiple choice options */}
                            {formData.answerType === 'Multiple Choice' && (
                                <div className="form-group">
                                    <label>Answer Options</label>
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
                                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                            style={{ marginBottom: 6 }}
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setFormData({
                                            ...formData,
                                            multipleChoiceOptions: [...formData.multipleChoiceOptions, '']
                                        })}
                                    >
                                        + Add Option
                                    </button>
                                </div>
                            )}

                            {/* Correct Answer */}
                            <div className="form-group">
                                <label>Correct Answer *</label>
                                <MathInput
                                    mode="math"
                                    value={formData.solution || ''}
                                    onChange={(v) => setFormData({ ...formData, solution: v })}
                                    required
                                />
                            </div>

                            {/* Solution steps */}
                            <div className="form-group">
                                <label>Solution Steps <span style={{fontWeight:400,color:'#94a3b8'}}>(shown to student after incorrect answer)</span></label>
                                <textarea
                                    ref={breakdownRef}
                                    className="math-textarea-field"
                                    value={formData.answerBreakdown || ''}
                                    onChange={(e) => setFormData({ ...formData, answerBreakdown: e.target.value })}
                                    rows={5}
                                    placeholder={'Step 1: …\nStep 2: …\nStep 3: …'}
                                />
                                <MathToolbar textareaRef={breakdownRef} />
                                {formData.answerBreakdown && (
                                    <div className="math-preview">
                                        <div className="math-preview-label">Preview</div>
                                        <MathJax dynamic>{toMJ(formData.answerBreakdown)}</MathJax>
                                    </div>
                                )}
                            </div>

                            {/* Image upload */}
                            <div className="form-group">
                                <label>Figure / Image (optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFormData({ ...formData, imageAssociated: e.target.files[0] })}
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
                        
                        <div className="aqp-sticky-bar">
                            <div className="aqp-bar-left">
                                {questionsArray.length > 0 && (
                                    <span className="aqp-queued-badge">
                                        {questionsArray.length} question{questionsArray.length !== 1 ? 's' : ''} queued
                                    </span>
                                )}
                            </div>
                            <div className="aqp-bar-right">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="aqp-btn-ghost"
                                    disabled={isSubmitting}
                                    title="Clear this question"
                                >
                                    <BiX /> Reset
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddMore}
                                    className="aqp-btn-secondary"
                                    disabled={isSubmitting || !formData.questionText.trim()}
                                >
                                    <BiPlus /> Add Another
                                </button>
                                <button
                                    type="submit"
                                    className="aqp-btn-primary"
                                    disabled={isSubmitting}
                                >
                                    <BiSave />
                                    {isSubmitting ? 'Creating…' : 'Finish & Create'}
                                </button>
                            </div>
                        </div>
                    </form>
                </>
            )}
        </div>
      </MathJaxContext>
    );
}

export default AssignmentQuestionCreationPage;

