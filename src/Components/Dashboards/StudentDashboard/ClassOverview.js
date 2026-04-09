import React, { useState, useEffect } from 'react';
import { BiUser, BiBarChart, BiBookOpen, BiCalendar, BiTrendingUp, BiAssignments, BiStats, BiGroup, BiChevronRight, BiPlay, BiCheckCircle, BiTime, BiAward } from 'react-icons/bi';
import { getAssignmentsForClass } from "./StudentDashboardService";
import { authFetch } from '../../../utils/api';
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import "../ClassOverview.css";

export default function StudentClassOverview({ studentInfo, selectedClass, onBack, onNavigate }) {
    const [classStats, setClassStats] = useState({
        totalAssignments: 0,
        submittedAssignments: 0,
        completedAssignments: 0,
        currentReadiness: 0,
        lastActivity: 'Never'
    });
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);

    useEffect(() => {
        const fetchClassData = async () => {
            if (selectedClass.classId) {
                try {
                    setLoading(true);
                    
                    // Fetch assignments for this class
                    const studentId = getUserIdFromToken();

                    const classAssignments = await getAssignmentsForClass(selectedClass.classId, studentId);
                    setAssignments(classAssignments);

                    const totalAssignments = classAssignments.length;

                    // Count actual submissions for this student
                    let submittedAssignments = 0;
                    if (studentId) {
                        const submissionCounts = await Promise.all(
                            classAssignments.map(async a => {
                                try {
                                    const res = await authFetch(`/assignmentsubmission/assignment/${a.id}/student/${studentId}`);
                                    return res.ok ? 1 : 0;
                                } catch { return 0; }
                            })
                        );
                        submittedAssignments = submissionCounts.reduce((s, v) => s + v, 0);
                    }

                    // Fetch readiness directly — don't trust the prop (may be stale/null)
                    let currentReadiness = null;
                    if (studentId && selectedClass.classId) {
                        try {
                            const rdRes = await authFetch(`/Readiness/student/${studentId}/class/${selectedClass.classId}`);
                            if (rdRes.ok) {
                                const rd = await rdRes.json();
                                currentReadiness = Math.round(rd?.readinessPercentage ?? 0);
                            }
                        } catch { /* skip */ }

                        // Fall back to topic ability average
                        if (currentReadiness === null) {
                            try {
                                const taRes = await authFetch(`/studenttopicability/${studentId}`);
                                if (taRes.ok) {
                                    const topics = await taRes.json();
                                    if (topics && topics.length > 0) {
                                        const avg = topics.reduce((sum, t) => {
                                            const theta = t.theta ?? t.Theta ?? 0;
                                            const pct = (theta >= -4 && theta <= 4)
                                                ? ((theta + 4) / 8) * 100
                                                : Math.max(0, Math.min(100, theta));
                                            return sum + pct;
                                        }, 0) / topics.length;
                                        currentReadiness = Math.round(avg);
                                    }
                                }
                            } catch { /* skip */ }
                        }
                    }

                    setClassStats({
                        totalAssignments,
                        submittedAssignments,
                        completedAssignments: submittedAssignments,
                        currentReadiness,
                        lastActivity: selectedClass.lastActivity ? new Date(selectedClass.lastActivity).toLocaleDateString() : 'Never'
                    });
                    
                } catch (error) {
                    setAssignments([]);
                } finally {
                    setLoading(false);
                }
            }
        };
        
        fetchClassData();
    }, [selectedClass]);

    const dashboardCards = [
        {
            id: 'practice',
            title: 'Practice Questions',
            description: 'Practice questions related to this class subject and improve your understanding',
            icon: <BiPlay size={22} />,
            color: '#3b82f6',
            stats: [
                { label: 'Subject Focus', value: selectedClass.subject },
                { label: 'Difficulty', value: 'Adaptive' },
                { label: 'Available', value: '24/7' }
            ],
            action: 'Start Practice'
        },
        {
            id: 'assignments',
            title: 'Class Assignments',
            description: 'View and complete assignments given by your teacher for this class',
            icon: <BiBookOpen size={22} />,
            color: '#f59e0b',
            stats: [
                { label: 'Total Assignments', value: classStats.totalAssignments },
                { label: 'Submitted', value: classStats.submittedAssignments },
                { label: 'Remaining', value: classStats.totalAssignments - classStats.submittedAssignments }
            ],
            action: 'View Assignments'
        },
        {
            id: 'progress',
            title: 'My Progress',
            description: 'Track your readiness level and performance in this class over time',
            icon: <BiBarChart size={22} />,
            color: '#10b981',
            stats: [
                { label: 'Current Readiness', value: classStats.currentReadiness !== null ? `${classStats.currentReadiness}%` : '—' },
                { label: 'Class Rank', value: 'N/A' },
                { label: 'Improvement', value: '+5%' }
            ],
            action: 'View Details'
        }
    ];

    const handleCardClick = (cardId) => {
        switch(cardId) {
            case 'practice':
                // Navigate to practice page with class context
                window.location.href = '/exampage';
                break;
            case 'assignments':
                onNavigate('assignments');
                break;
            case 'progress':
                onNavigate('progress');
                break;
            default:
        }
    };

    if (loading) {
        return (
            <div className="class-overview-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <h2>Loading Class Overview...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="class-overview-container">
            {/* Header */}
            <div className="overview-header">
                <button onClick={onBack} className="back-btn">
                    ← Back to My Classes
                </button>
                <div className="class-info">
                    <h1>{selectedClass.name}</h1>
                    <p className="class-details">
                        {selectedClass.grade} • {selectedClass.subject} • {selectedClass.teacher} • {selectedClass.schedule}
                    </p>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="quick-stats">
                <div className="stat-card">
                    <BiBookOpen className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{classStats.totalAssignments}</span>
                        <span className="stat-label">Total Assignments</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BiCheckCircle className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{classStats.submittedAssignments}</span>
                        <span className="stat-label">Submitted</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BiTrendingUp className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">
                            {classStats.currentReadiness !== null ? `${classStats.currentReadiness}%` : '—'}
                        </span>
                        <span className="stat-label">Readiness Level</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BiCalendar className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{classStats.lastActivity}</span>
                        <span className="stat-label">Last Activity</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="dashboard-cards">
                <h2>Class Activities</h2>
                <div className="cards-grid">
                    {dashboardCards.map((card) => (
                        <div 
                            key={card.id} 
                            className="dashboard-card"
                            onClick={() => handleCardClick(card.id)}
                        >
                            <div className="card-header">
                                <div 
                                    className="card-icon"
                                    style={{ backgroundColor: card.color }}
                                >
                                    {card.icon}
                                </div>
                                <div className="card-title-section">
                                    <h3>{card.title}</h3>
                                    <p>{card.description}</p>
                                </div>
                                <BiChevronRight className="card-arrow" />
                            </div>

                            <div className="card-stats">
                                {card.stats.map((stat, index) => (
                                    <div key={index} className="card-stat">
                                        <span className="card-stat-value">{stat.value}</span>
                                        <span className="card-stat-label">{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="card-footer">
                                <span className="card-action">{card.action}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Assignments Section */}
            {assignments.length > 0 && (
                <div className="recent-assignments">
                    <h2>Recent Assignments</h2>
                    <div className="assignments-list">
                        {assignments.slice(0, 3).map((assignment, index) => (
                            <div key={assignment.id} className="assignment-item">
                                <div className="assignment-icon">
                                    <BiBookOpen />
                                </div>
                                <div className="assignment-content">
                                    <h4>{assignment.title || `Assignment ${assignment.id}`}</h4>
                                    <p>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</p>
                                    <span className={`assignment-status ${assignment.status?.toLowerCase() || 'pending'}`}>
                                        {assignment.status || 'Pending'}
                                    </span>
                                </div>
                                <button
                                    className="assignment-btn"
                                    onClick={() => handleCardClick('assignments')}
                                >
                                    View
                                </button>
                            </div>
                        ))}
                    </div>
                    {assignments.length > 3 && (
                        <button className="view-all-assignments" onClick={() => handleCardClick('assignments')}>
                            View All {assignments.length} Assignments
                        </button>
                    )}
                </div>
            )}

            {/* Study Recommendations */}
            <div className="study-recommendations">
                <h2>Study Recommendations</h2>
                <div className="recommendations-grid">
                    <div className="recommendation-card">
                        <BiPlay className="recommendation-icon" />
                        <h4>Practice Weak Areas</h4>
                        <p>Focus on topics where your readiness is below 70%</p>
                        <button onClick={() => window.location.href = '/exampage'}>Start Practice</button>
                    </div>
                    <div className="recommendation-card">
                        <BiAward className="recommendation-icon" />
                        <h4>Take Practice Test</h4>
                        <p>Test your knowledge with adaptive questions</p>
                        <button onClick={() => window.location.href = '/testentrance'}>Take Test</button>
                    </div>
                    <div className="recommendation-card">
                        <BiStats className="recommendation-icon" />
                        <h4>Review Progress</h4>
                        <p>Check your improvement over time</p>
                        <button onClick={() => window.location.href = '/tapagestudent'}>View Analytics</button>
                    </div>
                </div>
            </div>
        </div>
    );
}