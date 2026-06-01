import React, { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../../../utils/api';
import StudentMistakePatterns from '../TAPage/StudentMistakePatterns';

export default function StudentProfile({ studentId, studentName, onBack }) {
    const [topicAbility, setTopicAbility] = useState([]);
    const [readinessHistory, setReadinessHistory] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topicLoading, setTopicLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedClassId, setSelectedClassId] = useState(null); // null = all classes
    const [classAssignmentIds, setClassAssignmentIds] = useState(null); // set when class selected

    // Initial load — fetch all data across all classes
    useEffect(() => {
        if (!studentId) return;
        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const [topicRes, historyRes, submissionsRes] = await Promise.all([
                    authFetch(`/studenttopicability/student/${studentId}`),
                    authFetch(`/Readiness/student/${studentId}/history?weeksBack=52`),
                    authFetch(`/assignmentsubmission/student/${studentId}`)
                ]);
                if (topicRes.ok) {
                    const data = await topicRes.json();
                    setTopicAbility(Array.isArray(data) ? data : []);
                }
                if (historyRes.ok) {
                    const data = await historyRes.json();
                    setReadinessHistory(Array.isArray(data) ? data : []);
                }
                if (submissionsRes.ok) {
                    const data = await submissionsRes.json();
                    setSubmissions(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [studentId]);

    // Re-fetch topic ability and assignment IDs when class filter changes
    useEffect(() => {
        if (loading) return; // wait for initial load
        if (selectedClassId === null) {
            // Reset to all-class topic ability
            setTopicLoading(true);
            authFetch(`/studenttopicability/student/${studentId}`)
                .then(r => r.ok ? r.json() : [])
                .then(data => setTopicAbility(Array.isArray(data) ? data : []))
                .finally(() => setTopicLoading(false));
            setClassAssignmentIds(null);
        } else {
            // Fetch class-scoped topic ability for this student + class assignments
            setTopicLoading(true);
            Promise.all([
                authFetch(`/studenttopicability/class/${selectedClassId}`),
                authFetch(`/assignment/class/${selectedClassId}`)
            ]).then(async ([topicRes, assignRes]) => {
                if (topicRes.ok) {
                    const data = await topicRes.json();
                    setTopicAbility(
                        Array.isArray(data)
                            ? data.filter(t => (t.studentId ?? t.StudentId) === studentId)
                            : []
                    );
                }
                if (assignRes.ok) {
                    const assignments = await assignRes.json();
                    const ids = new Set(
                        (Array.isArray(assignments) ? assignments : [])
                            .map(a => a.id ?? a.assignmentId ?? a.Id)
                    );
                    setClassAssignmentIds(ids);
                } else {
                    setClassAssignmentIds(null);
                }
            }).finally(() => setTopicLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClassId]);

    // Derive available classes from readiness history
    const availableClasses = useMemo(() => {
        const seen = {};
        readinessHistory.forEach(r => {
            const cid = r.classId ?? r.ClassId;
            const cname = r.className ?? r.ClassName;
            if (cid && cname && !seen[cid]) seen[cid] = cname;
        });
        return Object.entries(seen).map(([id, name]) => ({ id: Number(id), name }));
    }, [readinessHistory]);

    // Derived filtered data
    const filteredReadiness = useMemo(() => {
        if (!selectedClassId) return readinessHistory;
        return readinessHistory.filter(r => (r.classId ?? r.ClassId) === selectedClassId);
    }, [readinessHistory, selectedClassId]);

    const filteredSubmissions = useMemo(() => {
        if (!selectedClassId || !classAssignmentIds) return submissions;
        return submissions.filter(s => classAssignmentIds.has(s.assignmentId ?? s.AssignmentId));
    }, [submissions, selectedClassId, classAssignmentIds]);

    // Compute current readiness for the selected scope
    const currentReadiness = useMemo(() => {
        if (filteredReadiness.length === 0) return null;
        const latest = [...filteredReadiness].sort(
            (a, b) => new Date(b.weekDate ?? b.WeekDate) - new Date(a.weekDate ?? a.WeekDate)
        )[0];
        return Math.round(latest.readinessPercentage ?? latest.ReadinessPercentage ?? 0);
    }, [filteredReadiness]);

    // If theta > 4, it was stored as a mastery % (legacy) — use directly; otherwise convert IRT theta
    const thetaToPercent = (theta) => {
        if (theta > 4) return Math.round(Math.min(100, theta));
        return Math.round(Math.max(0, Math.min(100, ((theta + 4) / 8) * 100)));
    };

    const sortedTopics = [...topicAbility]
        .map(t => ({ ...t, percent: thetaToPercent(t.theta ?? t.Theta ?? 0) }))
        .sort((a, b) => a.percent - b.percent);

    const weakTopics = sortedTopics.slice(0, 3);

    const topicBarColor = (percent) => {
        if (percent >= 70) return '#10b981';
        if (percent >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const selectedClassName = availableClasses.find(c => c.id === selectedClassId)?.name;

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', color: '#1e293b' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <button
                    onClick={onBack}
                    style={{
                        padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0',
                        borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#475569',
                        display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0
                    }}
                >
                    ← Back
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{studentName}</h1>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Student Analytics Profile</p>
                </div>
                {/* Class filter dropdown */}
                {availableClasses.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <label style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>Filter by class:</label>
                        <select
                            value={selectedClassId ?? ''}
                            onChange={e => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
                            style={{
                                padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px',
                                fontSize: '13px', color: '#1e293b', background: '#fff', cursor: 'pointer',
                                minWidth: '180px'
                            }}
                        >
                            <option value="">All Classes</option>
                            {availableClasses.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Active filter banner */}
            {selectedClassId && selectedClassName && (
                <div style={{
                    background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px',
                    padding: '10px 16px', marginBottom: '20px', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between', fontSize: '13px'
                }}>
                    <span style={{ color: '#1d4ed8' }}>
                        Showing data for <strong>{selectedClassName}</strong>
                    </span>
                    <button
                        onClick={() => setSelectedClassId(null)}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px' }}
                    >
                        Clear filter ×
                    </button>
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    Loading profile data...
                </div>
            )}

            {error && !loading && (
                <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444', marginBottom: '20px' }}>
                    Failed to load profile: {error}
                </div>
            )}

            {!loading && (
                <>
                    {/* KPI row */}
                    {currentReadiness !== null && (
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <div style={{
                                flex: 1, minWidth: '120px', background: '#fff', border: '1px solid #e2e8f0',
                                borderRadius: '10px', padding: '16px 20px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Current Readiness</div>
                                <div style={{
                                    fontSize: '28px', fontWeight: 700,
                                    color: currentReadiness >= 70 ? '#10b981' : currentReadiness >= 40 ? '#f59e0b' : '#ef4444'
                                }}>
                                    {currentReadiness}%
                                </div>
                            </div>
                            <div style={{
                                flex: 1, minWidth: '120px', background: '#fff', border: '1px solid #e2e8f0',
                                borderRadius: '10px', padding: '16px 20px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Assignments Submitted</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                                    {filteredSubmissions.filter(s => ['submitted', 'graded', 'pending_review', 'needs_revision'].includes(s.status ?? s.Status)).length}
                                </div>
                            </div>
                            <div style={{
                                flex: 1, minWidth: '120px', background: '#fff', border: '1px solid #e2e8f0',
                                borderRadius: '10px', padding: '16px 20px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Topics Tracked</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                                    {topicAbility.length}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Weak Topics Callout */}
                    {weakTopics.length > 0 && (
                        <div style={{
                            background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px',
                            padding: '16px 20px', marginBottom: '24px'
                        }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#c2410c', marginBottom: '10px' }}>
                                Areas Needing Attention (3 Weakest Topics)
                            </div>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                {weakTopics.map((t, i) => (
                                    <div key={i} style={{
                                        background: '#fff', border: '1px solid #fdba74', borderRadius: '8px',
                                        padding: '10px 16px', minWidth: '140px'
                                    }}>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t.topic ?? t.Topic}</div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: topicBarColor(t.percent) }}>
                                            {t.percent}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Topic Mastery */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                        padding: '20px', marginBottom: '24px'
                    }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>
                            Topic Mastery
                            {selectedClassName && (
                                <span style={{ fontWeight: 400, fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>
                                    — {selectedClassName}
                                </span>
                            )}
                        </h2>
                        {topicLoading ? (
                            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading...</p>
                        ) : sortedTopics.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No topic data available yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {sortedTopics.map((t, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '160px', fontSize: '13px', color: '#475569', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.topic ?? t.Topic}>
                                            {t.topic ?? t.Topic}
                                        </div>
                                        <div style={{ flex: 1, height: '14px', background: '#f1f5f9', borderRadius: '7px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${t.percent}%`, height: '100%',
                                                background: topicBarColor(t.percent),
                                                borderRadius: '7px',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <div style={{ width: '40px', fontSize: '13px', fontWeight: 600, color: topicBarColor(t.percent), textAlign: 'right' }}>
                                            {t.percent}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {sortedTopics.length > 0 && !topicLoading && (
                            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '12px', color: '#64748b' }}>
                                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 2, marginRight: 4 }} />Below 40%</span>
                                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f59e0b', borderRadius: 2, marginRight: 4 }} />40–70%</span>
                                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#10b981', borderRadius: 2, marginRight: 4 }} />70%+</span>
                            </div>
                        )}
                    </div>

                    {/* Mistake Pattern Profile */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                        padding: '20px', marginBottom: '24px'
                    }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px' }}>Mistake Pattern Profile</h2>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
                            Recurring error types grouped by topic — Active means still happening in the last 3 weeks.
                        </p>
                        <StudentMistakePatterns studentId={studentId} />
                    </div>

                    {/* Recent Assignments */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                        padding: '20px'
                    }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>
                            Recent Assignments
                            {selectedClassName && (
                                <span style={{ fontWeight: 400, fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>
                                    — {selectedClassName}
                                </span>
                            )}
                        </h2>
                        {filteredSubmissions.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No submissions found{selectedClassName ? ` for ${selectedClassName}` : ''}.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Assignment</th>
                                        <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Status</th>
                                        <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Submitted</th>
                                        <th style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubmissions.slice(0, 10).map((sub, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px 12px', color: '#1e293b' }}>
                                                {sub.assignmentTitle ?? sub.AssignmentTitle ?? sub.assignmentId ?? sub.AssignmentId ?? '—'}
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                                    background: (sub.status ?? sub.Status) === 'graded' ? '#dcfce7' : (sub.status ?? sub.Status) === 'submitted' ? '#dbeafe' : '#f1f5f9',
                                                    color: (sub.status ?? sub.Status) === 'graded' ? '#16a34a' : (sub.status ?? sub.Status) === 'submitted' ? '#2563eb' : '#64748b'
                                                }}>
                                                    {sub.status ?? sub.Status ?? 'in progress'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', color: '#64748b' }}>
                                                {(sub.submittedAt ?? sub.SubmittedAt) ? new Date(sub.submittedAt ?? sub.SubmittedAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: (sub.grade ?? sub.Grade) != null ? '#1e293b' : '#94a3b8' }}>
                                                {(sub.grade ?? sub.Grade) != null ? `${Math.round((sub.grade ?? sub.Grade) * 10) / 10}%` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
