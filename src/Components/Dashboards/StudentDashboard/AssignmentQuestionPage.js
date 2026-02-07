import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addStyles, EditableMathField } from 'react-mathquill';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import { BiLeftArrow, BiRightArrow, BiFlag, BiTime, BiCheckCircle, BiSave, BiSend } from 'react-icons/bi';
import '../../PracticeArea/PracticeArea.css';
import './AssignmentQuestionPage.css';
import { getQuestionsByAssignmentId } from '../StudentDashboard/StudentDashboardService';

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
};
addStyles();

export default function AssignmentQuestionPage({ assignment, selectedClass, onBack, onComplete, questions: preloadedQuestions }) {
    const { questionIndex } = useParams();
    const navigate = useNavigate();
    const stepReference = useRef([]);
    
    // Use preloaded questions if available, otherwise fetch them
    const [questions, setQuestions] = useState(preloadedQuestions || []);
    const [loadingQuestions, setLoadingQuestions] = useState(!preloadedQuestions);
    
    // Only load questions if not preloaded
    useEffect(() => {
        if (preloadedQuestions?.length > 0) {
            // Questions already loaded, no need to fetch
            setQuestions(preloadedQuestions);
            setLoadingQuestions(false);
            return;
        }

        // Fallback: fetch questions if not preloaded
        const loadQuestions = async () => {
            if (assignment?.id) {
                try {
                    setLoadingQuestions(true);
                    const questionData = await getQuestionsByAssignmentId(assignment.id);
                    setQuestions(Array.isArray(questionData) ? questionData : []);
                } catch (error) {
                    console.error('Error loading assignment questions:', error);
                    setQuestions([]);
                } finally {
                    setLoadingQuestions(false);
                }
            } else {
                setQuestions([]);
                setLoadingQuestions(false);
            }
        };
        
        loadQuestions();
    }, [assignment?.id, preloadedQuestions]);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
        questionIndex ? parseInt(questionIndex) - 1 : 0
    );
    const [steps, setSteps] = useState(['']);
    const [isFlagged, setIsFlagged] = useState(false);
    
    // Initialize savedAnswers from localStorage
    const [savedAnswers, setSavedAnswers] = useState(() => {
        const assignmentId = assignment?.id || 'temp-assignment';
        const saved = localStorage.getItem(`assignment-answers-${assignmentId}`);
        return saved ? JSON.parse(saved) : {};
    });
    
    const [timeSpent, setTimeSpent] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    // Define autoSaveAnswer using useCallback to prevent initialization issues
    const autoSaveAnswer = useCallback(async () => {
        if (currentQuestion && steps.some(step => step.trim())) {
            setIsAutoSaving(true);
            
            const answerData = {
                questionId: currentQuestion.id,
                steps: steps,
                flagged: isFlagged,
                timeSpent: Math.floor((Date.now() - startTime) / 1000),
                savedAt: new Date().toISOString()
            };

            // Update local state
            const assignmentId = assignment?.id || 'temp-assignment';
            const currentSavedAnswers = { ...savedAnswers, [currentQuestion.id]: answerData };
            setSavedAnswers(currentSavedAnswers);

            // Save to localStorage for persistence
            localStorage.setItem(`assignment-answers-${assignmentId}`, JSON.stringify(currentSavedAnswers));
            console.log('💾 Auto-saved answer to localStorage:', answerData);

            // TODO: Save to backend
            console.log('📡 Sending to backend:', answerData);
            
            setTimeout(() => setIsAutoSaving(false), 1000);
        }
    }, [currentQuestion, steps, isFlagged, startTime, assignment?.id]); // Removed savedAnswers from dependencies

    useEffect(() => {
        setStartTime(Date.now());
        // Load saved answer for current question
        const assignmentId = assignment?.id || 'temp-assignment';
        const saved = localStorage.getItem(`assignment-answers-${assignmentId}`);
        const currentSavedAnswers = saved ? JSON.parse(saved) : {};
        
        if (currentSavedAnswers[currentQuestion?.id]) {
            setSteps(currentSavedAnswers[currentQuestion.id].steps || ['']);
            setIsFlagged(currentSavedAnswers[currentQuestion.id].flagged || false);
            console.log('✅ Loaded saved answer for question', currentQuestion.id, currentSavedAnswers[currentQuestion.id]);
        } else {
            setSteps(['']);
            setIsFlagged(false);
            console.log('🆕 Starting fresh for question', currentQuestion?.id);
        }
    }, [currentQuestionIndex, currentQuestion?.id, assignment?.id]);

    useEffect(() => {
        // Auto-save timer - save every 30 seconds if there are changes
        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
            autoSaveAnswer();
        }, 30000);

        return () => clearInterval(timer);
    }, [autoSaveAnswer]);

    // Also save when steps change (debounced) - only if there's content
    useEffect(() => {
        const timer = setTimeout(() => {
            if (steps.some(step => step.trim()) || isFlagged) {
                autoSaveAnswer();
            }
        }, 2000); // Save 2 seconds after user stops typing

        return () => clearTimeout(timer);
    }, [steps, isFlagged, autoSaveAnswer]);

    // Loading state for when questions haven't loaded yet
    if (!assignment || questions.length === 0) {
        return (
            <div className="assignment-question-page">
                <div className="loading-state">
                    <h2>Loading assignment questions...</h2>
                    {assignment && questions.length === 0 && (
                        <p>This assignment has no questions yet.</p>
                    )}
                </div>
            </div>
        );
    }

    const handleStepChange = (idx, latex) => {
        const newSteps = [...steps];
        newSteps[idx] = latex;
        setSteps(newSteps);
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const newSteps = [...steps];
            newSteps.splice(index + 1, 0, "");
            setSteps(newSteps);
            setTimeout(() => stepReference.current[index + 1]?.focus(), 0);
        } else if (e.key === "Backspace") {
            if (steps[index] === "" && steps.length > 1) {
                e.preventDefault();
                const newSteps = steps.filter((_, i) => i !== index);
                setSteps(newSteps);
                setTimeout(() => {
                    const prevIndex = Math.max(index - 1, 0);
                    stepReference.current[prevIndex]?.focus();
                }, 0);
            }
        }
    };

    const saveAnswer = () => {
        // Manual save - only save if there's actual content or if flagged
        if (currentQuestion && (steps.some(step => step.trim()) || isFlagged)) {
            setIsAutoSaving(true);
            
            const answerData = {
                questionId: currentQuestion.id,
                steps: steps,
                flagged: isFlagged,
                timeSpent: Math.floor((Date.now() - startTime) / 1000),
                savedAt: new Date().toISOString()
            };

            // Update local state
            const assignmentId = assignment?.id || 'temp-assignment';
            const currentSavedAnswers = { ...savedAnswers, [currentQuestion.id]: answerData };
            setSavedAnswers(currentSavedAnswers);

            // Save to localStorage for persistence
            localStorage.setItem(`assignment-answers-${assignmentId}`, JSON.stringify(currentSavedAnswers));
            console.log('💾 Manually saved answer:', answerData);

            setTimeout(() => setIsAutoSaving(false), 1000);
        }
    };

    const goToPrevious = () => {
        if (!isFirstQuestion) {
            saveAnswer(); // Force save before navigation
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const goToNext = () => {
        if (!isLastQuestion) {
            saveAnswer(); // Force save before navigation
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const toggleFlag = () => {
        setIsFlagged(!isFlagged);
    };

    const submitAssignment = async () => {
        // Final save
        autoSaveAnswer();
        
        // TODO: Submit to backend
        const submissionData = {
            assignmentId: assignment?.id,
            answers: savedAnswers,
            submittedAt: new Date().toISOString(),
            totalTimeSpent: timeSpent
        };
        
        console.log('Submitting assignment:', submissionData);
        
        if (onComplete) {
            onComplete();
        } else {
            navigate('/student-dashboard');
        }
    };

    const getDueDate = () => {
        if (assignment?.dueDate) {
            return new Date(assignment.dueDate).toLocaleDateString();
        }
        return 'No due date';
    };

    const getTimeRemaining = () => {
        if (assignment?.dueDate) {
            const due = new Date(assignment.dueDate);
            const now = new Date();
            const diff = due - now;
            
            if (diff <= 0) return 'Overdue';
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            if (days > 0) return `${days}d ${hours}h remaining`;
            return `${hours}h remaining`;
        }
        return '';
    };

    return (
        <MathJaxContext version={3} config={mathJaxConfig}>
            <div className="assignment-question-page">
                {/* Loading State */}
                {loadingQuestions ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading assignment questions...</p>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="empty-state">
                        <h2>No questions found</h2>
                        <p>This assignment doesn't have any questions yet.</p>
                        <button onClick={onBack} className="btn-secondary">
                            Back to Assignments
                        </button>
                    </div>
                ) : (
                <>
                {/* Header */}
                <div className="assignment-header">
                    <button onClick={onBack} className="back-btn">
                        <BiLeftArrow /> Back to Assignments
                    </button>
                    <div className="assignment-info">
                        <h1>{assignment?.title || 'Assignment'}</h1>
                        <div className="assignment-meta">
                            <span className="class-name">{selectedClass?.name}</span>
                            <span className="due-date">Due: {getDueDate()}</span>
                            <span className={`time-remaining ${getTimeRemaining().includes('Overdue') ? 'overdue' : ''}`}>
                                <BiTime /> {getTimeRemaining()}
                            </span>
                        </div>
                    </div>
                    <div className="assignment-actions">
                        {isAutoSaving && (
                            <span className="auto-save-indicator">
                                <BiSave /> Saving...
                            </span>
                        )}
                        <button onClick={saveAnswer} className="save-btn">
                            <BiSave /> Save
                        </button>
                        {isLastQuestion && (
                            <button onClick={submitAssignment} className="submit-btn">
                                <BiSend /> Submit Assignment
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="assignment-progress-bar">
                    <div className="progress-info">
                        <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                        <span>Progress: {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                    </div>
                    <div className="progress-track">
                        <div 
                            className="progress-fill"
                            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Navigation */}
                <div className="question-navigation">
                    <button 
                        onClick={goToPrevious} 
                        disabled={isFirstQuestion}
                        className="nav-btn prev"
                    >
                        <BiLeftArrow /> Previous
                    </button>
                    
                    <div className="question-indicators">
                        {questions.map((_, index) => (
                            <button
                                key={index}
                                className={`question-indicator ${index === currentQuestionIndex ? 'current' : ''} ${savedAnswers[questions[index]?.id] ? 'answered' : ''}`}
                                onClick={() => {
                                    saveAnswer(); // Force save before navigation
                                    setCurrentQuestionIndex(index);
                                }}
                                title={`Question ${index + 1}${savedAnswers[questions[index]?.id] ? ' (Answered)' : ''}`}
                            >
                                {savedAnswers[questions[index]?.id] ? <BiCheckCircle /> : index + 1}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={goToNext} 
                        disabled={isLastQuestion}
                        className="nav-btn next"
                    >
                        Next <BiRightArrow />
                    </button>
                </div>

                {/* Main Content */}
                <div className="assignment-content">
                    <div className="question-section">
                        <div className="question-header">
                            <div className="question-title">
                                <h2>Question {currentQuestionIndex + 1}</h2>
                                <button 
                                    onClick={toggleFlag}
                                    className={`flag-btn ${isFlagged ? 'flagged' : ''}`}
                                    title={isFlagged ? 'Remove flag' : 'Flag for review'}
                                >
                                    <BiFlag />
                                </button>
                            </div>
                            <span className={`question-difficulty ${currentQuestion?.difficultyLevel?.toLowerCase()}`}>
                                {currentQuestion?.difficultyLevel || currentQuestion?.difficulty}
                            </span>
                        </div>
                        
                        <div className="question-text">
                            <MathJax>
                                {currentQuestion?.questionText || currentQuestion?.text}
                            </MathJax>
                            {currentQuestion?.figureDescription && (
                                <div className="question-figure-description">
                                    <em>{currentQuestion.figureDescription}</em>
                                </div>
                            )}
                            {currentQuestion?.figureBlobUrl && (
                                <div className="question-figure">
                                    <img 
                                        src={currentQuestion.figureBlobUrl} 
                                        alt={currentQuestion.figureDescription || "Question figure"}
                                        className="question-image"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="answer-section">
                        <h3>Your Answer</h3>
                        <div className="answer-input">
                            {steps.map((step, idx) => (
                                <div key={idx} className="answer-step">
                                    <span className="step-number">{idx + 1}.</span>
                                    <EditableMathField
                                        latex={step}
                                        onChange={mf => handleStepChange(idx, mf.latex())}
                                        onKeyDown={e => handleKeyDown(e, idx)}
                                        mathquillDidMount={mf => {
                                            stepReference.current[idx] = mf;
                                        }}
                                        config={{
                                            spaceBehavesLikeTab: true,
                                            leftRightIntoCmdGoes: 'up',
                                            restrictMismatchedBrackets: true,
                                            sumStartsWithNEquals: true
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        {savedAnswers[currentQuestion?.id] && (
                            <div className="save-indicator">
                                <BiCheckCircle style={{ color: '#22C55E' }} /> 
                                Last saved at{' '}
                                {new Date(savedAnswers[currentQuestion.id].savedAt).toLocaleTimeString()}
                                {savedAnswers[currentQuestion.id].flagged && (
                                    <span className="flag-indicator"> • <BiFlag style={{ color: '#F59E0B' }} /> Flagged</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                </>
                )}
            </div>
        </MathJaxContext>
    );
}