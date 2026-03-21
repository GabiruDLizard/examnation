import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { addStyles, EditableMathField } from 'react-mathquill';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import { BiLeftArrow, BiRightArrow, BiFlag, BiTime, BiCheckCircle, BiSave, BiSend } from 'react-icons/bi';
import '../../PracticeArea/PracticeArea.css';
import './AssignmentQuestionPage.css';
import { getQuestionsByAssignmentId, getSubmissionByAssignmentAndStudent, createSubmission, updateSubmission, saveAnswerToBackend, submitAssignmentToBackend, checkAndGradeAnswers } from '../StudentDashboard/StudentDashboardService';
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import { recordStudentReadiness } from '../TeacherDashboard/TeacherDashboardService';

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
};
addStyles();

export default function AssignmentQuestionPage({ assignment, selectedClass, onBack, onComplete, questions: preloadedQuestions }) {
    const { questionIndex } = useParams();
    const navigate = useNavigate();
    const stepReference = useRef([]);
    
    // Get current user ID from token - always initialize this first
    const currentUserId = useMemo(() => {
        const id = getUserIdFromToken();
        if (id) return id;

        // Fallback to userData
        try {
            const userData = localStorage.getItem('userData');
            if (userData) return JSON.parse(userData)?.id;
        } catch { /* ignore */ }

        return null;
    }, []);
    
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
    
    // Initialize submission
    useEffect(() => {
        if (!assignment?.id || !currentUserId) {
            return;
        }

        const initializeSubmission = async () => {
            try {
                let existingSubmission = await getSubmissionByAssignmentAndStudent(assignment.id, currentUserId);
                
                if (!existingSubmission) {
                    // Create new submission with 'in_progress' status
                    existingSubmission = await createSubmission({
                        assignmentId: assignment.id,
                        studentId: currentUserId,
                        status: 'in_progress',
                        submittedAt: null,
                        grade: null
                    });
                }

                setSubmission(existingSubmission);
                setIsSubmitted(existingSubmission.status === 'submitted');
            } catch (error) {
                console.error('Error initializing submission:', error);
            }
        };
        
        initializeSubmission();
    }, [assignment?.id, currentUserId]);
    
    // Check deadline status
    useEffect(() => {
        const checkDeadline = () => {
            if (assignment?.dueDate) {
                const now = new Date();
                const deadline = new Date(assignment.dueDate);
                setIsPastDeadline(now > deadline);
            } else {
                setIsPastDeadline(false);
            }
        };
        
        checkDeadline();
        
        // Check deadline every minute
        const interval = setInterval(checkDeadline, 60000);
        
        return () => clearInterval(interval);
    }, [assignment?.dueDate]);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
        questionIndex ? parseInt(questionIndex) - 1 : 0
    );
    const [steps, setSteps] = useState(['']);
    const [selectedOption, setSelectedOption] = useState(null);
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
    const [submission, setSubmission] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isPastDeadline, setIsPastDeadline] = useState(false);
    const [gradingResult, setGradingResult] = useState(null);

    const currentQuestion = questions[currentQuestionIndex];
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isEditingDisabled = isSubmitted || isPastDeadline;

    // Define autoSaveAnswer using useCallback to prevent initialization issues
    const autoSaveAnswer = useCallback(async () => {
        if (currentQuestion && steps.some(step => step.trim()) && submission && !isEditingDisabled) {
            setIsAutoSaving(true);
            
            const answerText = steps.filter(step => step.trim()).join('\n');
            
            const answerData = {
                questionId: currentQuestion.id,
                steps: steps,
                flagged: isFlagged,
                timeSpent: Math.floor((Date.now() - startTime) / 1000),
                savedAt: new Date().toISOString()
            };

            // Update local state and localStorage
            const assignmentId = assignment?.id || 'temp-assignment';
            const currentSavedAnswers = { ...savedAnswers, [currentQuestion.id]: answerData };
            setSavedAnswers(currentSavedAnswers);
            localStorage.setItem(`assignment-answers-${assignmentId}`, JSON.stringify(currentSavedAnswers));

            // Save to backend
            try {
                await saveAnswerToBackend({
                    submissionId: submission.id,
                    questionId: currentQuestion.id,
                    answer: answerText
                });
            } catch (error) {
                console.error('Error saving to backend:', error);
                // Continue with local save even if backend fails
            }
            
            setTimeout(() => setIsAutoSaving(false), 1000);
        }
    }, [currentQuestion, steps, isFlagged, startTime, assignment?.id, submission, isEditingDisabled]);

    useEffect(() => {
        setStartTime(Date.now());
        // Load saved answer for current question
        const assignmentId = assignment?.id || 'temp-assignment';
        const saved = localStorage.getItem(`assignment-answers-${assignmentId}`);
        const currentSavedAnswers = saved ? JSON.parse(saved) : {};
        
        if (currentSavedAnswers[currentQuestion?.id]) {
            const saved = currentSavedAnswers[currentQuestion.id];
            setSteps(saved.steps || ['']);
            setIsFlagged(saved.flagged || false);
            setSelectedOption(saved.steps?.[0] || null);
        } else {
            setSteps(['']);
            setSelectedOption(null);
            setIsFlagged(false);
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

    const saveAnswer = async () => {
        // Manual save - only save if there's actual content or if flagged and not past deadline
        if (currentQuestion && (steps.some(step => step.trim()) || isFlagged) && submission && !isEditingDisabled) {
            setIsAutoSaving(true);
            
            const answerText = steps.filter(step => step.trim()).join('\n');
            
            const answerData = {
                questionId: currentQuestion.id,
                steps: steps,
                flagged: isFlagged,
                timeSpent: Math.floor((Date.now() - startTime) / 1000),
                savedAt: new Date().toISOString()
            };

            // Update local state and localStorage
            const assignmentId = assignment?.id || 'temp-assignment';
            const currentSavedAnswers = { ...savedAnswers, [currentQuestion.id]: answerData };
            setSavedAnswers(currentSavedAnswers);
            localStorage.setItem(`assignment-answers-${assignmentId}`, JSON.stringify(currentSavedAnswers));

            // Save to backend
            try {
                await saveAnswerToBackend({
                    submissionId: submission.id,
                    questionId: currentQuestion.id,
                    answer: answerText
                });
            } catch (error) {
                console.error('Error saving to backend:', error);
                // Continue with local save even if backend fails
            }

            setTimeout(() => setIsAutoSaving(false), 1000);
        }
    };

    const goToPrevious = () => {
        if (!isFirstQuestion) {
            if (!isEditingDisabled) {
                saveAnswer(); // Force save before navigation
            }
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const goToNext = () => {
        if (!isLastQuestion) {
            if (!isEditingDisabled) {
                saveAnswer(); // Force save before navigation
            }
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const toggleFlag = () => {
        if (!isEditingDisabled) {
            setIsFlagged(!isFlagged);
        }
    };

    const submitAssignment = async () => {
        // Check if past deadline
        if (isPastDeadline) {
            toast.error('Cannot submit assignment: deadline has passed.');
            return;
        }

        // Final save of current answer
        await saveAnswer();

        try {
            // Submit assignment to backend
            const submittedSubmission = await submitAssignmentToBackend(assignment.id, currentUserId);

            setSubmission(submittedSubmission);
            setIsSubmitted(true);

            // Grade and save readiness
            try {
                const result = await checkAndGradeAnswers(assignment.id, submittedSubmission.id);
                setGradingResult(result);

                const classId = selectedClass?.classId || selectedClass?.id || assignment?.classId;
                if (classId) {
                    // Use grade percentage (not IRT theta) for class readiness — IRT starts at 0
                    // so short assignments always produce ~50%, masking real class differences.
                    await recordStudentReadiness(currentUserId, classId, {
                        readinessPercentage: Math.round(result.percentage * 10) / 10,
                        questionsAnswered: result.gradedAnswers,
                        correctAnswers: Math.round((result.percentage / 100) * result.gradedAnswers),
                        studyTimeMinutes: 0,
                        abilityEstimate: result.abilityEstimate
                    });
                }
            } catch { /* non-fatal */ }

            // Clear localStorage since assignment is submitted
            const assignmentId = assignment?.id || 'temp-assignment';
            localStorage.removeItem(`assignment-answers-${assignmentId}`);
        } catch (error) {
            console.error('❌ Error submitting assignment:', error);
            toast.error('Failed to submit assignment. Please try again.');
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
            
            if (diff <= 0) return 'Deadline Passed';
            
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
                {/* Results screen — shown after submission */}
                {isSubmitted && gradingResult ? (
                    <div className="results-screen">
                        <div className="results-header">
                            <BiCheckCircle className="results-icon" />
                            <h2>Assignment Submitted!</h2>
                            <p>{assignment?.title}</p>
                        </div>

                        <div className="results-score-card">
                            <div className="score-percentage">
                                {Math.round(gradingResult.percentage)}%
                            </div>
                            <div className="score-points">
                                {gradingResult.totalScore} / {gradingResult.totalPoints} points
                            </div>
                            <div className={`letter-grade grade-${
                                gradingResult.percentage >= 90 ? 'a' :
                                gradingResult.percentage >= 80 ? 'b' :
                                gradingResult.percentage >= 70 ? 'c' :
                                gradingResult.percentage >= 60 ? 'd' : 'f'
                            }`}>
                                {gradingResult.percentage >= 90 ? 'A' :
                                 gradingResult.percentage >= 80 ? 'B' :
                                 gradingResult.percentage >= 70 ? 'C' :
                                 gradingResult.percentage >= 60 ? 'D' : 'F'}
                            </div>
                        </div>

                        <div className="results-stats">
                            <div className="results-stat">
                                <span className="stat-label">Questions Graded</span>
                                <span className="stat-value">{gradingResult.gradedAnswers}</span>
                            </div>
                            <div className="results-stat">
                                <span className="stat-label">Questions Total</span>
                                <span className="stat-value">{questions.length}</span>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={() => {
                                if (onComplete) onComplete();
                                else navigate('/student-dashboard');
                            }}
                        >
                            Done
                        </button>
                    </div>
                ) : loadingQuestions ? (
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
                            <span className={`time-remaining ${(getTimeRemaining().includes('Deadline Passed') || getTimeRemaining().includes('Overdue')) ? 'overdue' : ''}`}>
                                <BiTime /> {getTimeRemaining()}
                            </span>
                            {isPastDeadline && (
                                <span className="deadline-warning" style={{color: '#EF4444', fontWeight: 'bold'}}>
                                    ⚠️ Deadline has passed - editing disabled
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="assignment-actions">
                        {isSubmitted && (
                            <span className="submitted-indicator">
                                <BiCheckCircle style={{ color: '#22C55E' }} /> Submitted
                            </span>
                        )}
                        {isPastDeadline && !isSubmitted && (
                            <span className="deadline-passed-indicator">
                                <BiTime style={{ color: '#EF4444' }} /> Deadline Passed
                            </span>
                        )}
                        {isAutoSaving && (
                            <span className="auto-save-indicator">
                                <BiSave /> Saving...
                            </span>
                        )}
                        {!isEditingDisabled && (
                            <>
                                <button onClick={saveAnswer} className="save-btn" disabled={isAutoSaving}>
                                    <BiSave /> Save
                                </button>
                                {isLastQuestion && (
                                    <button onClick={submitAssignment} className="submit-btn">
                                        <BiSend /> Submit Assignment
                                    </button>
                                )}
                            </>
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
                                className={`question-indicator ${index === currentQuestionIndex ? 'current' : ''} ${savedAnswers[questions[index]?.id] ? 'answered' : ''} ${isEditingDisabled ? 'disabled' : ''}`}
                                onClick={() => {
                                    if (!isEditingDisabled) {
                                        saveAnswer(); // Force save before navigation
                                    }
                                    setCurrentQuestionIndex(index);
                                }}
                                title={`Question ${index + 1}${savedAnswers[questions[index]?.id] ? ' (Answered)' : ''}${isSubmitted ? ' (Submitted)' : ''}${isPastDeadline ? ' (Deadline Passed)' : ''}`}
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
                                {!isEditingDisabled && (
                                    <button 
                                        onClick={toggleFlag}
                                        className={`flag-btn ${isFlagged ? 'flagged' : ''}`}
                                        title={isFlagged ? 'Remove flag' : 'Flag for review'}
                                    >
                                        <BiFlag />
                                    </button>
                                )}
                                {isEditingDisabled && isFlagged && (
                                    <span className="flag-indicator">
                                        <BiFlag style={{ color: '#F59E0B' }} />
                                    </span>
                                )}
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
                        <h3>
                            Your Answer 
                            {isSubmitted && <span style={{color: '#22C55E'}}>(Submitted)</span>}
                            {isPastDeadline && !isSubmitted && <span style={{color: '#EF4444'}}>(Deadline Passed)</span>}
                        </h3>
                        <div className="answer-input">
                            {currentQuestion?.options?.length > 0 ? (
                                <div className="mc-options">
                                    {currentQuestion.options.map((option, idx) => (
                                        <label
                                            key={idx}
                                            className={`mc-option ${selectedOption === option ? 'selected' : ''} ${isEditingDisabled ? 'disabled' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="mc-answer"
                                                value={option}
                                                checked={selectedOption === option}
                                                disabled={isEditingDisabled}
                                                onChange={() => {
                                                    setSelectedOption(option);
                                                    setSteps([option]);
                                                }}
                                            />
                                            {option}
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                steps.map((step, idx) => (
                                    <div key={idx} className="answer-step">
                                        <span className="step-number">{idx + 1}.</span>
                                        <EditableMathField
                                            latex={step}
                                            onChange={mf => !isEditingDisabled && handleStepChange(idx, mf.latex())}
                                            onKeyDown={e => !isEditingDisabled && handleKeyDown(e, idx)}
                                            mathquillDidMount={mf => {
                                                stepReference.current[idx] = mf;
                                            }}
                                            config={{
                                                spaceBehavesLikeTab: !isEditingDisabled,
                                                leftRightIntoCmdGoes: 'up',
                                                restrictMismatchedBrackets: true,
                                                sumStartsWithNEquals: true,
                                                readOnly: isEditingDisabled
                                            }}
                                        />
                                    </div>
                                ))
                            )}
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
