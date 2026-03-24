import React, { useState, useEffect } from 'react';
import { getRecentMistakes } from './TAService';
import './StudentMistakePatterns.css';

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

function MistakeBadge({ type }) {
    const c = BADGE_COLOR[type] ?? BADGE_COLOR['Other'];
    return (
        <span className="smp-badge" style={{ background: c.bg, color: c.color }}>
            {type}
        </span>
    );
}

function StatusPill({ status }) {
    const styles = {
        Active:    { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
        Improving: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
        Resolved:  { bg: '#f0fdf4', color: '#16a34a', dot: '#10b981' },
    };
    const s = styles[status] ?? styles.Resolved;
    return (
        <span className="smp-status-pill" style={{ background: s.bg, color: s.color }}>
            <span className="smp-status-dot" style={{ background: s.dot }} />
            {status}
        </span>
    );
}

/**
 * Classifies a pattern based on recency.
 * - Active:    mistakes in last 21 days
 * - Improving: mistakes in last 60 days but NOT last 21
 * - Resolved:  all mistakes older than 60 days
 */
function classifyPattern(entries) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const recent21 = entries.filter(e => (now - new Date(e.createdAt)) < 21 * day).length;
    const recent60 = entries.filter(e => (now - new Date(e.createdAt)) < 60 * day).length;

    if (recent21 > 0) return 'Active';
    if (recent60 > 0) return 'Improving';
    return 'Resolved';
}

function daysAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr);
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

function computePatterns(mistakes) {
    const groups = {};
    mistakes.forEach(m => {
        if (!m.topic || !m.mistakeType) return;
        const key = `${m.topic}::${m.mistakeType}`;
        if (!groups[key]) groups[key] = { topic: m.topic, mistakeType: m.mistakeType, entries: [] };
        groups[key].entries.push(m);
    });

    return Object.values(groups)
        .map(g => {
            const sorted = [...g.entries].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            const status = classifyPattern(sorted);
            return {
                topic: g.topic,
                mistakeType: g.mistakeType,
                count: sorted.length,
                firstSeen: sorted[sorted.length - 1].createdAt,
                lastSeen: sorted[0].createdAt,
                status,
                examples: sorted.slice(0, 3),
            };
        })
        // Only show genuine patterns: 2+ occurrences
        .filter(p => p.count >= 2)
        .sort((a, b) => {
            // Active first, then Improving, then Resolved; within each group, by count
            const order = { Active: 0, Improving: 1, Resolved: 2 };
            if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
            return b.count - a.count;
        });
}

function PatternCard({ pattern }) {
    const [open, setOpen] = useState(false);

    const streakLabel = pattern.count >= 8
        ? 'Strong pattern'
        : pattern.count >= 4
        ? 'Recurring'
        : 'Emerging';

    return (
        <div className={`smp-card status-${pattern.status.toLowerCase()}`}>
            <div className="smp-card-header" onClick={() => setOpen(o => !o)}>
                <div className="smp-card-left">
                    <StatusPill status={pattern.status} />
                    <MistakeBadge type={pattern.mistakeType} />
                    <span className="smp-card-topic">{pattern.topic}</span>
                </div>
                <div className="smp-card-right">
                    <span className="smp-card-streak">{streakLabel}</span>
                    <span className="smp-card-count">{pattern.count}×</span>
                    <span className="smp-card-last">last {daysAgo(pattern.lastSeen)}</span>
                    <span className="smp-chevron">{open ? '▲' : '▼'}</span>
                </div>
            </div>

            {open && (
                <div className="smp-examples">
                    <div className="smp-examples-label">Recent examples</div>
                    {pattern.examples.map((ex, i) => (
                        <div key={i} className="smp-example-row">
                            <div className="smp-example-q">
                                {ex.questionText?.length > 100
                                    ? ex.questionText.slice(0, 100) + '…'
                                    : ex.questionText}
                            </div>
                            {ex.errorReason && (
                                <div className="smp-example-reason">
                                    {ex.firstErrorStep != null && (
                                        <span className="smp-step-ref">Step {ex.firstErrorStep} — </span>
                                    )}
                                    {ex.errorReason}
                                </div>
                            )}
                            <div className="smp-example-meta">
                                {ex.difficulty && <span className="smp-diff">{ex.difficulty}</span>}
                                <span className="smp-date">{daysAgo(ex.createdAt)}</span>
                            </div>
                        </div>
                    ))}
                    <div className="smp-timeline">
                        First seen {daysAgo(pattern.firstSeen)} · {pattern.count} occurrence{pattern.count !== 1 ? 's' : ''}
                        {pattern.status === 'Active'
                            ? ' · Still happening'
                            : pattern.status === 'Improving'
                            ? ' · No recent occurrences — improving'
                            : ' · Appears resolved'}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * StudentMistakePatterns
 * Props:
 *   studentId   — required
 *   compact     — if true, shows fewer items and a "show all" toggle (for inline use in TAPageTeacher)
 */
export default function StudentMistakePatterns({ studentId, compact = false }) {
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(!compact);

    useEffect(() => {
        if (!studentId) return;
        getRecentMistakes(studentId).then(mistakes => {
            setPatterns(computePatterns(mistakes));
            setLoading(false);
        });
    }, [studentId]);

    if (loading) {
        return <div className="smp-loading">Analyzing mistake patterns...</div>;
    }

    if (patterns.length === 0) {
        return (
            <div className="smp-empty">
                No recurring patterns yet — needs at least 2 occurrences of the same mistake type on the same topic.
            </div>
        );
    }

    const activeCount = patterns.filter(p => p.status === 'Active').length;
    const displayed = showAll ? patterns : patterns.slice(0, 3);

    return (
        <div className="smp-root">
            {/* Summary line */}
            <div className="smp-summary">
                {activeCount > 0 ? (
                    <>
                        <span className="smp-summary-alert">{activeCount} active pattern{activeCount !== 1 ? 's' : ''}</span>
                        {' — '}this student keeps making the same mistake{activeCount !== 1 ? 's' : ''}.
                    </>
                ) : (
                    <>
                        <span className="smp-summary-ok">{patterns.length} historical pattern{patterns.length !== 1 ? 's' : ''}</span>
                        {' — no active patterns right now.'}
                    </>
                )}
            </div>

            {displayed.map((p, i) => (
                <PatternCard key={i} pattern={p} />
            ))}

            {compact && patterns.length > 3 && (
                <button
                    className="smp-show-more"
                    onClick={() => setShowAll(s => !s)}
                >
                    {showAll ? 'Show less' : `Show ${patterns.length - 3} more patterns`}
                </button>
            )}
        </div>
    );
}
