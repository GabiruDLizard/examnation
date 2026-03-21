import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import { getRecentMistakes, getMistakePatterns, getCuratedQuiz } from './TAService';
import { getStudentTopicAbility } from '../TeacherDashboard/TeacherDashboardService';
import './TAPageStudent.css';

const mathJaxConfig = { loader: { load: ['input/tex', 'output/chtml'] } };

const BADGE_COLOR = {
    'Sign Error':           { bg: '#fee2e2', color: '#dc2626' },
    'Arithmetic Error':     { bg: '#ffedd5', color: '#ea580c' },
    'Wrong Formula':        { bg: '#fef3c7', color: '#d97706' },
    'Distribution Error':   { bg: '#fce7f3', color: '#db2777' },
    'Wrong Operation':      { bg: '#ede9fe', color: '#7c3aed' },
    'Conceptual Error':     { bg: '#dbeafe', color: '#2563eb' },
    'Incomplete Solution':  { bg: '#d1fae5', color: '#059669' },
    'Other':                { bg: '#f1f5f9', color: '#64748b' },
};

function Badge({ type, style = {} }) {
    const colors = BADGE_COLOR[type] ?? BADGE_COLOR['Other'];
    return (
        <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px',
            borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
            background: colors.bg, color: colors.color, ...style
        }}>
            {type}
        </span>
    );
}

function StepsDisplay({ workingSteps, firstErrorStep, errorReason }) {
    if (!workingSteps) return null;

    // Split by actual newlines or escaped newlines
    const steps = workingSteps
        .split(/\\n|\n/)
        .map(s => s.trim())
        .filter(Boolean);

    if (steps.length === 0) return null;

    return (
        <div className="ta-steps-container">
            <div className="ta-steps-label">Your Working Steps</div>
            {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isError = firstErrorStep != null && stepNum === firstErrorStep;
                return (
                    <div
                        key={idx}
                        className={`ta-step-row ${isError ? 'ta-step-error' : ''}`}
                    >
                        <span className="ta-step-num">{stepNum}</span>
                        <span className="ta-step-text">
                            <MathJax>{step}</MathJax>
                        </span>
                        {isError && (
                            <span className="ta-step-flag">✗</span>
                        )}
                    </div>
                );
            })}
            {errorReason && (
                <div className="ta-error-reason">
                    <span className="ta-error-reason-label">
                        {firstErrorStep != null ? `Step ${firstErrorStep} — ` : 'Error: '}
                    </span>
                    {errorReason}
                </div>
            )}
        </div>
    );
}

