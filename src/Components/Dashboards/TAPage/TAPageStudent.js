import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import { getRecentMistakes, getMistakePatterns, getCuratedQuiz } from './TAService';
import './TAPageStudent.css';

const BADGE_CLASS = {
    'Sign Error':      'badge-sign',
    'Arithmetic Error':'badge-arithmetic',
    'Wrong Formula':   'badge-formula',
    'Distribution Error': 'badge-distribution',
    'Wrong Operation': 'badge-operation',
    'Conceptual Error':'badge-conceptual',
    'Incomplete Solution': 'badge-incomplete',
    'Other':           'badge-other',
};

function MistakeRow({ entry }) {
    const [open, setOpen] = useState(false);
    const badgeClass = BADGE_CLASS[entry.mistakeType] ?? 'badge-other';
    const diffClass = `diff-${entry.difficulty}`;

    return (
        <div className="mistake-row">
            <div className="mistake-row-header" onClick={() => setOpen(o => !o)}>
                <span className="mistake-question-text" title={entry.questionText}>
                    {entry.questionText}
                </span>
                {entry.topic && (
                    <span className="mistake-topic-badge">{entry.topic}</span>
                )}
                {entry.difficulty && (
                    <span className={`mistake-difficulty-badge ${diffClass}`}>{entry.difficulty}</span>
                )}
                {entry.mistakeType && (
                    <span className={`mistake-badge ${badgeClass}`}>{entry.mistakeType}</span>
                )}
                <span className="mistake-expand-icon">{open ? '▲' : '▼'}</span>
            </div>

            {open && (
                <div className="mistake-row-detail">
                    {entry.studentAnswer && (
                        <div className="detail-block">
                            <div className="detail-label">Your Answer</div>
                            <div className="detail-value">{entry.studentAnswer}</div>
                        </div>
                    )}
                    {entry.correctAnswer && (
                        <div className="detail-block">
                            <div className="detail-label">Correct Answer</div>
                            <div className="detail-value">{entry.correctAnswer}</div>
                        </div>
                    )}
                    <div className="step-error-box">
                        <div className="step-error-label">
                            {entry.firstErrorStep != null
                                ? `Step ${entry.firstErrorStep} — where you went wrong`
                                : 'Final answer was incorrect'}
                        </div>
                        <div className="step-error-text">
                            {entry.errorReason ?? 'No step-level analysis available.'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PatternCard({ topic, mistakes }) {
    const total = mistakes.reduce((sum, m) => sum + m.count, 0);
    return (
        <div className="pattern-card">
            <div className="pattern-topic">{topic}</div>
            <div className="pattern-count">{total} mistake{total !== 1 ? 's' : ''} recorded</div>
            <div className="pattern-mistake-list">
                {mistakes.map((m, i) => (
                    <div className="pattern-mistake-row" key={i}>
                        <span style={{ flex: '0 0 110px', color: '#475569' }}>{m.mistakeType}</span>
                        <div className="pattern-bar-bg">
                            <div
                                className="pattern-bar-fill"
                                style={{ width: `${Math.round((m.count / total) * 100)}%` }}
                            />
                        </div>
                        <span className="pattern-mistake-count">{m.count}</span>
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;

        Promise.all([
            getRecentMistakes(studentId),
            getMistakePatterns(studentId),
            getCuratedQuiz(studentId)
        ]).then(([m, p, c]) => {
            setMistakes(m);

            // Group patterns by topic
            const grouped = {};
            p.forEach(row => {
                if (!grouped[row.topic]) grouped[row.topic] = [];
                grouped[row.topic].push({ mistakeType: row.mistakeType, count: row.count });
            });
            setPatterns(grouped);

            setCurated(c);
            setLoading(false);
        });
    }, [studentId]);

    const handleStartCurated = () => {
        localStorage.setItem('curatedQuizIds', JSON.stringify(curated.questionIds));
        navigate('/exampage');
    };

    const topicEntries = Object.entries(patterns);

    return (
        <div className="min-h-screen bg-gray-50 p-10">
            <div className="topPage">
                <h1 className="text-3xl font-bold">My TA</h1>
            </div>

            {/* ── Section 1: Recent Mistakes ── */}
            <div className="ta-section">
                <div className="ta-section-title">Recent Mistakes</div>
                {loading ? (
                    <div className="ta-loading">Loading...</div>
                ) : mistakes.length === 0 ? (
                    <div className="ta-empty">No mistakes recorded yet. Complete some practice to get feedback here.</div>
                ) : (
                    mistakes.map(entry => (
                        <MistakeRow key={entry.id} entry={entry} />
                    ))
                )}
            </div>

            {/* ── Section 2: Mistake Patterns ── */}
            <div className="ta-section">
                <div className="ta-section-title">Mistake Patterns</div>
                {loading ? (
                    <div className="ta-loading">Loading...</div>
                ) : topicEntries.length === 0 ? (
                    <div className="ta-empty">Patterns will appear here once you have mistakes recorded across sessions.</div>
                ) : (
                    <div className="pattern-grid">
                        {topicEntries.map(([topic, mistakeList]) => (
                            <PatternCard key={topic} topic={topic} mistakes={mistakeList} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Section 3: Curated Quiz ── */}
            <div className="ta-section">
                <div className="ta-section-title">Curated Practice</div>
                {loading ? (
                    <div className="ta-loading">Loading...</div>
                ) : curated.questionIds.length === 0 ? (
                    <div className="curated-empty">
                        Complete some practice sessions to unlock your personalized quiz focused on your weak areas.
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: 12, fontSize: '0.875rem', color: '#475569' }}>
                            Focused on your most common mistake areas:
                        </div>
                        <div className="curated-topics">
                            {curated.focusTopics.map(t => (
                                <span key={t} className="curated-topic-pill">{t}</span>
                            ))}
                        </div>
                        <button className="curated-start-btn" onClick={handleStartCurated}>
                            Start Curated Practice ({curated.questionIds.length} questions)
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
