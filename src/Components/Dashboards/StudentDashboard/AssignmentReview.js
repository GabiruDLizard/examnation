import React, { useState, useEffect, useMemo } from 'react';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import { BiCheckCircle, BiXCircle, BiLeftArrow, BiChevronDown, BiChevronUp } from 'react-icons/bi';
import { getQuestionsByAssignmentId, getAnswersBySubmissionId } from './StudentDashboardService';
import './AssignmentReview.css';

const mathJaxConfig = { loader: { load: ['input/tex', 'output/chtml'] } };

export default function AssignmentReview({ assignment, submission, onBack }) {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedQuestions, setExpandedQuestions] = useState({});

    useEffect(() => {
        const load = async () => {
            try {
                const [qs, ans] = await Promise.all([
                    getQuestionsByAssignmentId(assignment.id),
                    getAnswersBySubmissionId(submission.id)
                ]);
                setQuestions(qs);
                setAnswers(ans);

                // Auto-expand all incorrect questions
                const autoExpand = {};
                ans.forEach(a => { if (!a.isCorrect) autoExpand[a.questionId] = true; });
                setExpandedQuestions(autoExpand);
            } catch (err) {
                console.error('Error loading review data:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [assignment.id, submission.id]);

    const answerMap = useMemo(() => {
        const map = {};
        answers.forEach(a => { map[a.questionId] = a; });
        return map;
    }, [answers]);

    const toggleExpand = (questionId) => {
        setExpandedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
    };

    const parseSteps = (text) => {
        if (!text) return [];
        return text.split('\n').map(s => s.trim()).filter(Boolean);
    };

    const grade = submission?.grade;
    const correctCount = answers.filter(a => a.isCorrect).length;
    const totalCount = answers.length;

    const letterGrade = grade >= 90 ? 'A' : grade >= 80 ? 'B' : grade >= 70 ? 'C' : grade >= 60 ? 'D' : 'F';
    const gradeClass = grade >= 90 ? 'a' : grade >= 80 ? 'b' : grade >= 70 ? 'c' : grade >= 60 ? 'd' : 'f';

    if (loading) {
        return (
            <div className="ar-container">
                <div className="loading-state">
                    <div className="spinner" />
                    <p>Loading review...</p>
                </div>
            </div>
        );
    }

    return (
        <MathJaxContext version={3} config={mathJaxConfig}>
            <div className="ar-container">
                {/* Header */}
                <div className="ar-header">
                    <button onClick={onBack} className="back-btn">
                        <BiLeftArrow /> Back to Assignments
                    </button>
                    <div>
                        <h1>{assignment.title}</h1>
                        <p className="ar-subtitle">
                            Submitted {submission?.submittedAt
                                ? new Date(submission.submittedAt).toLocaleDateString()
                                : ''}
                        </p>
                    </div>
                </div>

                {/* Grade summary */}
                <div className="ar-summary">
                    <div className="ar-grade-badge">
                        <span className={`ar-letter grade-${gradeClass}`}>{letterGrade}</span>
                        <span className="ar-percent">{grade != null ? `${Math.round(grade)}%` : '—'}</span>
                    </div>
                    <div className="ar-summary-stats">
                        <div className="ar-stat">
                            <span className="ar-stat-value" style={{ color: '#10b981' }}>{correctCount}</span>
                            <span className="ar-stat-label">Correct</span>
                        </div>
                        <div className="ar-stat">
                            <span className="ar-stat-value" style={{ color: '#ef4444' }}>{totalCount - correctCount}</span>
                            <span className="ar-stat-label">Incorrect</span>
                        </div>
                        <div className="ar-stat">
                            <span className="ar-stat-value">{totalCount}</span>
                            <span className="ar-stat-label">Total</span>
                        </div>
                    </div>
                    <p className="ar-hint">Incorrect answers are expanded below with a step-by-step solution.</p>
                </div>

                {/* Question list */}
                <div className="ar-questions">
                    {questions.map((q, idx) => {
                        const details = q.questionDetails || q;
                        const qId = details.id || q.questionId;
                        const answer = answerMap[qId];
                        const isCorrect = answer?.isCorrect;
                        const isExpanded = expandedQuestions[qId];

                        const studentSteps = parseSteps(answer?.answer);
                        const solutionSteps = parseSteps(details.solutionSteps || details.answerBreakdown);

                        return (
                            <div key={qId} className={`ar-question ${isCorrect ? 'correct' : 'incorrect'}`}>
                                {/* Question header row */}
                                <div
                                    className="ar-question-header"
                                    onClick={() => toggleExpand(qId)}
                                    role="button"
                                >
                                    <div className="ar-question-left">
                                        <span className="ar-q-number">Q{idx + 1}</span>
                                        {isCorrect
                                            ? <BiCheckCircle className="ar-status-icon correct" />
                                            : <BiXCircle className="ar-status-icon incorrect" />}
                                        <span className="ar-q-subject">{details.subject || ''}</span>
                                        <span className={`ar-difficulty ${(details.difficultyLevel || '').toLowerCase()}`}>
                                            {details.difficultyLevel}
                                        </span>
                                    </div>
                                    <div className="ar-question-right">
                                        <span className="ar-points">
                                            {answer?.pointsEarned ?? 0} / {q.points ?? 1} pts
                                        </span>
                                        {!isCorrect && (
                                            isExpanded ? <BiChevronUp /> : <BiChevronDown />
                                        )}
                                    </div>
                                </div>

                                {/* Question text — always visible */}
                                <div className="ar-question-text">
                                    <MathJax>{details.questionText || details.text || ''}</MathJax>
                                </div>

                                {/* Correct answer — just show it inline */}
                                {isCorrect && (
                                    <div className="ar-correct-answer">
                                        <span className="ar-label">Your answer:</span>
                                        <MathJax>{answer?.answer || '—'}</MathJax>
                                    </div>
                                )}

                                {/* Side-by-side breakdown — only for incorrect, only when expanded */}
                                {!isCorrect && isExpanded && (
                                    <div className="ar-breakdown">
                                        <div className="ar-column student-column">
                                            <div className="ar-column-header">
                                                <BiXCircle style={{ color: '#ef4444' }} />
                                                Your Steps
                                            </div>
                                            {studentSteps.length > 0 ? (
                                                <ol className="ar-steps">
                                                    {studentSteps.map((step, i) => (
                                                        <li key={i} className="ar-step">
                                                            <MathJax>{step}</MathJax>
                                                        </li>
                                                    ))}
                                                </ol>
                                            ) : (
                                                <p className="ar-no-steps">No answer submitted.</p>
                                            )}
                                            <div className="ar-final-answer wrong">
                                                <span className="ar-label">Your answer:</span>
                                                <MathJax>{studentSteps[studentSteps.length - 1] || '—'}</MathJax>
                                            </div>
                                        </div>

                                        <div className="ar-divider" />

                                        <div className="ar-column solution-column">
                                            <div className="ar-column-header">
                                                <BiCheckCircle style={{ color: '#10b981' }} />
                                                Correct Solution
                                            </div>
                                            {solutionSteps.length > 0 ? (
                                                <ol className="ar-steps">
                                                    {solutionSteps.map((step, i) => (
                                                        <li key={i} className="ar-step">
                                                            <MathJax>{step}</MathJax>
                                                        </li>
                                                    ))}
                                                </ol>
                                            ) : (
                                                <p className="ar-no-steps">No solution steps provided.</p>
                                            )}
                                            <div className="ar-final-answer correct">
                                                <span className="ar-label">Correct answer:</span>
                                                <MathJax>{details.correctAnswer || '—'}</MathJax>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </MathJaxContext>
    );
}
