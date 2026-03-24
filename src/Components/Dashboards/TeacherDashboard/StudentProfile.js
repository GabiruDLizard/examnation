import React, { useState, useEffect } from 'react';
import { authFetch } from '../../../utils/api';
import StudentMistakePatterns from '../TAPage/StudentMistakePatterns';

export default function StudentProfile({ studentId, studentName, classId, onBack }) {
    const [topicAbility, setTopicAbility] = useState([]);
    const [readinessHistory, setReadinessHistory] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!studentId) return;

        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const [topicRes, historyRes, submissionsRes] = await Promise.all([
                    authFetch(`/studenttopicability/student/${studentId}`),
                    authFetch(`/Readiness/student/${studentId}/history?weeksBack=8`),
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
                console.error('Error fetching student profile:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [studentId]);

    const thetaToPercent = (theta) => Math.round(Math.max(0, Math.min(100, ((theta + 4) / 8) * 100)));

    const sortedTopics = [...topicAbility]
        .map(t => ({ ...t, percent: thetaToPercent(t.theta) }))
        .sort((a, b) => a.percent - b.percent);

    const weakTopics = sortedTopics.slice(0, 3);

    const topicBarColor = (percent) => {
        if (percent >= 70) return '#10b981';
        if (percent >= 40) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', color: '#1e293b' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <button
                    onClick={onBack}
                    style={{
                        padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0',
                        borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#475569',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    ← Back
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{studentName}</h1>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Student Analytics Profile</p>
                </div>
            </div>

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
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t.topic}</div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: topicBarColor(t.percent) }}>
                                            {t.percent}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Topic Mastery Section */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                        padding: '20px', marginBottom: '24px'
                    }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>Topic Mastery</h2>
                        {sortedTopics.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No topic data available yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {sortedTopics.map((t, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '160px', fontSize: '13px', color: '#475569', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.topic}>
                                            {t.topic}
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
                        {sortedTopics.length > 0 && (
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
                        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>Recent Assignments</h2>
                        {submissions.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No submissions found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Assignment ID</th>
                                        <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Status</th>
                                        <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Submitted</th>
                                        <th style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.slice(0, 10).map((sub, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px 12px', color: '#1e293b' }}>
                                                {sub.assignmentTitle || sub.assignmentId || '—'}
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                                    background: sub.status === 'graded' ? '#dcfce7' : sub.status === 'submitted' ? '#dbeafe' : '#f1f5f9',
                                                    color: sub.status === 'graded' ? '#16a34a' : sub.status === 'submitted' ? '#2563eb' : '#64748b'
                                                }}>
                                                    {sub.status || 'in progress'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', color: '#64748b' }}>
                                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: sub.grade != null ? '#1e293b' : '#94a3b8' }}>
                                                {sub.grade != null ? `${Math.round(sub.grade * 10) / 10}%` : '—'}
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