function MistakeRow({ entry }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`ta-mistake-row ${open ? 'open' : ''}`}>
            <div className="ta-mistake-header" onClick={() => setOpen(o => !o)}>
                <div className="ta-mistake-q">
                    <MathJax>{entry.questionText}</MathJax>
                </div>
                <div className="ta-mistake-tags">
                    {entry.topic && (
                        <span className="ta-topic-pill">{entry.topic}</span>
                    )}
                    {entry.difficulty && (
                        <span className={`ta-diff-pill diff-${entry.difficulty?.replace(/\s+/g, '')}`}>
                            {entry.difficulty}
                        </span>
                    )}
                    {entry.mistakeType && <Badge type={entry.mistakeType} />}
                </div>
                <span className="ta-chevron">{open ? '▲' : '▼'}</span>
            </div>

            {open && (
                <div className="ta-mistake-detail">
                    <div className="ta-detail-row">
                        <div className="ta-detail-col">
                            <div className="ta-detail-label">Your Answer</div>
                            <div className="ta-detail-value">
                                <MathJax>{entry.studentAnswer || '—'}</MathJax>
                            </div>
                        </div>
                        <div className="ta-detail-col">
                            <div className="ta-detail-label">Correct Answer</div>
                            <div className="ta-detail-value correct">
                                <MathJax>{entry.correctAnswer || '—'}</MathJax>
                            </div>
                        </div>
                    </div>

                    <StepsDisplay
                        workingSteps={entry.workingSteps}
                        firstErrorStep={entry.firstErrorStep}
                        errorReason={entry.errorReason}
                    />

                    {!entry.workingSteps && entry.errorReason && (
                        <div className="ta-error-reason standalone">
                            <span className="ta-error-reason-label">Analysis: </span>
                            {entry.errorReason}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function FocusCard({ rank, topic, mistakeType, count }) {
    const colors = BADGE_COLOR[mistakeType] ?? BADGE_COLOR['Other'];
    const urgency = rank === 0 ? '#ef4444' : rank === 1 ? '#f59e0b' : '#6366f1';
    return (
        <div className="ta-focus-card" style={{ borderLeft: `4px solid ${urgency}` }}>
            <div className="ta-focus-rank" style={{ color: urgency }}>#{rank + 1}</div>
            <div className="ta-focus-type" style={{ color: colors.color }}>{mistakeType}</div>
            <div className="ta-focus-topic">{topic}</div>
            <div className="ta-focus-count" style={{ color: urgency }}>{count}×</div>
        </div>
    );
}

function TopicPatternCard({ topic, mistakes, topicAbility }) {
    const total = mistakes.reduce((s, m) => s + m.count, 0);
    const readiness = topicAbility != null
        ? Math.round(((topicAbility + 4) / 8) * 100)
        : null;

    return (
        <div className="ta-pattern-card">
            <div className="ta-pattern-header">
                <div className="ta-pattern-topic">{topic}</div>
                <div className="ta-pattern-stats">
                    {readiness != null && (
                        <span className="ta-pattern-readiness" style={{
                            color: readiness < 40 ? '#dc2626' : readiness < 65 ? '#d97706' : '#16a34a'
                        }}>
                            {readiness}% mastery
                        </span>
                    )}
                    <span className="ta-pattern-total">{total} mistake{total !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {readiness != null && (
                <div className="ta-mastery-bar-bg">
                    <div
                        className="ta-mastery-bar-fill"
                        style={{
                            width: `${readiness}%`,
                            background: readiness < 40 ? '#ef4444' : readiness < 65 ? '#f59e0b' : '#10b981'
                        }}
                    />
                </div>
            )}

            <div className="ta-pattern-mistakes">
                {mistakes.map((m, i) => (
                    <div key={i} className="ta-pattern-mistake-row">
                        <Badge type={m.mistakeType} style={{ fontSize: '0.7rem' }} />
                        <div className="ta-pattern-bar-bg">
                            <div
                                className="ta-pattern-bar-fill"
                                style={{ width: `${Math.round((m.count / total) * 100)}%` }}
                            />
                        </div>
                        <span className="ta-pattern-count">{m.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function MyTA() {
    const navigate = useNavigate();
    const studentId = getUserIdFromToken();

    const [mistakes, setMistakes] = useState([]);
    const [patterns, setPatterns] = useState({});
    const [curated, setCurated] = useState({ questionIds: [], focusTopics: [] });
    const [topicAbility, setTopicAbility] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;

        Promise.all([
            getRecentMistakes(studentId),
            getMistakePatterns(studentId),
            getCuratedQuiz(studentId),
            getStudentTopicAbility(studentId),
        ]).then(([m, p, c, ta]) => {
            setMistakes(m);

            const grouped = {};
            p.forEach(row => {
                if (!grouped[row.topic]) grouped[row.topic] = [];
                grouped[row.topic].push({ mistakeType: row.mistakeType, count: row.count });
            });
            setPatterns(grouped);

            setCurated(c);

            // Build lookup: topic → theta
            const taLookup = {};
            if (Array.isArray(ta)) {
                ta.forEach(row => { taLookup[row.topic] = row.theta; });
            }
            setTopicAbility(taLookup);
            setLoading(false);
        });
    }, [studentId]);

    const handleStartCurated = () => {
        localStorage.setItem('curatedQuizIds', JSON.stringify(curated.questionIds));
        navigate('/exampage');
    };

    // Top 3 most frequent (topic, mistakeType) pairs for the Focus section
    const allPatterns = Object.entries(patterns).flatMap(([topic, mistakes]) =>
        mistakes.map(m => ({ topic, mistakeType: m.mistakeType, count: m.count }))
    ).sort((a, b) => b.count - a.count).slice(0, 3);

    const topicEntries = Object.entries(patterns).sort((a, b) => {
        const totalA = a[1].reduce((s, m) => s + m.count, 0);
        const totalB = b[1].reduce((s, m) => s + m.count, 0);
        return totalB - totalA;
    });

    if (loading) {
        return (
            <div className="ta-root">
                <div className="ta-loading-screen">Analyzing your performance...</div>
            </div>
        );
    }

    const hasData = mistakes.length > 0;

    return (
        <MathJaxContext version={3} config={mathJaxConfig}>
            <div className="ta-root">

                {/* ── Header ── */}
                <div className="ta-header">
                    <div>
                        <h1 className="ta-title">My Learning Assistant</h1>
                        {hasData && (
                            <p className="ta-subtitle">
                                {mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''} analyzed
                                across {topicEntries.length} topic{topicEntries.length !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>

                {!hasData ? (
                    <div className="ta-empty-state">
                        <div className="ta-empty-icon">📊</div>
                        <div className="ta-empty-title">No data yet</div>
                        <div className="ta-empty-body">
                            Complete practice sessions or assignments with working steps shown
                            to unlock your personalized learning profile.
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Focus Right Now ── */}
                        {allPatterns.length > 0 && (
                            <div className="ta-section">
                                <div className="ta-section-title">Focus Right Now</div>
                                <p className="ta-section-sub">
                                    These are the specific error types costing you the most marks — fix these first.
                                </p>
                                <div className="ta-focus-grid">
                                    {allPatterns.map((p, i) => (
                                        <FocusCard
                                            key={i}
                                            rank={i}
                                            topic={p.topic}
                                            mistakeType={p.mistakeType}
                                            count={p.count}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Curated Practice ── */}
                        {curated.questionIds.length > 0 && (
                            <div className="ta-curated-banner">
                                <div className="ta-curated-left">
                                    <div className="ta-curated-title">Targeted Practice Ready</div>
                                    <div className="ta-curated-topics">
                                        {curated.focusTopics.map(t => (
                                            <span key={t} className="ta-topic-pill">{t}</span>
                                        ))}
                                    </div>
                                    <div className="ta-curated-desc">
                                        {curated.questionIds.length} questions hand-picked from your weak areas
                                    </div>
                                </div>
                                <button className="ta-curated-btn" onClick={handleStartCurated}>
                                    Start Practice ▶
                                </button>
                            </div>
                        )}

                        {/* ── Topic Breakdown ── */}
                        {topicEntries.length > 0 && (
                            <div className="ta-section">
                                <div className="ta-section-title">Topic Breakdown</div>
                                <div className="ta-pattern-grid">
                                    {topicEntries.map(([topic, mistakeList]) => (
                                        <TopicPatternCard
                                            key={topic}
                                            topic={topic}
                                            mistakes={mistakeList}
                                            topicAbility={topicAbility[topic] ?? null}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Recent Mistakes ── */}
                        <div className="ta-section">
                            <div className="ta-section-title">
                                Recent Mistakes
                                <span className="ta-section-count">{mistakes.length}</span>
                            </div>
                            {mistakes.map(entry => (
                                <MistakeRow key={entry.id} entry={entry} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </MathJaxContext>
    );
}
