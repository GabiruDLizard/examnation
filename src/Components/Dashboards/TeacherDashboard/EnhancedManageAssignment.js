import React, { useState, useEffect } from 'react';
import MathText from '../../Shared/MathText';
import Swal from 'sweetalert2';
import { BiPlus, BiEdit, BiTrash, BiSave, BiX, BiArrowBack, BiFile, BiTime, BiBarChart, BiBookOpen, BiTarget } from 'react-icons/bi';
import { updateAssignment, getAssignmentQuestionsById, saveQuestionToAssignment, deleteQuestionFromAssignment, updateQuestionInAssignment, createAssignmentQuestion } from './TeacherDashboardService';
import MathFieldEditor from './MathFieldEditor';
import QuestionLibrary from './QuestionLibrary';
import TopicComboInput, { DEFAULT_TOPICS } from './TopicComboInput';
import '../Assignments.css';
import './MathFieldEditor.css';
import './QuestionLibrary.css';


const addMultipleChoiceOption = (questionData, setQuestionData) => {
    setQuestionData({ ...questionData, multipleChoiceOptions: [...questionData.multipleChoiceOptions, ''] });
};

const updateMultipleChoiceOption = (questionData, setQuestionData, index, value) => {
    const newOptions = [...questionData.multipleChoiceOptions];
    newOptions[index] = value;
    setQuestionData({ ...questionData, multipleChoiceOptions: newOptions });
};

const removeMultipleChoiceOption = (questionData, setQuestionData, index) => {
    setQuestionData({ ...questionData, multipleChoiceOptions: questionData.multipleChoiceOptions.filter((_, i) => i !== index) });
};

