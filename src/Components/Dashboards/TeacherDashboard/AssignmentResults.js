import React, { useState, useEffect } from 'react';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import { BiArrowBack, BiBarChart, BiUser, BiCalendar, BiTime, BiCheckCircle, BiTimer, BiX, BiShow, BiDownload, BiStats, BiTrendingUp, BiTargetLock, BiFilter, BiSearch, BiRefresh, BiSave } from 'react-icons/bi';
import {
    getAssignmentsByTeacher,
    getAssignmentWithSubmissionStats,
    getUserById,
    getSubmissionDetails,
    getAnswersBySubmissionId,
    gradeSubmission,
    approveSubmission,
    sendBackSubmission,
    updateAnswerGrade
} from './TeacherDashboardService';
import { authFetch } from '../../../utils/api';
import '../Assignments.css';

const mathJaxConfig = {
    loader: { load: ['input/tex', 'output/chtml'] },
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
    },
};

const AssignmentResults = ({ teacherInfo, onBack, selectedClass, onSubmissionApproved, initialAssignmentId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Assignment selection states
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    
    // Results states  
    const [assignmentDetails, setAssignmentDetails] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [students, setStudents] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    
    // Filter and search states
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'submitted', 'in_progress', 'not_started'
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name'); // 'name', 'submitted_at', 'score'
    
    // Detail view states
    const [viewingSubmission, setViewingSubmission] = useState(null);
    const [submissionDetails, setSubmissionDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    // Question details cache
    const [questionsCache, setQuestionsCache] = useState(new Map());
    
    // Grading states
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [gradeScore, setGradeScore] = useState('');
    const [gradeFeedback, setGradeFeedback] = useState('');
    const [savingGrade, setSavingGrade] = useState(false);

    // Per-question grade overrides: { [answerId]: { isCorrect, pointsEarned } }
    const [answerOverrides, setAnswerOverrides] = useState({});
    const [savingAnswerGrades, setSavingAnswerGrades] = useState(false);

    // Review states
    const [approvingId, setApprovingId] = useState(null);
    const [sendBackId, setSendBackId] = useState(null);
    const [sendBackComment, setSendBackComment] = useState('');

    useEffect(() => {
        if (teacherInfo?.id) {
            loadAssignments();
        }
    }, [teacherInfo?.id]);

    useEffect(() => {
        if(initialAssignmentId && assignments.length > 0) {
            const initial = assignments.find(a => a.id === initialAssignmentId);
            if(initial) setSelectedAssignment(initial);
        }
    }, [initialAssignmentId, assignments]);

    useEffect(() => {
        if (selectedAssignment) {
            loadAssignmentResults();
        }
    }, [selectedAssignment]);

    useEffect(() => {
        applyFilters();
    }, [submissions, statusFilter, searchTerm, sortBy]);

    const loadAssignments = async () => {
        try {
            setLoading(true);
            setError('');
            const teacherAssignments = await getAssignmentsByTeacher(teacherInfo.id);
            const sorted = [...teacherAssignments].sort((a, b) => new Date(b.createdAt ?? b.dueDate ?? 0) - new Date(a.createdAt ?? a.dueDate ?? 0));
            setAssignments(sorted);
        } catch (error) {
            setError('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const loadAssignmentResults = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Get detailed assignment data with submission stats
            const assignmentWithStats = await getAssignmentWithSubmissionStats(selectedAssignment.id);
            setAssignmentDetails(assignmentWithStats);
            
            // Get all submissions for this assignment
            const submissionData = assignmentWithStats.submissions || [];
            
            // Load answers for each submission and get student info
            const enrichedSubmissions = [];
            const studentsData = [];
            
            for (const submission of submissionData) {
                try {
                    // Get student info
                    const studentInfo = await getUserById(submission.studentId);
                    studentsData.push(studentInfo);

                    // Get answers for this submission
                    const answers = await getAnswersBySubmissionId(submission.id);
                    
                    enrichedSubmissions.push({
                        ...submission,
                        answers: answers
                    });
                } catch (error) {
                    enrichedSubmissions.push(submission);
                }
            }
            
            setSubmissions(enrichedSubmissions);
            setStudents(studentsData);
            
        } catch (error) {
            setError('Failed to load assignment results');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...submissions];
        
        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(submission => submission.status === statusFilter);
        }
        
        // Search filter - search by student name or ID
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(submission => {
                const student = students.find(s => s.id === submission.studentId);
                if (student) {
                    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
                    return fullName.includes(term) || student.studentId?.toString().includes(term);
                }
                return submission.studentId?.toString().includes(term);
            });
        }
        
        // Sort
        filtered.sort((a, b) => {
            const studentA = students.find(s => s.id === a.studentId);
            const studentB = students.find(s => s.id === b.studentId);
            
            switch (sortBy) {
                case 'name':
                    const nameA = studentA ? `${studentA.firstName} ${studentA.lastName}` : '';
                    const nameB = studentB ? `${studentB.firstName} ${studentB.lastName}` : '';
                    return nameA.localeCompare(nameB);
                case 'submitted_at':
                    return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
                case 'score':
                    return (b.grade || 0) - (a.grade || 0);
                default:
                    return 0;
            }
        });
        
        setFilteredSubmissions(filtered);
    };

    const getSubmissionStatus = (submission) => {
        switch (submission.status) {
            case 'submitted':      return 'Submitted';
            case 'pending_review': return 'Pending Review';
            case 'graded':         return 'Graded';
            case 'needs_revision': return 'Needs Revision';
            case 'in_progress':    return 'In Progress';
            default:               return 'Not Started';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'submitted':      return '#10b981';
            case 'pending_review': return '#f59e0b';
            case 'graded':         return '#6366f1';
            case 'needs_revision': return '#ef4444';
            case 'in_progress':    return '#3b82f6';
            default:               return '#6b7280';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'Not submitted';
        return new Date(dateString).toLocaleString();
    };

    const fetchQuestionDetails = async (questionId) => {
        if (questionsCache.has(questionId)) {
            return questionsCache.get(questionId);
        }
        
        try {
            const response = await authFetch(`/question/${questionId}`);
            if (response.ok) {
                const questionDetails = await response.json();
                setQuestionsCache(prev => new Map(prev).set(questionId, questionDetails));
                return questionDetails;
            }
        } catch { /* ignore */ }
        return null;
    };

    const handleViewSubmission = async (submission) => {
        try {
            setLoadingDetails(true);
            setViewingSubmission(submission);

            // Use the enriched submission data that already has answers loaded
            let details;
            if (submission.answers && submission.answers.length > 0) {
                details = submission;
            } else {
                details = await getSubmissionDetails(submission.id);
            }
            
            // Fetch question details for each answer
            if (details.answers && details.answers.length > 0) {
                const answersWithQuestions = await Promise.all(
                    details.answers.map(async (answer) => {
                        const questionDetails = await fetchQuestionDetails(answer.questionId);
                        return {
                            ...answer,
                            questionDetails
                        };
                    })
                );
                
                details = {
                    ...details,
                    answers: answersWithQuestions
                };
            }
            
            setSubmissionDetails(details);

            // Pre-fill overrides from current answer data so the teacher sees existing grades
            const initialOverrides = {};
            for (const a of (details.answers || [])) {
                initialOverrides[a.id] = {
                    isCorrect: a.isCorrect ?? false,
                    pointsEarned: a.pointsEarned ?? 0
                };
            }
            setAnswerOverrides(initialOverrides);
        } catch (error) {
            setError('Failed to load submission details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSaveAnswerGrades = async () => {
        const details = submissionDetails || viewingSubmission;
        if (!details?.answers) return;
        setSavingAnswerGrades(true);
        try {
            for (const answer of details.answers) {
                const override = answerOverrides[answer.id];
                if (override !== undefined) {
                    await updateAnswerGrade(
                        answer.id,
                        answer.submissionId,
                        answer.questionId,
                        answer.answer,
                        override.isCorrect,
                        override.pointsEarned
                    );
                }
            }
            // Recalculate overall grade from all answers
            const totalPoints = details.answers.reduce((sum, a) => sum + (a.questionDetails?.points ?? 1), 0);
            const earnedPoints = details.answers.reduce((sum, a) => {
                const ov = answerOverrides[a.id];
                return sum + (ov !== undefined ? ov.pointsEarned : (a.pointsEarned ?? 0));
            }, 0);
            const newGrade = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100 * 10) / 10 : 0;
            await gradeSubmission(details.id, newGrade, gradeFeedback);
            await loadAssignmentResults();
            setViewingSubmission(null);
            setSubmissionDetails(null);
            setAnswerOverrides({});
        } catch {
            setError('Failed to save question grades');
        } finally {
            setSavingAnswerGrades(false);
        }
    };

    const handleStartGrading = (submission) => {
        setGradingSubmission(submission);
        setGradeScore(submission.grade || '');
        setGradeFeedback(submission.feedback || '');
    };

    const handleSaveGrade = async () => {
        if (!gradeScore || isNaN(gradeScore) || gradeScore < 0 || gradeScore > 100) {
            setError('Please enter a valid score between 0 and 100');
            return;
        }

        try {
            setSavingGrade(true);
            setError('');
            
            await gradeSubmission(gradingSubmission.id, gradeScore, gradeFeedback);
            
            // Reload assignment results to get updated data
            await loadAssignmentResults();
            
            // Close grading modal
            setGradingSubmission(null);
            setGradeScore('');
            setGradeFeedback('');
            
        } catch (error) {
            setError('Failed to save grade');
        } finally {
            setSavingGrade(false);
        }
    };

    const downloadCSV = (csvString, filename) => {
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const buildSubmissionsCSV = (submissionsList) => {
        const header = ['Student', 'Status', 'Score', 'Submitted At', 'Time Spent'];
        const rows = submissionsList.map(sub => {
            const student = students.find(s => s.id === sub.studentId);
            const name = student ? `${student.firstName} ${student.lastName}` : `Student ${sub.studentId}`;
            return [
                name,
                getSubmissionStatus(sub),
                sub.grade !== null ? `${sub.grade}%` : 'Not graded',
                formatDateTime(sub.submittedAt),
                sub.timeSpent || 'N/A'
            ];
        });
        return [header, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    };

    const buildSubmissionDetailCSV = (submission) => {
        const student = students.find(s => s.id === submission.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}` : `Student ${submission.studentId}`;
        const details = submissionDetails || submission;

        const header = ['Question', 'Student Answer', 'Correct Answer', 'Result', 'Points Earned'];
        const rows = (details.answers || []).map((answer, i) => [
            answer.questionDetails?.questionText || `Question ${i + 1}`,
            answer.answer || answer.answerText || answer.selectedOption || '',
            answer.questionDetails?.correctAnswer || '',
            answer.isCorrect ? 'Correct' : 'Incorrect',
            answer.pointsEarned ?? ''
        ]);
        const csvContent = [header, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        return `Student: ${studentName}\nStatus: ${getSubmissionStatus(details)}\nScore: ${details.grade !== null ? `${details.grade}%` : 'Not graded'}\n\n${csvContent}`;
    };

    const handleExportData = () => {
        const csv = buildSubmissionsCSV(filteredSubmissions);
        const filename = selectedAssignment
            ? `${selectedAssignment.title.replace(/[^a-z0-9]/gi, '_')}-results.csv`
            : 'assignment-results.csv';
        downloadCSV(csv, filename);
    };

    const calculateStats = () => {
        if (!assignmentDetails?.submissionStats) return {};
        
        const stats = assignmentDetails.submissionStats;
        const submittedSubmissions = submissions.filter(s => ['submitted', 'pending_review', 'graded', 'needs_revision'].includes(s.status));
        
        const scores = submittedSubmissions
            .map(s => s.grade)
            .filter(score => score != null && !isNaN(score));
        
        const averageScore = scores.length > 0 
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
            : 0;
        
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
        
        return {
            ...stats,
            averageScore: Math.round(averageScore * 10) / 10,
            highestScore,
            lowestScore,
            gradedCount: scores.length
        };
    };

    const renderSubmissionDetail = (submission) => {
        const student = students.find(s => s.id === submission.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}` : `Student ${submission.studentId}`;
        const details = submissionDetails || submission;
        
        return (
            <div className="submission-detail-modal">
                <div className="submission-detail-content">
                    <div className="submission-detail-header">
                        <h3>Submission Details - {studentName}</h3>
                        
                        <button 
                            onClick={() => {
                                setViewingSubmission(null);
                                setSubmissionDetails(null);
                            }}
                            className="close-btn"
                        >
                            <BiX />
                        </button>
                    </div>
                    
                    {loadingDetails ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading submission details...</p>
                        </div>
                    ) : (
                        <>
                            <div className="submission-detail-body">
                                {/* Pending Review Actions */}
                            {details.status === 'pending_review' && (
                                <div style={{
                                    background: '#fffbeb', border: '1px solid #f59e0b',
                                    borderRadius: '8px', padding: '16px', marginBottom: '16px'
                                }}>
                                    <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '8px' }}>
                                        ⏳ Awaiting Your Review
                                    </div>
                                    <div style={{ color: '#78350f', fontSize: '0.875rem', marginBottom: '12px' }}>
                                        Review the student's answers below, then approve or send back.
                                    </div>
                                    {sendBackId === submission.id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <textarea
                                                placeholder="Comment for student (optional)..."
                                                value={sendBackComment}
                                                onChange={e => setSendBackComment(e.target.value)}
                                                rows={3}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box' }}
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await sendBackSubmission(submission.id, sendBackComment);
                                                            setSendBackId(null);
                                                            setSendBackComment('');
                                                            setViewingSubmission(null);
                                                            setSubmissionDetails(null);
                                                            loadAssignmentResults();
                                                        } catch { alert('Failed to send back.'); }
                                                    }}
                                                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    Confirm Send Back
                                                </button>
                                                <button
                                                    onClick={() => { setSendBackId(null); setSendBackComment(''); }}
                                                    style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                disabled={approvingId === submission.id}
                                                onClick={async () => {
                                                    setApprovingId(submission.id);
                                                    try {
                                                        const classId = selectedClass?.classId || selectedClass?.id || selectedAssignment?.classId;
                                                        await approveSubmission(submission.id, selectedAssignment.id, submission.studentId, classId);
                                                        setViewingSubmission(null);
                                                        setSubmissionDetails(null);
                                                        loadAssignmentResults();
                                                        onSubmissionApproved?.();
                                                    } catch { alert('Failed to approve.'); }
                                                    finally { setApprovingId(null); }
                                                }}
                                                style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                {approvingId === submission.id ? 'Approving...' : '✓ Approve'}
                                            </button>
                                            <button
                                                onClick={() => setSendBackId(submission.id)}
                                                style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                ↩ Send Back
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="submission-info-grid">
                                    <div className="info-item">
                                        <label>Status</label>
                                        <span className={`status-badge status-${details.status}`}>
                                            {getSubmissionStatus(details)}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <label>Score</label>
                                        <span>{details.grade != null ? `${details.grade}%` : 'Not graded'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Started At</label>
                                        <span>{formatDateTime(details.startedAt)}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Submitted At</label>
                                        <span>{formatDateTime(details.submittedAt)}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Time Taken</label>
                                        <span>{details.timeSpent || 'N/A'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Attempt</label>
                                        <span>{details.attemptNumber || 1}</span>
                                    </div>
                                </div>
                                
                                {details.feedback && (
                                    <div className="submission-feedback">
                                        <h4>Teacher Feedback</h4>
                                        <div className="feedback-content">
                                            {details.feedback}
                                        </div>
                                    </div>
                                )}
                                
                                {details.answers && details.answers.length > 0 ? (
                                    <div className="submission-answers">
                                        <h4>Student Answers ({details.answers.length} answers found)</h4>
                                        <div className="answers-list">
                                            {details.answers.map((answer, index) => {
                                                return (
                                                    <div key={answer.id || index} className="answer-item">
                                                        <div className="question-header">
                                                            <div className="question-ref">
                                                                Question {answer.questionId || (index + 1)}
                                                            </div>
                                                            {answer.questionDetails?.points && (
                                                                <div className="question-points">
                                                                    {answer.questionDetails.points} {answer.questionDetails.points === 1 ? 'point' : 'points'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {answer.questionDetails && (
                                                            <div className="question-text">
                                                                <strong>Question:</strong>
                                                                <MathJaxContext version={3} config={mathJaxConfig}>
                                                                    <MathJax>{answer.questionDetails.questionText || answer.questionDetails.text}</MathJax>
                                                                </MathJaxContext>
                                                                {answer.questionDetails.figureBlobUrl && (
                                                                    <div className="question-figure" style={{ margin: '8px 0' }}>
                                                                        <img
                                                                            src={answer.questionDetails.figureBlobUrl}
                                                                            alt={answer.questionDetails.figureDescription || 'Question figure'}
                                                                            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '6px', display: 'block' }}
                                                                        />
                                                                        {answer.questionDetails.figureDescription && (
                                                                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                                                                                {answer.questionDetails.figureDescription}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {answer.questionDetails.correctAnswer && (
                                                                    <div className="correct-answer">
                                                                        <strong>Correct Answer: </strong>
                                                                        <MathJaxContext version={3} config={mathJaxConfig}>
                                                                            <MathJax inline>{answer.questionDetails.correctAnswer}</MathJax>
                                                                        </MathJaxContext>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="student-answer">
                                                            <strong>Student Working:</strong>
                                                            <div className="answer-content">
                                                                {(() => {
                                                                    const raw = answer.answer || answer.answerText || answer.selectedOption || '';
                                                                    if (!raw) return <span style={{ color: '#94a3b8' }}>No answer provided</span>;
                                                                    const wrapMath = (s) => /[\\^_{}&]/.test(s) && !s.startsWith('$') ? `$${s}$` : s;
                                                                    const steps = raw.split(/\\n|\n/).filter(s => s.trim());
                                                                    if (steps.length <= 1) return (
                                                                        <MathJaxContext version={3} config={mathJaxConfig}>
                                                                            <div style={{ padding: '6px 0' }}><MathJax inline>{wrapMath(raw)}</MathJax></div>
                                                                        </MathJaxContext>
                                                                    );
                                                                    return (
                                                                        <MathJaxContext version={3} config={mathJaxConfig}>
                                                                            {steps.map((step, i) => (
                                                                                <div key={i} style={{ display: 'flex', gap: '8px', padding: '4px 0', borderBottom: i < steps.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                                                    <span style={{ color: '#94a3b8', minWidth: '20px', fontSize: '0.8rem' }}>{i + 1}.</span>
                                                                                    <MathJax inline>{wrapMath(step)}</MathJax>
                                                                                </div>
                                                                            ))}
                                                                        </MathJaxContext>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Per-question grade override */}
                                                        {(() => {
                                                            const isCorrect = answerOverrides[answer.id]?.isCorrect ?? answer.isCorrect ?? false;
                                                            return (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px', borderTop: '1px solid #e2e8f0' }}>
                                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '4px' }}>Result:</span>
                                                                    <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                                        <button
                                                                            onClick={() => {
                                                                                setAnswerOverrides(prev => ({
                                                                                    ...prev,
                                                                                    [answer.id]: { isCorrect: true, pointsEarned: answer.questionDetails?.points ?? 1 }
                                                                                }));
                                                                            }}
                                                                            style={{
                                                                                padding: '5px 16px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                                                                                background: isCorrect ? '#10b981' : '#f1f5f9',
                                                                                color: isCorrect ? '#fff' : '#94a3b8',
                                                                                transition: 'background 0.15s',
                                                                            }}
                                                                        >
                                                                            ✓ Correct
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setAnswerOverrides(prev => ({
                                                                                    ...prev,
                                                                                    [answer.id]: { isCorrect: false, pointsEarned: 0 }
                                                                                }));
                                                                            }}
                                                                            style={{
                                                                                padding: '5px 16px', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                                                                                background: !isCorrect ? '#ef4444' : '#f1f5f9',
                                                                                color: !isCorrect ? '#fff' : '#94a3b8',
                                                                                transition: 'background 0.15s',
                                                                            }}
                                                                        >
                                                                            ✗ Incorrect
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-answers">
                                        <h4>No Answers Found</h4>
                                        <p>This submission doesn't have any recorded answers.</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="submission-detail-actions">
                                <button
                                    onClick={() => {
                                        const csv = buildSubmissionDetailCSV(details);
                                        downloadCSV(csv, `submission-${details.id}-detail.csv`);
                                    }}
                                    className="btn-secondary"
                                >
                                    <BiDownload /> Export Data
                                </button>
                                <button
                                    onClick={handleSaveAnswerGrades}
                                    className="btn-primary"
                                    disabled={savingAnswerGrades}
                                >
                                    <BiSave /> {savingAnswerGrades ? 'Saving...' : 'Save Question Grades'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderGradingModal = () => {
        if (!gradingSubmission) return null;
        
        const student = students.find(s => s.id === gradingSubmission.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}` : `Student ${gradingSubmission.studentId}`;
        
        return (
            <div className="submission-detail-modal">
                <div className="submission-detail-content">
                    <div className="submission-detail-header">
                        <h3>Grade Submission - {studentName}</h3>
                        <button 
                            onClick={() => setGradingSubmission(null)}
                            className="close-btn"
                        >
                            <BiX />
                        </button>
                    </div>
                    
                    <div className="grading-form">
                        <div className="form-group">
                            <label htmlFor="score">Score (0-100)</label>
                            <input
                                id="score"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={gradeScore}
                                onChange={(e) => setGradeScore(e.target.value)}
                                placeholder="Enter score..."
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="feedback">Feedback (optional)</label>
                            <textarea
                                id="feedback"
                                value={gradeFeedback}
                                onChange={(e) => setGradeFeedback(e.target.value)}
                                placeholder="Provide feedback to the student..."
                                rows={4}
                            />
                        </div>
                    </div>
                    
                    <div className="submission-detail-actions">
                        <button 
                            onClick={() => setGradingSubmission(null)}
                            className="btn-secondary"
                            disabled={savingGrade}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveGrade}
                            className="btn-primary"
                            disabled={savingGrade || !gradeScore}
                        >
                            <BiSave /> {savingGrade ? 'Saving...' : 'Save Grade'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (!selectedAssignment) {
        return (
            <div className="assignment-results">
                <div className="results-header">
                    <button onClick={onBack} className="back-btn">
                        <BiArrowBack /> Back to Assignments
                    </button>
                    <h2>Assignment Results</h2>
                    <p>Select an assignment to view results and submissions</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                        <button onClick={() => setError('')}><BiX /></button>
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading assignments...</p>
                    </div>
                ) : (
                    <div className="assignments-grid">
                        {assignments.map(assignment => (
                            <div 
                                key={assignment.id} 
                                className="assignment-card clickable"
                                onClick={() => setSelectedAssignment(assignment)}
                            >
                                <div className="assignment-header">
                                    <h3>{assignment.title}</h3>
                                    <span className={`assignment-status ${assignment.isActive ? 'active' : 'inactive'}`}>
                                        {assignment.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                
                                <div className="assignment-meta">
                                    <div className="meta-item">
                                        <BiCalendar />
                                        <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <BiTime />
                                        <span>{assignment.timeLimit || 'No'} time limit</span>
                                    </div>
                                </div>
                                
                                <div className="assignment-description">
                                    {assignment.description || 'No description provided'}
                                </div>
                                
                                <div className="assignment-action">
                                    <button className="view-results-btn">
                                        <BiBarChart /> View Results
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {assignments.length === 0 && !loading && (
                    <div className="empty-state">
                        <BiBarChart size={64} />
                        <h3>No Assignments Found</h3>
                        <p>You haven't created any assignments yet.</p>
                    </div>
                )}
            </div>
        );
    }

    // Assignment selected - show results
    const stats = calculateStats();

    return (
        <div className="assignment-results">
            <div className="results-header">
                <button onClick={() => setSelectedAssignment(null)} className="back-btn">
                    <BiArrowBack /> Back to Assignments
                </button>
                <div className="assignment-info">
                    <h2>{selectedAssignment.title}</h2>
                    <p>Results and submissions overview</p>
                </div>
                <button onClick={loadAssignmentResults} className="refresh-btn">
                    <BiRefresh /> Refresh
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError('')}><BiX /></button>
                </div>
            )}

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading results...</p>
                </div>
            )}

            {assignmentDetails && (
                <>
                    {/* Statistics Overview */}
                    <div className="results-stats">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
                                <BiCheckCircle />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.submitted || 0}</div>
                                <div className="stat-label">Submissions</div>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon" style={{ backgroundColor: '#8b5cf6' }}>
                                <BiTargetLock />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{Math.round(stats.submissionRate || 0)}%</div>
                                <div className="stat-label">Completion Rate</div>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon" style={{ backgroundColor: '#06b6d4' }}>
                                <BiTrendingUp />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.averageScore || 0}%</div>
                                <div className="stat-label">Average Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Controls */}
                    <div className="results-controls">
                        <div className="control-group">
                            <label>Status Filter</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Submissions</option>
                                <option value="submitted">Submitted</option>
                                <option value="in_progress">In Progress</option>
                                <option value="not_started">Not Started</option>
                            </select>
                        </div>

                        <div className="control-group">
                            <label>Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-select"
                            >
                                <option value="name">Student Name</option>
                                <option value="submitted_at">Submission Date</option>
                                <option value="score">Score</option>
                            </select>
                        </div>
                    </div>

                    {/* Submissions List */}
                    <div className="submissions-container">
                        <div className="submissions-header">
                            <h3>Student Submissions ({filteredSubmissions.length})</h3>
                            <button 
                                onClick={handleExportData}
                                className="btn-secondary"
                            >
                                <BiDownload /> Export All
                            </button>
                        </div>
                        
                        {filteredSubmissions.length === 0 ? (
                            <div className="empty-submissions">
                                <BiStats size={48} />
                                <p>No submissions match your filters</p>
                            </div>
                        ) : (
                            <div className="submissions-table">
                                <div className="table-header">
                                    <div className="col-student">Student</div>
                                    <div className="col-status">Status</div>
                                    <div className="col-score">Score</div>
                                    <div className="col-submitted">Submitted</div>
                                    <div className="col-actions">Actions</div>
                                </div>
                                
                                {filteredSubmissions.map(submission => {
                                    const student = students.find(s => s.id === submission.studentId);
                                    const studentName = student ? `${student.firstName} ${student.lastName}` : `Student ${submission.studentId}`;
                                    
                                    return (
                                        <div key={submission.id} className="table-row">
                                            <div className="col-student">
                                                <div className="student-info">
                                                    <div className="student-name">{studentName}</div>
                                                    <div className="student-id">ID: {student?.studentId || submission.studentId}</div>
                                                </div>
                                            </div>
                                            <div className="col-status">
                                                <span 
                                                    className="status-badge"
                                                    style={{ backgroundColor: getStatusColor(submission.status) }}
                                                >
                                                    {getSubmissionStatus(submission)}
                                                </span>
                                            </div>
                                            <div className="col-score">
                                                {submission.grade != null ? `${submission.grade}%` : 'Not graded'}
                                            </div>
                                            <div className="col-submitted">
                                                {formatDateTime(submission.submittedAt)}
                                            </div>
                                            <div className="col-actions">
                                                <button
                                                    onClick={() => handleViewSubmission(submission)}
                                                    className="action-btn view-btn"
                                                    title="View Details"
                                                >
                                                    <BiShow />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Submission Detail Modal */}
            {viewingSubmission && renderSubmissionDetail(viewingSubmission)}
            
            {/* Grading Modal */}
            {gradingSubmission && renderGradingModal()}
        </div>
    );
};

export default AssignmentResults;