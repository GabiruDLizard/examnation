import React, { useState, useEffect } from 'react';
import './StudyHistory.css';
import {
    BiCheckCircle, BiXCircle, BiChevronDown, BiChevronUp,
    BiBookOpen, BiBullseye, BiClipboard, BiTime, BiLoader
} from 'react-icons/bi';
import { authFetch } from '../../../utils/api';
import MathText from '../../Shared/MathText';

// ── helpers ──────────────────────────────────────────────────────

function groupPracticeSessions(answers) {
    const filtered = answers.filter(a =>
        a.attemptMode === 'practice' || a.attemptMode === 'adaptive_test'
    );
    const grouped = {};
    filtered.forEach(a => {
        const dateKey = a.answeredAt ? a.answeredAt.split('T')[0] : 'unknown';
        const key = `${dateKey}__${a.attemptMode || 'practice'}`;
        if (!grouped[key]) grouped[key] = { date: dateKey, mode: a.attemptMode || 'practice', answers: [] };
        grouped[key].answers.push(a);
    });
    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function difficultyColor(level) {
    if (!level) return '#94a3b8';
    const l = level.toLowerCase();
    if (l === 'easy') return '#22c55e';
    if (l === 'hard') return '#ef4444';
    return '#f59e0b';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
}

function formatWorking(raw) {
    if (!raw) return null;
    return raw.split(/\\n|\n/).map(s => s.trim()).filter(Boolean);
}

function statusLabel(status) {
    switch (status) {
        case 'approved':  return { text: 'Graded', color: '#16a34a', bg: '#dcfce7' };
        case 'pending_review': return { text: 'Under Review', color: '#d97706', bg: '#fef3c7' };
        case 'submitted': return { text: 'Submitted', color: '#2563eb', bg: '#dbeafe' };
        default:          return { text: status, color: '#64748b', bg: '#f1f5f9' };
    }
}

// ── Practice session card ─────────────────────────────────────────

function PracticeCard({ session }) {
    const [expanded, setExpanded] = useState(false);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    const correct = session.answers.filter(a => a.isCorrect).length;
    const total = session.answers.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const isAdaptive = session.mode === 'adaptive_test';

    const handleExpand = async () => {
        if (!expanded && !details) {
            setLoading(true);
            try {
                const questionDetails = await Promise.all(
                    session.answers.map(async a => {
                        try {
                            const res = await authFetch(`/question/${a.questionId}`);
                            const q = res.ok ? await res.json() : null;
                            return { answer: a, question: q };
                        } catch {
                            return { answer: a, question: null };
                        }
                    })
                );
                setDetails(questionDetails);
            } finally {
                setLoading(false);
            }
        }
        setExpanded(e => !e);
    };

    return (
        <div className="sh-card">
            <div className="sh-card-header" onClick={handleExpand}>
                <div className="sh-card-left">
                    <span className={`sh-badge ${isAdaptive ? 'adaptive' : 'practice'}`}>
                        {isAdaptive ? <BiBullseye size={13} /> : <BiBookOpen size={13} />}
                        {isAdaptive ? 'Adaptive Test' : 'Practice'}
                    </span>
                    <span className="sh-date">{formatDate(session.date)}</span>
                </div>
                <div className="sh-card-right">
                    <span className="sh-stat">{total} questions</span>
                    <span className={`sh-accuracy ${accuracy >= 70 ? 'good' : accuracy >= 50 ? 'mid' : 'low'}`}>
                        {accuracy}% accuracy
                    </span>
                    <span className="sh-expand-icon">
                        {loading ? <BiLoader size={18} className="sh-spin" /> : expanded ? <BiChevronUp size={18} /> : <BiChevronDown size={18} />}
                    </span>
                </div>
            </div>

            {expanded && details && (
                <div className="sh-card-body">
                    {details.map(({ answer, question }, i) => (
                        <div key={i} className="sh-question-row">
                            <div className="sh-question-meta">
                                <span className="sh-q-num">Q{i + 1}</span>
                                <span className={`sh-result-icon ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                    {answer.isCorrect
                                        ? <BiCheckCircle size={18} />
                                        : <BiXCircle size={18} />}
                                </span>
                                <span className="sh-diff-dot" style={{ background: difficultyColor(answer.difficultyLevel) }} />
                                <span className="sh-diff-label">{answer.difficultyLevel || '—'}</span>
                            </div>
                            {question ? (
                                <div className="sh-question-content">
                                    <p className="sh-question-text"><MathText>{question.questionText || question.question_text || 'Question text unavailable'}</MathText></p>
                                    <div className="sh-answers-row">
                                        <div className="sh-answer-block student">
                                            <span className="sh-answer-label">Your answer</span>
                                            <span className="sh-answer-value"><MathText>{answer.answerText || '—'}</MathText></span>
                                        </div>
                                        {!answer.isCorrect && (
                                            <div className="sh-answer-block correct">
                                                <span className="sh-answer-label">Correct answer</span>
                                                <span className="sh-answer-value"><MathText>{question.correctAnswer || question.correct_answer || '—'}</MathText></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="sh-question-content">
                                    <p className="sh-question-text muted">Question #{answer.questionId}</p>
                                    <span className="sh-answer-value"><MathText>{answer.answerText || '—'}</MathText></span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Assignment submission card ────────────────────────────────────

function AssignmentCard({ submission, assignmentTitle }) {
    const [expanded, setExpanded] = useState(false);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    const status = statusLabel(submission.status);

    const handleExpand = async () => {
        if (!expanded && !details) {
            setLoading(true);
            try {
                const answersRes = await authFetch(`/assignmentanswer/submission/${submission.id}`);
                const answers = answersRes.ok ? await answersRes.json() : [];

                const withQuestions = await Promise.all(
                    answers.map(async a => {
                        try {
                            const res = await authFetch(`/question/${a.questionId}`);
                            const q = res.ok ? await res.json() : null;
                            return { answer: a, question: q };
                        } catch {
                            return { answer: a, question: null };
                        }
                    })
                );
                setDetails(withQuestions);
            } finally {
                setLoading(false);
            }
        }
        setExpanded(e => !e);
    };

    return (
        <div className="sh-card">
            <div className="sh-card-header" onClick={handleExpand}>
                <div className="sh-card-left">
                    <span className="sh-badge assignment">
                        <BiClipboard size={13} />
                        Assignment
                    </span>
                    <div className="sh-assignment-title-group">
                        <span className="sh-date">{assignmentTitle || `Assignment #${submission.assignmentId}`}</span>
                        {submission.submittedAt && (
                            <span className="sh-submitted-at">
                                <BiTime size={12} /> {formatDate(submission.submittedAt.split('T')[0])}
                            </span>
                        )}
                    </div>
                </div>
                <div className="sh-card-right">
                    {submission.grade != null && (
                        <span className={`sh-accuracy ${submission.grade >= 70 ? 'good' : submission.grade >= 50 ? 'mid' : 'low'}`}>
                            {submission.grade}%
                        </span>
                    )}
                    <span className="sh-status-pill" style={{ color: status.color, background: status.bg }}>
                        {status.text}
                    </span>
                    <span className="sh-expand-icon">
                        {loading ? <BiLoader size={18} className="sh-spin" /> : expanded ? <BiChevronUp size={18} /> : <BiChevronDown size={18} />}
                    </span>
                </div>
            </div>

            {expanded && details && (
                <div className="sh-card-body">
                    {details.length === 0 ? (
                        <p className="sh-no-answers">No answers recorded for this submission.</p>
                    ) : details.map(({ answer, question }, i) => {
                        const steps = formatWorking(answer.answer);
                        return (
                            <div key={i} className="sh-question-row">
                                <div className="sh-question-meta">
                                    <span className="sh-q-num">Q{i + 1}</span>
                                    {answer.isCorrect != null && (
                                        <span className={`sh-result-icon ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                            {answer.isCorrect ? <BiCheckCircle size={18} /> : <BiXCircle size={18} />}
                                        </span>
                                    )}
                                    {answer.pointsEarned != null && (
                                        <span className="sh-points">{answer.pointsEarned} pts</span>
                                    )}
                                </div>
                                <div className="sh-question-content">
                                    {question && (
                                        <p className="sh-question-text">
                                            {question.questionText || question.question_text || `Question #${answer.questionId}`}
                                        </p>
                                    )}
                                    {steps && steps.length > 0 && (
                                        <div className="sh-working">
                                            <span className="sh-answer-label">Your working</span>
                                            <ol className="sh-steps">
                                                {steps.map((step, si) => (
                                                    <li key={si} className="sh-step"><MathText>{step}</MathText></li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                    {question && answer.isCorrect === false && (
                                        <div className="sh-answer-block correct" style={{ marginTop: 8 }}>
                                            <span className="sh-answer-label">Correct answer</span>
                                            <span className="sh-answer-value"><MathText>{question.correctAnswer || question.correct_answer || '—'}</MathText></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────

function StudyHistory({ studentAnswers, userId }) {
    const [activeTab, setActiveTab] = useState('practice');
    const [submissions, setSubmissions] = useState([]);
    const [assignmentTitles, setAssignmentTitles] = useState({});
    const [loadingSubmissions, setLoadingSubmissions] = useState(true);

    const practiceSessions = groupPracticeSessions(studentAnswers || []);

    useEffect(() => {
        if (!userId) return;
        const fetchSubmissions = async () => {
            setLoadingSubmissions(true);
            try {
                const res = await authFetch(`/assignmentsubmission/student/${userId}`);
                if (!res.ok) { setSubmissions([]); return; }
                const subs = await res.json();
                const sorted = subs.sort((a, b) =>
                    new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
                );
                setSubmissions(sorted);

                // Fetch assignment titles in bulk
                const uniqueAssignmentIds = [...new Set(subs.map(s => s.assignmentId))];
                const titleMap = {};
                await Promise.all(
                    uniqueAssignmentIds.map(async id => {
                        try {
                            const r = await authFetch(`/assignment/${id}`);
                            if (r.ok) {
                                const a = await r.json();
                                titleMap[id] = a.title;
                            }
                        } catch { /* skip */ }
                    })
                );
                setAssignmentTitles(titleMap);
            } catch {
                setSubmissions([]);
            } finally {
                setLoadingSubmissions(false);
            }
        };
        fetchSubmissions();
    }, [userId]);

    return (
        <div className="sh-root">
            <div className="sh-heading">
                <h2>Study History</h2>
                <p>Your practice sessions and assignment submissions.</p>
            </div>

            <div className="sh-tabs">
                <button
                    className={`sh-tab ${activeTab === 'practice' ? 'active' : ''}`}
                    onClick={() => setActiveTab('practice')}
                >
                    <BiBookOpen size={15} /> Practice & Tests
                    {practiceSessions.length > 0 && <span className="sh-tab-count">{practiceSessions.length}</span>}
                </button>
                <button
                    className={`sh-tab ${activeTab === 'assignments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assignments')}
                >
                    <BiClipboard size={15} /> Assignments
                    {submissions.length > 0 && <span className="sh-tab-count">{submissions.length}</span>}
                </button>
            </div>

            {activeTab === 'practice' && (
                <div className="sh-list">
                    {practiceSessions.length === 0 ? (
                        <div className="no-data">
                            <BiBookOpen size={48} />
                            <h3>No sessions yet</h3>
                            <p>Complete a practice session or adaptive test to see your history here.</p>
                        </div>
                    ) : practiceSessions.map((session, i) => (
                        <PracticeCard key={i} session={session} />
                    ))}
                </div>
            )}

            {activeTab === 'assignments' && (
                <div className="sh-list">
                    {loadingSubmissions ? (
                        <div className="sh-loading">Loading submissions…</div>
                    ) : submissions.length === 0 ? (
                        <div className="no-data">
                            <BiClipboard size={48} />
                            <h3>No submissions yet</h3>
                            <p>Submit an assignment to see it here.</p>
                        </div>
                    ) : submissions.map((sub, i) => (
                        <AssignmentCard
                            key={i}
                            submission={sub}
                            assignmentTitle={assignmentTitles[sub.assignmentId]}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default StudyHistory;