const QuestionForm = ({ questionData, setQuestionData, onSubmit, onCancel, submitLabel, topicList, onTopicCreated, loading }) => (
    <div className="question-form">
        <div className="form-group">
            <label>Question Text *</label>
            <MathFieldEditor
                value={questionData.questionText}
                onChange={(v) => setQuestionData({ ...questionData, questionText: v })}
                placeholder="Enter the question text…"
            />
        </div>

        <div className="form-row">
            <div className="form-group">
                <label>Answer Type</label>
                <select
                    value={questionData.answerType}
                    onChange={(e) => setQuestionData({ ...questionData, answerType: e.target.value })}
                >
                    <option value="Short Answer">Short Answer</option>
                    <option value="Multiple Choice">Multiple Choice</option>
                </select>
            </div>

            <div className="form-group">
                <label>Difficulty Level</label>
                <select
                    value={questionData.difficultyLevel}
                    onChange={(e) => setQuestionData({ ...questionData, difficultyLevel: parseInt(e.target.value) })}
                >
                    <option value={1}>1 - Easy</option>
                    <option value={2}>2 - Medium</option>
                    <option value={3}>3 - Medium-Hard</option>
                    <option value={4}>4 - Hard</option>
                    <option value={5}>5 - Very Hard</option>
                </select>
                <small style={{ color: '#64748b', fontSize: '11px' }}>Used for readiness tracking</small>
            </div>

            <div className="form-group">
                <label>Topic / Subject</label>
                <TopicComboInput
                    value={questionData.subject || ''}
                    onChange={(v) => setQuestionData({ ...questionData, subject: v })}
                    availableTopics={topicList}
                    onTopicCreated={onTopicCreated}
                />
            </div>

            <div className="form-group">
                <label>Points</label>
                <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={questionData.points}
                    onChange={(e) => setQuestionData({ ...questionData, points: Math.min(10, parseFloat(e.target.value) || 0.5) })}
                />
                <small style={{ color: '#64748b', fontSize: '11px' }}>Counts toward assignment grade (max 10)</small>
            </div>
        </div>

        {questionData.answerType === 'Multiple Choice' && (
            <div className="form-group">
                <label>Multiple Choice Options</label>
                <div className="multiple-choice-options">
                    {questionData.multipleChoiceOptions.map((option, index) => (
                        <div key={index} className="option-input">
                            <MathFieldEditor
                                value={option}
                                onChange={(v) => updateMultipleChoiceOption(questionData, setQuestionData, index, v)}
                                placeholder={`Option ${index + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeMultipleChoiceOption(questionData, setQuestionData, index)}
                                className="remove-option-btn"
                            >
                                <BiX />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addMultipleChoiceOption(questionData, setQuestionData)}
                        className="add-option-btn"
                    >
                        <BiPlus /> Add Option
                    </button>
                </div>
            </div>
        )}

        <div className="form-group">
            <label>Correct Answer *</label>
            <MathFieldEditor
                value={questionData.correctAnswer}
                onChange={(v) => setQuestionData({ ...questionData, correctAnswer: v })}
                placeholder="Enter the correct answer…"
            />
        </div>

        <div className="form-group">
            <label>Answer Breakdown <span style={{fontWeight:400,color:'#94a3b8'}}>(optional)</span></label>
            <MathFieldEditor
                value={questionData.answerBreakdown || ''}
                onChange={(v) => setQuestionData({ ...questionData, answerBreakdown: v })}
                placeholder="Provide a detailed explanation for the solution…"
            />
        </div>

        <div className="form-group">
            <label>Image (optional)</label>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setQuestionData({ ...questionData, imageAssociated: e.target.files[0] })}
            />
            <small>Accepted formats: JPG, PNG, GIF. Max size: 5MB</small>
        </div>

        <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
                <BiX /> Cancel
            </button>
            <button type="button" onClick={onSubmit} className="btn-primary" disabled={loading}>
                <BiSave /> {submitLabel}
            </button>
        </div>
    </div>
);

const EnhancedManageAssignment = ({ assignment, onBack, onAssignmentUpdated }) => {
    const [currentTab, setCurrentTab] = useState('details'); // 'details', 'questions'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Assignment basic info states
    const [assignmentData, setAssignmentData] = useState({
        title: assignment?.title || '',
        description: assignment?.description || assignment?.instructions || '',
        dueDate: assignment?.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
        timeLimit: assignment?.timeLimit || '',
        maxAttempts: assignment?.maxAttempts || 3,
        isPublished: assignment?.isPublished || false,
        instructions: assignment?.instructions || ''
    });
    
    // Questions states
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({
        questionText: '',
        answerType: 'Short Answer',
        difficultyLevel: 1,
        subject: '',
        points: 1.0,
        multipleChoiceOptions: [],
        correctAnswer: '',
        answerBreakdown: '',
        imageAssociated: null,
        imageDescription: ''
    });
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [availableTopics, setAvailableTopics] = useState(DEFAULT_TOPICS);

    const handleTopicCreated = (newTopic) => {
        setAvailableTopics((prev) =>
            prev.includes(newTopic) ? prev : [...prev, newTopic]
        );
    };

    useEffect(() => {
        if (assignment?.id) {
            loadQuestions();
        }
    }, [assignment?.id]);

    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError('');
            const assignmentQuestions = await getAssignmentQuestionsById(assignment.id);
            
            setQuestions(assignmentQuestions || []);
        } catch (error) {
            setError(`Failed to load questions: ${error.message}`);
            setQuestions([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAssignment = async () => {
        try {
            setLoading(true);
            setError('');
            
            const updatedData = {
                ...assignment,
                ...assignmentData,
                dueDate: assignmentData.dueDate ? new Date(assignmentData.dueDate).toISOString() : null,
            };

            await updateAssignment(assignment.id, updatedData);
            setSuccess('Assignment updated successfully!');
            
            if (onAssignmentUpdated) {
                onAssignmentUpdated();
            }
        } catch (error) {
            setError('Failed to update assignment');
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = async () => {
        if (!newQuestion.questionText.trim() || !newQuestion.correctAnswer.trim()) {
            setError('Question text and correct answer are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const questionData = {
                ...newQuestion,
                assignmentId: assignment.id,
                createdAt: new Date().toISOString()
            };

            await saveQuestionToAssignment(assignment.id, questionData);
            await loadQuestions();
            setNewQuestion({
                questionText: '',
                answerType: 'Short Answer',
                difficultyLevel: 1,
                subject: '',
                points: 1.0,
                multipleChoiceOptions: [],
                correctAnswer: '',
                answerBreakdown: '',
                imageAssociated: null,
                imageDescription: ''
            });
            setIsAddingQuestion(false);
            setSuccess('Question added successfully!');
        } catch (error) {
            setError('Failed to add question');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuestion = async () => {
        if (!editingQuestion.questionText.trim() || !editingQuestion.correctAnswer.trim()) {
            setError('Question text and correct answer are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            await updateQuestionInAssignment(assignment.id, editingQuestion.id, editingQuestion);
            await loadQuestions();
            setEditingQuestion(null);
            setSuccess('Question updated successfully!');
        } catch (error) {
            setError('Failed to update question');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        const result = await Swal.fire({
            title: 'Delete question?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#e2e8f0',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
        });
        if (!result.isConfirmed) return;

        try {
            setLoading(true);
            setError('');
            
            await deleteQuestionFromAssignment(assignment.id, questionId);
            await loadQuestions();
            setSuccess('Question deleted successfully!');
        } catch (error) {
            setError('Failed to delete question');
        } finally {
            setLoading(false);
        }
    };

    const handleLibrarySelect = async (question) => {
        try {
            await createAssignmentQuestion({
                assignmentId: assignment.id,
                questionId: question.id,
                points: Math.min(10, question.points || 1.0)
            });
            setShowLibrary(false);
            setSuccess('Question linked successfully!');
            await loadQuestions();
        } catch (err) {
            setError('Failed to link question: ' + err.message);
        }
    };

    return (
        <div className="enhanced-manage-assignment">
            <div className="assignment-header">
                <button onClick={onBack} className="back-btn">
                    <BiArrowBack /> Back to Assignments
                </button>
                <h2>{assignment?.title}</h2>
                <p>Edit assignment details and manage questions</p>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError('')}><BiX /></button>
                </div>
            )}

            {success && (
                <div className="success-message">
                    {success}
                    <button onClick={() => setSuccess('')}><BiX /></button>
                </div>
            )}

            <div className="tabs">
                <button
                    className={`tab ${currentTab === 'details' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('details')}
                >
                    <BiFile /> Assignment Details
                </button>
                <button
                    className={`tab ${currentTab === 'questions' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('questions')}
                >
                    <BiBookOpen /> Questions ({questions.length})
                </button>
            </div>

            <div className="tab-content">
                {currentTab === 'details' && (
                    <div className="assignment-details-tab">
                        <div className="assignment-form">
                            <div className="form-group">
                                <label>Assignment Title *</label>
                                <input
                                    type="text"
                                    value={assignmentData.title}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                                    placeholder="Enter assignment title"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={assignmentData.description}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, description: e.target.value })}
                                    placeholder="Enter assignment description"
                                    rows={4}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={assignmentData.dueDate}
                                        onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Time Limit (minutes)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={assignmentData.timeLimit || ''}
                                        onChange={(e) => setAssignmentData({ ...assignmentData, timeLimit: parseInt(e.target.value) || null })}
                                        placeholder="No time limit"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Max Attempts</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={assignmentData.maxAttempts}
                                        onChange={(e) => setAssignmentData({ ...assignmentData, maxAttempts: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Instructions</label>
                                <textarea
                                    value={assignmentData.instructions}
                                    onChange={(e) => setAssignmentData({ ...assignmentData, instructions: e.target.value })}
                                    placeholder="Enter detailed instructions for students"
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={assignmentData.isPublished}
                                        onChange={(e) => setAssignmentData({ ...assignmentData, isPublished: e.target.checked })}
                                    />
                                    Published (visible to students)
                                </label>
                            </div>

                            <div className="form-actions">
                                <button
                                    onClick={handleUpdateAssignment}
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    <BiSave /> {loading ? 'Saving...' : 'Save Assignment Details'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {currentTab === 'questions' && (
                    <div className="questions-tab">
                        <div className="questions-header">
                            <h3>Assignment Questions</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={() => setShowLibrary(true)}
                                    className="btn-secondary"
                                    disabled={isAddingQuestion || !!editingQuestion}
                                >
                                    <BiBookOpen /> Browse Library
                                </button>
                                <button
                                    onClick={() => setIsAddingQuestion(true)}
                                    className="btn-primary"
                                    disabled={isAddingQuestion || !!editingQuestion}
                                >
                                    <BiPlus /> Add Question
                                </button>
                            </div>
                        </div>

                        {loading && (
                            <div className="loading-state">
                                <p>Loading questions...</p>
                            </div>
                        )}

                        {isAddingQuestion && (
                            <div className="question-form-container">
                                <h4>Add New Question</h4>
                                <QuestionForm
                                    questionData={newQuestion}
                                    setQuestionData={setNewQuestion}
                                    onSubmit={handleAddQuestion}
                                    onCancel={() => setIsAddingQuestion(false)}
                                    submitLabel="Add Question"
                                    topicList={availableTopics}
                                    onTopicCreated={handleTopicCreated}
                                    loading={loading}
                                />
                            </div>
                        )}

                        <div className="questions-list">
                            {questions.map((question, index) => (
                                <div key={question.id} className="question-item">
                                    {editingQuestion?.id === question.id ? (
                                        <div className="question-form-container">
                                            <h4>Edit Question {index + 1}</h4>
                                            <QuestionForm
                                                questionData={editingQuestion}
                                                setQuestionData={setEditingQuestion}
                                                onSubmit={handleUpdateQuestion}
                                                onCancel={() => setEditingQuestion(null)}
                                                submitLabel="Update Question"
                                                topicList={availableTopics}
                                                onTopicCreated={handleTopicCreated}
                                                loading={loading}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="question-header">
                                                <span className="question-number">Q{index + 1}</span>
                                                <span className="question-type">{question.answerType}</span>
                                                <span className="question-difficulty">
                                                    Level {question.difficultyLevel}
                                                </span>
                                                <span className="question-points">{question.points} pts</span>
                                                <div className="question-actions">
                                                    <button
                                                        onClick={() => setEditingQuestion({ ...question, points: Math.min(10, question.points || 1) })}
                                                        className="edit-btn"
                                                        disabled={editingQuestion || isAddingQuestion}
                                                    >
                                                        <BiEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteQuestion(question.id)}
                                                        className="delete-btn"
                                                        disabled={editingQuestion || isAddingQuestion}
                                                    >
                                                        <BiTrash />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="question-content">
                                                <p className="question-text"><MathText>{question.questionText}</MathText></p>

                                                {question.figureBlobUrl && (
                                                    <div className="question-figure" style={{ margin: '8px 0' }}>
                                                        <img
                                                            src={question.figureBlobUrl}
                                                            alt={question.figureDescription || 'Question figure'}
                                                            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '6px', display: 'block' }}
                                                        />
                                                        {question.figureDescription && (
                                                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                                                                {question.figureDescription}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {question.answerType === 'Multiple Choice' && question.multipleChoiceOptions?.length > 0 && (
                                                    <div className="question-options">
                                                        {question.multipleChoiceOptions.map((option, optIndex) => (
                                                            <div key={optIndex} className="option">
                                                                {String.fromCharCode(65 + optIndex)}. {option}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                <div className="question-solution">
                                                    <strong>Correct Answer:</strong> <MathText>{question.correctAnswer}</MathText>
                                                </div>
                                                
                                                {question.answerBreakdown && (
                                                    <div className="question-breakdown">
                                                        <strong>Explanation:</strong> {question.answerBreakdown}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {questions.length === 0 && !loading && !isAddingQuestion && (
                            <div className="empty-state">
                                <BiBookOpen size={48} />
                                <h4>No questions added yet</h4>
                                <p>Start by adding your first question to this assignment.</p>
                                <button
                                    onClick={() => setIsAddingQuestion(true)}
                                    className="btn-primary"
                                >
                                    <BiPlus /> Add First Question
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showLibrary && (
                <QuestionLibrary
                    excludeAssignmentId={assignment.id}
                    onSelect={handleLibrarySelect}
                    onClose={() => setShowLibrary(false)}
                />
            )}
        </div>
    );
};

export default EnhancedManageAssignment;