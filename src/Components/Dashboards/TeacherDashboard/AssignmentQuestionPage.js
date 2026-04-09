import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { BiPlus, BiSave, BiX, BiBookOpen } from 'react-icons/bi';
import { createCompleteAssignment } from './AssignmentService';
import { createAssignmentQuestion, uploadQuestionImage } from './TeacherDashboardService';
import MathFieldEditor from './MathFieldEditor';
import QuestionLibrary from './QuestionLibrary';
import TopicComboInput, { DEFAULT_TOPICS } from './TopicComboInput';
import '../Assignments.css';
import './MathFieldEditor.css';
import './QuestionLibrary.css';

const AssignmentQuestionCreationPage = ({ onBack }) => {
    const [availableTopics, setAvailableTopics] = useState(DEFAULT_TOPICS);

    const handleTopicCreated = (newTopic) => {
        setAvailableTopics(prev => prev.includes(newTopic) ? prev : [...prev, newTopic]);
    };

    const [formData, setFormData] = useState({
        questionText: '',
        imageAssociated: null,
        difficultyLevel: 'Medium',
        topic: DEFAULT_TOPICS[0],
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
            } catch {
                return null;
            }
        }
        return null;
    });
    
    const [showLibrary, setShowLibrary] = useState(false);
    const [linkedCount, setLinkedCount] = useState(0);
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
            subject: formData.topic || assignmentData?.subject || 'General',
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
                    subject: formData.topic || assignmentData?.subject || 'General',
                    createdAt: new Date().toISOString()
                });
            }

            if (finalQuestionsArray.length === 0 && linkedCount === 0) {
                toast.warn('Please add at least one question to the assignment.');
                setIsSubmitting(false);
                return;
            }

            // Only call createCompleteAssignment if there are new questions to create
            if (finalQuestionsArray.length > 0) {
                const result = await createCompleteAssignment(assignmentData, finalQuestionsArray);
            }

            // Clear localStorage
            localStorage.removeItem('currentAssignmentData');

            const total = finalQuestionsArray.length + linkedCount;
            toast.success(`Assignment "${assignmentData?.title}" created successfully with ${total} question${total !== 1 ? 's' : ''}!`);
            
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

    const handleLibrarySelect = async (question) => {
        try {
            await createAssignmentQuestion({
                assignmentId: assignmentData.assignmentId,
                questionId: question.id,
                points: question.points || 1.0
            });
            setLinkedCount(prev => prev + 1);
            toast.success('Question linked to this assignment!');
        } catch (err) {
            toast.error('Failed to link question: ' + err.message);
        }
    };

    const handleReset = () => {
        setFormData({
            questionText: '',
            imageAssociated: null,
            difficultyLevel: 'Medium',
            topic: DEFAULT_TOPICS[0],
            answerType: 'Short Answer',
            multipleChoiceOptions: [],
            solution: '',
            answerBreakdown: '',
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

                            {/* Question Text */}
                            <div className="form-group">
                                <label>Question Text *</label>
                                <MathFieldEditor
                                    value={formData.questionText}
                                    onChange={(v) => setFormData({ ...formData, questionText: v })}
                                    placeholder="Type your question here…"
                                />
                            </div>

                            {/* Topic + Difficulty side by side */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Topic *</label>
                                    <TopicComboInput
                                        value={formData.topic}
                                        onChange={(v) => setFormData({ ...formData, topic: v })}
                                        availableTopics={availableTopics}
                                        onTopicCreated={handleTopicCreated}
                                    />
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
                                    {formData.multipleChoiceOptions.map((option, index) => {
                                        const opt = typeof option === 'string' ? { text: option, imageUrl: null } : option;
                                        const letter = String.fromCharCode(65 + index);
                                        return (
                                            <div key={index} className="mc-option-row">
                                                <span className="mc-option-letter">{letter}</span>
                                                <input
                                                    type="text"
                                                    value={opt.text}
                                                    onChange={(e) => {
                                                        const newOptions = [...formData.multipleChoiceOptions];
                                                        newOptions[index] = { ...opt, text: e.target.value };
                                                        setFormData({ ...formData, multipleChoiceOptions: newOptions });
                                                    }}
                                                    placeholder={`Option ${letter} text (optional if image)`}
                                                />
                                                <label className="mc-img-upload-btn" title="Add image to this option">
                                                    ＋ Image
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            try {
                                                                const url = await uploadQuestionImage(file);
                                                                const newOptions = [...formData.multipleChoiceOptions];
                                                                newOptions[index] = { ...opt, imageUrl: url };
                                                                setFormData({ ...formData, multipleChoiceOptions: newOptions });
                                                            } catch {
                                                                toast.error('Image upload failed');
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                {opt.imageUrl && (
                                                    <div className="mc-option-thumb">
                                                        <img src={opt.imageUrl} alt={`Option ${letter}`} />
                                                        <button
                                                            type="button"
                                                            className="mc-remove-img"
                                                            onClick={() => {
                                                                const newOptions = [...formData.multipleChoiceOptions];
                                                                newOptions[index] = { ...opt, imageUrl: null };
                                                                setFormData({ ...formData, multipleChoiceOptions: newOptions });
                                                            }}
                                                        >×</button>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    className="mc-remove-option"
                                                    onClick={() => {
                                                        const newOptions = formData.multipleChoiceOptions.filter((_, i) => i !== index);
                                                        setFormData({ ...formData, multipleChoiceOptions: newOptions });
                                                    }}
                                                >✕</button>
                                            </div>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setFormData({
                                            ...formData,
                                            multipleChoiceOptions: [...formData.multipleChoiceOptions, { text: '', imageUrl: null }]
                                        })}
                                    >
                                        + Add Option
                                    </button>
                                </div>
                            )}

                            {/* Correct Answer */}
                            <div className="form-group">
                                <label>Correct Answer *</label>
                                <MathFieldEditor
                                    value={formData.solution || ''}
                                    onChange={(v) => setFormData({ ...formData, solution: v })}
                                    placeholder="Enter the correct answer…"
                                />
                            </div>

                            {/* Solution steps */}
                            <div className="form-group">
                                <label>Solution Steps <span style={{fontWeight:400,color:'#94a3b8'}}>(shown to student after incorrect answer)</span></label>
                                <MathFieldEditor
                                    value={formData.answerBreakdown}
                                    onChange={(v) => setFormData({ ...formData, answerBreakdown: v })}
                                    placeholder="Step 1: …&#10;Step 2: …&#10;Step 3: …"
                                />
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
                                {(questionsArray.length > 0 || linkedCount > 0) && (
                                    <span className="aqp-queued-badge">
                                        {questionsArray.length + linkedCount} question{questionsArray.length + linkedCount !== 1 ? 's' : ''} queued
                                    </span>
                                )}
                            </div>
                            <div className="aqp-bar-right">
                                <button
                                    type="button"
                                    onClick={() => setShowLibrary(true)}
                                    className="aqp-btn-ghost"
                                    disabled={isSubmitting}
                                    title="Browse past questions"
                                >
                                    <BiBookOpen /> Browse Library
                                </button>
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

            {showLibrary && (
                <QuestionLibrary
                    excludeAssignmentId={assignmentData?.assignmentId}
                    onSelect={handleLibrarySelect}
                    onClose={() => setShowLibrary(false)}
                />
            )}
        </div>
    );
}

export default AssignmentQuestionCreationPage;

