import React, { useEffect, useState } from 'react';
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import { getTeacherPatterns, getStrugglingStudents, assignCuratedQuizToStudent } from './TAService';
import { getTeacherClasses } from '../TeacherDashboard/TeacherDashboardService';
import { toast } from 'react-toastify';
import './TAPageTeacher.css';

const BADGE_CLASS = {
    'Sign Error':           'badge-sign',
    'Arithmetic Error':     'badge-arithmetic',
    'Wrong Formula':        'badge-formula',
    'Distribution Error':   'badge-distribution',
    'Wrong Operation':      'badge-operation',
    'Conceptual Error':     'badge-conceptual',
    'Incomplete Solution':  'badge-incomplete',
    'Other':                'badge-other',
};

function TopicCard({ topic, rows }) {
    const total = rows.reduce((s, r) => s + r.count, 0);
    const maxStudents = Math.max(...rows.map(r => r.studentCount));

    return (
        <div className="ta-topic-card">
            <div className="ta-topic-name">{topic}</div>
            <div className="ta-topic-total">{total} mistake{total !== 1 ? 's' : ''} · up to {maxStudents} student{maxStudents !== 1 ? 's' : ''} affected</div>
            <div className="ta-mistake-list">
                {rows.map((r, i) => (
                    <div className="ta-mistake-row" key={i}>
                        <span className={`mistake-badge ${BADGE_CLASS[r.mistakeType] ?? 'badge-other'}`}>
                            {r.mistakeType}
                        </span>
                        <div className="ta-bar-bg">
                            <div
                                className="ta-bar-fill"
                                style={{ width: `${Math.round((r.count / total) * 100)}%` }}
                            />
                        </div>
                        <span className="ta-bar-count">{r.count}</span>
                        <span className="ta-student-count">{r.studentCount} student{r.studentCount !== 1 ? 's' : ''}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function TAPageTeacher() {
    const teacherId = getUserIdFromToken();
    const [patterns, setPatterns] = useState([]);
    const [struggling, setStruggling] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);

    // Modal state
    const [modal, setModal] = useState(null); // { studentId, name }
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('23:59');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (!teacherId) return;
        Promise.all([
            getTeacherPatterns(teacherId),
            getStrugglingStudents(teacherId, 10),
            getTeacherClasses()
        ]).then(([p, s, c]) => {
            setPatterns(p);
            setStruggling(s);
            setClasses(c);
            if (c.length > 0) setSelectedClassId(c[0].id);
            setLoading(false);
        });
    }, [teacherId]);

    const openModal = (student) => {
        setModal(student);
        setDueDate('');
        setDueTime('23:59');
        if (classes.length > 0) setSelectedClassId(classes[0].id);
    };

    const handleAssign = async () => {
        if (!dueDate) { toast.warn('Please select a due date'); return; }
        if (!selectedClassId) { toast.warn('Please select a class'); return; }
        setAssigning(true);
        try {
            const result = await assignCuratedQuizToStudent(
                modal.studentId, modal.name, selectedClassId, teacherId, dueDate, dueTime
            );
            toast.success(`Assigned ${result.questionCount}-question quiz to ${modal.name} (${result.focusTopics.join(', ')})`);
            setModal(null);
        } catch (error) {
            toast.error(error.message || 'Failed to assign quiz');
        } finally {
            setAssigning(false);
        }
    };

    // Group patterns by topic
    const byTopic = {};
    patterns.forEach(row => {
        if (!byTopic[row.topic]) byTopic[row.topic] = [];
        byTopic[row.topic].push(row);
    });

    // Sort topics by total mistake count descending
    const topicEntries = Object.entries(byTopic).sort(
        (a, b) => b[1].reduce((s, r) => s + r.count, 0) - a[1].reduce((s, r) => s + r.count, 0)
    );

    const emptyState = !loading && patterns.length === 0;

    return (
        <div className="ta-teacher-page">
            <div className="ta-teacher-header">
                <h2 className="ta-teacher-title">My TA — Class Insights</h2>
                <p className="ta-teacher-subtitle">
                    Aggregated mistake patterns across all your students
                </p>
            </div>

            {/* ── Section 1: Class-wide patterns by topic ── */}
            <div className="ta-section">
                <div className="ta-section-title">Mistake Patterns by Topic</div>
                {loading ? (
                    <div className="ta-loading">Loading...</div>
                ) : emptyState ? (
                    <div className="ta-empty">
                        No mistake data yet. Patterns will appear here as students complete practice sessions and assignments.
                    </div>
                ) : (
                    <div className="ta-topic-grid">
                        {topicEntries.map(([topic, rows]) => (
                            <TopicCard key={topic} topic={topic} rows={rows} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Section 2: Students who need the most help ── */}
            <div className="ta-section">
                <div className="ta-section-title">Students Who Need Help</div>
                {loading ? (
                    <div className="ta-loading">Loading...</div>
                ) : struggling.length === 0 ? (
                    <div className="ta-empty">No student data available yet.</div>
                ) : (
                    <div className="ta-struggling-list">
                        {struggling.map((s, i) => (
                            <div className="ta-struggling-row" key={s.studentId}>
                                <span className="ta-struggling-rank">#{i + 1}</span>
                                <span className="ta-struggling-name">{s.name}</span>
                                <span className="ta-struggling-count">{s.mistakeCount} mistake{s.mistakeCount !== 1 ? 's' : ''}</span>
                                <div className="ta-struggling-tags">
                                    {s.topTopic && (
                                        <span className="mistake-topic-badge">{s.topTopic}</span>
                                    )}
                                    {s.topMistakeType && (
                                        <span className={`mistake-badge ${BADGE_CLASS[s.topMistakeType] ?? 'badge-other'}`}>
                                            {s.topMistakeType}
                                        </span>
                                    )}
                                </div>
                                <button className="ta-assign-btn" onClick={() => openModal(s)}>
                                    Assign Curated Quiz
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Assign Modal ── */}
            {modal && (
                <div className="ta-modal-overlay" onClick={() => setModal(null)}>
                    <div className="ta-modal" onClick={e => e.stopPropagation()}>
                        <h3>Assign Curated Quiz</h3>
                        <p>Assigning to <strong>{modal.name}</strong></p>
                        <div className="ta-modal-field">
                            <label>Class</label>
                            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="ta-modal-field">
                            <label>Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setDueDate(e.target.value)}
                            />
                        </div>
                        <div className="ta-modal-field">
                            <label>Due Time</label>
                            <input
                                type="time"
                                value={dueTime}
                                onChange={e => setDueTime(e.target.value)}
                            />
                        </div>
                        <div className="ta-modal-actions">
                            <button className="ta-modal-cancel" onClick={() => setModal(null)} disabled={assigning}>
                                Cancel
                            </button>
                            <button className="ta-modal-confirm" onClick={handleAssign} disabled={assigning}>
                                {assigning ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
