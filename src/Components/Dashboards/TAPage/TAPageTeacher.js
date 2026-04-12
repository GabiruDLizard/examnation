import React, { useEffect, useState } from 'react';
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import { getTeacherPatterns, getStrugglingStudents, assignCuratedQuizToStudent } from './TAService';
import { getTeacherClasses } from '../TeacherDashboard/TeacherDashboardService';
import StudentMistakePatterns from './StudentMistakePatterns';
import { toast } from 'react-toastify';
import './TAPageTeacher.css';
import { DEMO_MODE, DEMO_TA_PATTERNS, DEMO_TA_STRUGGLING, DEMO_TEACHER_CLASSES } from '../../../demo/dummyData';

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

function Badge({ type }) {
    const c = BADGE_COLOR[type] ?? BADGE_COLOR['Other'];
    return (
        <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px',
            borderRadius: 20, whiteSpace: 'nowrap', background: c.bg, color: c.color
        }}>
            {type}
        </span>
    );
}

// Top 3 class-wide priorities
function ClassAlertBar({ patterns }) {
    // Aggregate: top (topic, mistakeType) by student count
    const sorted = [...patterns].sort((a, b) => b.studentCount - a.studentCount).slice(0, 3);
    if (sorted.length === 0) return null;

    const urgency = ['#ef4444', '#f59e0b', '#6366f1'];

    return (
        <div className="tat-alert-bar">
            <div className="tat-alert-label">Class Priorities</div>
            <div className="tat-alert-cards">
                {sorted.map((row, i) => (
                    <div key={i} className="tat-alert-card" style={{ borderLeft: `4px solid ${urgency[i]}` }}>
                        <div className="tat-alert-rank" style={{ color: urgency[i] }}>#{i + 1}</div>
                        <div className="tat-alert-type">
                            <Badge type={row.mistakeType} />
                        </div>
                        <div className="tat-alert-topic">{row.topic}</div>
                        <div className="tat-alert-count" style={{ color: urgency[i] }}>
                            {row.studentCount} student{row.studentCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StudentRow({ student, rank, onAssign }) {
    const [expanded, setExpanded] = useState(false);
    const urgencyColor = rank === 0 ? '#ef4444' : rank === 1 ? '#f59e0b' : '#64748b';

    return (
        <div className={`tat-student-card ${expanded ? 'expanded' : ''}`}>
            <div className="tat-student-row" onClick={() => setExpanded(o => !o)}>
                <div className="tat-student-rank" style={{ color: urgencyColor }}>#{rank + 1}</div>
                <div className="tat-student-info">
                    <div className="tat-student-name">{student.name}</div>
                    <div className="tat-student-tags">
                        {student.topTopic && (
                            <span className="tat-topic-pill">{student.topTopic}</span>
                        )}
                        {student.topMistakeType && (
                            <Badge type={student.topMistakeType} />
                        )}
                    </div>
                </div>
                <div className="tat-student-count">
                    <span className="tat-count-num" style={{ color: urgencyColor }}>
                        {student.mistakeCount}
                    </span>
                    <span className="tat-count-label">mistakes</span>
                </div>
                <button
                    className="tat-assign-btn"
                    onClick={e => { e.stopPropagation(); onAssign(student); }}
                >
                    Assign Quiz →
                </button>
                <span className="tat-expand-chevron">{expanded ? '▲' : '▼'}</span>
            </div>

            {expanded && (
                <div className="tat-pattern-drawer">
                    <div className="tat-pattern-drawer-title">Pattern Profile</div>
                    <StudentMistakePatterns studentId={student.studentId} compact />
                </div>
            )}
        </div>
    );
}

function TopicCard({ topic, rows }) {
    const total = rows.reduce((s, r) => s + r.count, 0);
    const maxStudents = Math.max(...rows.map(r => r.studentCount));
    // Sort rows by count descending
    const sorted = [...rows].sort((a, b) => b.count - a.count);

    return (
        <div className="tat-topic-card">
            <div className="tat-topic-header">
                <div className="tat-topic-name">{topic}</div>
                <div className="tat-topic-meta">
                    <span className="tat-topic-count">{total} mistakes</span>
                    <span className="tat-topic-students">{maxStudents} student{maxStudents !== 1 ? 's' : ''}</span>
                </div>
            </div>
            <div className="tat-topic-rows">
                {sorted.map((r, i) => (
                    <div key={i} className="tat-topic-row">
                        <Badge type={r.mistakeType} />
                        <div className="tat-bar-bg">
                            <div
                                className="tat-bar-fill"
                                style={{ width: `${Math.round((r.count / total) * 100)}%` }}
                            />
                        </div>
                        <span className="tat-bar-num">{r.count}</span>
                        <span className="tat-student-num">{r.studentCount} stu.</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AssignModal({ student, classes, onClose, onConfirm }) {
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('23:59');
    const [classId, setClassId] = useState(classes[0]?.id ?? '');
    const [busy, setBusy] = useState(false);

    const handleConfirm = async () => {
        if (!dueDate) { toast.warn('Please select a due date'); return; }
        if (!classId) { toast.warn('Please select a class'); return; }
        setBusy(true);
        await onConfirm(student, classId, dueDate, dueTime);
        setBusy(false);
    };

    return (
        <div className="tat-overlay" onClick={onClose}>
            <div className="tat-modal" onClick={e => e.stopPropagation()}>
                <div className="tat-modal-header">
                    <div className="tat-modal-title">Assign Targeted Quiz</div>
                    <button className="tat-modal-close" onClick={onClose}>✕</button>
                </div>
                <p className="tat-modal-student">
                    {student.name} · <Badge type={student.topMistakeType} />
                    {student.topTopic && (
                        <span className="tat-topic-pill" style={{ marginLeft: 6 }}>{student.topTopic}</span>
                    )}
                </p>
                <p className="tat-modal-desc">
                    A quiz will be generated from {student.name}'s specific weak areas and assigned to them.
                </p>

                <div className="tat-modal-field">
                    <label>Class</label>
                    <select value={classId} onChange={e => setClassId(e.target.value)}>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="tat-modal-row">
                    <div className="tat-modal-field">
                        <label>Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setDueDate(e.target.value)}
                        />
                    </div>
                    <div className="tat-modal-field">
                        <label>Due Time</label>
                        <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
                    </div>
                </div>
                <div className="tat-modal-actions">
                    <button className="tat-modal-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                    <button className="tat-modal-confirm" onClick={handleConfirm} disabled={busy}>
                        {busy ? 'Assigning...' : 'Assign Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TAPageTeacher() {
    const teacherId = getUserIdFromToken();
    const [patterns, setPatterns] = useState([]);
    const [struggling, setStruggling] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);

    useEffect(() => {
        if (DEMO_MODE) {
            setPatterns(DEMO_TA_PATTERNS);
            setStruggling(DEMO_TA_STRUGGLING);
            setClasses(DEMO_TEACHER_CLASSES);
            setLoading(false);
            return;
        }
        if (!teacherId) return;
        Promise.all([
            getTeacherPatterns(teacherId),
            getStrugglingStudents(teacherId, 10),
            getTeacherClasses()
        ]).then(([p, s, c]) => {
            setPatterns(p);
            setStruggling(s);
            setClasses(c);
            setLoading(false);
        });
    }, [teacherId]);

    const handleAssign = async (student, classId, dueDate, dueTime) => {
        try {
            const result = await assignCuratedQuizToStudent(
                student.studentId, student.name, classId, teacherId, dueDate, dueTime
            );
            toast.success(
                `Assigned ${result.questionCount}-question quiz to ${student.name} — focused on ${result.focusTopics.join(', ')}`
            );
            setModal(null);
        } catch (err) {
            toast.error(err.message || 'Failed to assign quiz');
        }
    };

    // Group and sort topic patterns
    const byTopic = {};
    patterns.forEach(row => {
        if (!byTopic[row.topic]) byTopic[row.topic] = [];
        byTopic[row.topic].push(row);
    });
    const topicEntries = Object.entries(byTopic).sort(
        (a, b) => b[1].reduce((s, r) => s + r.studentCount, 0) - a[1].reduce((s, r) => s + r.studentCount, 0)
    );

    const hasData = !loading && (patterns.length > 0 || struggling.length > 0);

    return (
        <div className="tat-root">
            {/* ── Header ── */}
            <div className="tat-header">
                <div>
                    <h1 className="tat-title">Class Learning Assistant</h1>
                    {hasData && (
                        <p className="tat-subtitle">
                            {struggling.length} student{struggling.length !== 1 ? 's' : ''} tracked ·{' '}
                            {topicEntries.length} topic{topicEntries.length !== 1 ? 's' : ''} flagged
                        </p>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="tat-loading">Analyzing class data...</div>
            ) : !hasData ? (
                <div className="tat-empty-state">
                    <div className="tat-empty-icon">📊</div>
                    <div className="tat-empty-title">No data yet</div>
                    <div className="tat-empty-body">
                        Insights will appear here as students complete practice sessions and assignments.
                    </div>
                </div>
            ) : (
                <>
                    {/* ── Class Priorities ── */}
                    {patterns.length > 0 && <ClassAlertBar patterns={patterns} />}

                    {/* ── Students Who Need Help ── */}
                    {struggling.length > 0 && (
                        <div className="tat-section">
                            <div className="tat-section-title">
                                Students Who Need Attention
                                <span className="tat-section-count">{struggling.length}</span>
                            </div>
                            <p className="tat-section-sub">
                                Ranked by number of logged mistakes. Assign a targeted quiz directly from here.
                            </p>
                            <div className="tat-student-list">
                                {struggling.map((s, i) => (
                                    <StudentRow
                                        key={s.studentId}
                                        student={s}
                                        rank={i}
                                        onAssign={setModal}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Topic Breakdown ── */}
                    {topicEntries.length > 0 && (
                        <div className="tat-section">
                            <div className="tat-section-title">Mistake Patterns by Topic</div>
                            <p className="tat-section-sub">
                                Which topics are causing the most mistakes, and what kinds of errors.
                            </p>
                            <div className="tat-topic-grid">
                                {topicEntries.map(([topic, rows]) => (
                                    <TopicCard key={topic} topic={topic} rows={rows} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Assign Modal ── */}
            {modal && classes.length > 0 && (
                <AssignModal
                    student={modal}
                    classes={classes}
                    onClose={() => setModal(null)}
                    onConfirm={handleAssign}
                />
            )}
        </div>
    );
}
