import React, { useState, useEffect } from 'react';
import './Clustering.css';
import skmeans from 'skmeans';
import { getClassTopicAbility } from '../TeacherDashboard/TeacherDashboardService';


const Clustering = ({ classId, enrolledStudents }) => {
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getClassTopicAbility(classId);
            if(!data || data.length === 0) {
                setLoading(false);
                return;
            }
            const topics = [...new Set(data.map(item => item.topic))];
            const studentMap = {};
            data.forEach(item => {
                if (!studentMap[item.studentId]) {
                    const found = enrolledStudents?.find(
                        s => String(s.studentId ?? s.id) === String(item.studentId)
                    );
                    const name = found
                        ? (found.name || `${found.firstName ?? ''} ${found.lastName ?? ''}`.trim() || `Student ${item.studentId}`)
                        : `Student ${item.studentId}`;
                    studentMap[item.studentId] = { name, abilities: {} };
                }
                studentMap[item.studentId].abilities[item.topic] = item.theta;
            });
            const studentIds = Object.keys(studentMap);
            if (studentIds.length < 3) { setLoading(false); return; }

            const vectors = studentIds.map(id => topics.map(t => studentMap[id].abilities[t] ?? 0));
            const result = skmeans(vectors, 3);

            const rawClusters = [0, 1, 2].map(ci => ({
                members: studentIds.filter((_, i) => result.idxs[i] === ci),
                centroid: result.centroids[ci],
                meanTheta: result.centroids[ci].reduce((a, b) => a + b, 0) / topics.length
            }));

            rawClusters.sort((a, b) => a.meanTheta - b.meanTheta);
            const labels = ['Struggling', 'Average', 'Strong'];
            const colors = ['#ef4444', '#f59e0b', '#10b981'];

            setClusters(rawClusters.map((c, i) => {
                // Weakest topics = lowest centroid values
                const topicScores = topics.map((t, j) => ({ topic: t, theta: c.centroid[j] }));
                topicScores.sort((a, b) => a.theta - b.theta);
                const weakTopics = topicScores.slice(0, 3).map(t => t.topic);
                return {
                    label: labels[i],
                    color: colors[i],
                    students: c.members.map(id => studentMap[id].name),
                    weakTopics
                };
            }));
            setLoading(false);

        };
        fetchData();
    }, [classId]);
    if (loading) return <div className="cluster-loading">Analyzing student performance...</div>;
    if (clusters.length === 0) return <div className="cluster-empty">Not enough data yet to cluster students.</div>;

    return (
        <div className="cluster-container">
            {clusters.map(cluster => (
                <div key={cluster.label} className="cluster-orb" style={{ '--orb-color': cluster.color }}>
                    <div className="orb-inner">
                        <span className="orb-label">{cluster.label}</span>
                        <span className="orb-count">{cluster.students.length}</span>
                    </div>
                    <div className="orb-tooltip">
                        <div className="orb-tooltip-section">
                            <strong>Students</strong>
                            {cluster.students.map((name, i) => <div key={i}>{name}</div>)}
                        </div>
                        <div className="orb-tooltip-section" style={{ marginTop: 8, borderTop: '1px solid #334155', paddingTop: 8 }}>
                            <strong>Weak Areas</strong>
                            {cluster.weakTopics.map((t, i) => <div key={i} style={{ color: '#94a3b8' }}>{t}</div>)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Clustering;
