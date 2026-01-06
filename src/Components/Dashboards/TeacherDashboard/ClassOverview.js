import React, { useState, useEffect } from 'react';
import { BiUser, BiBarChart, BiBookOpen, BiCalendar, BiTrendingUp, BiAssignments, BiStats, BiGroup, BiChevronRight } from 'react-icons/bi';
import { getTeacherClasses, getAllEnrolledStudentInfo } from "./TeacherDashboardService";
import "../ClassOverview.css";

export default function ClassOverview({ teacherInfo, selectedClass, onBack, onNavigate }) {
    const [classStats, setClassStats] = useState({
        totalStudents: 0,
        activeAssignments: 0,
        averageReadiness: 0,
        recentActivity: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedClass) {
            fetchClassStats();
        }
    }, [selectedClass]);

    const fetchClassStats = async () => {
        try {
            setLoading(true);
            
            // Get students for this class
            const classStudents = await getAllEnrolledStudentInfo(selectedClass.id);
            
            // Calculate basic stats
            const totalStudents = classStudents.length;
            const averageReadiness = totalStudents > 0 
                ? Math.round(classStudents.reduce((sum, [, progress]) => 
                    sum + (Number(progress?.readinessLevel) || 70), 0) / totalStudents)
                : 0;

            setClassStats({
                totalStudents,
                activeAssignments: Math.floor(Math.random() * 5 + 3), // Mock for now
                averageReadiness,
                recentActivity: Math.floor(Math.random() * totalStudents * 0.8) // Mock recent activity
            });
            
        } catch (error) {
            console.error('Error fetching class stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const dashboardCards = [
        {
            id: 'students',
            title: 'View Students',
            description: 'Manage enrolled students, track progress, and add new enrollments',
            icon: <BiGroup size={32} />,
            color: '#3b82f6',
            stats: [
                { label: 'Total Students', value: classStats.totalStudents },
                { label: 'Avg. Readiness', value: `${classStats.averageReadiness}%` },
                { label: 'Active Today', value: classStats.recentActivity }
            ],
            action: 'View All Students'
        },
        {
            id: 'analytics',
            title: 'Class Analytics',
            description: 'View detailed insights, performance trends, and learning analytics',
            icon: <BiBarChart size={32} />,
            color: '#10b981',
            stats: [
                { label: 'Performance Trend', value: '+5.2%' },
                { label: 'Completion Rate', value: '87%' },
                { label: 'Engagement Score', value: '92%' }
            ],
            action: 'View Analytics'
        },
        {
            id: 'assignments',
            title: 'Assignments',
            description: 'Create, manage, and grade assignments for this class',
            icon: <BiBookOpen size={32} />,
            color: '#f59e0b',
            stats: [
                { label: 'Active Assignments', value: classStats.activeAssignments },
                { label: 'Pending Reviews', value: Math.floor(Math.random() * 15 + 5) },
                { label: 'Avg. Score', value: '84%' }
            ],
            action: 'Manage Assignments'
        }
    ];

    const handleCardClick = (cardId) => {
        switch(cardId) {
            case 'students':
                onNavigate('students');
                break;
            case 'analytics':
                onNavigate('analytics');
                break;
            case 'assignments':
                onNavigate('assignments');
                break;
            default:
                console.log(`Navigate to ${cardId}`);
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
                        {selectedClass.grade} • {selectedClass.subject} • {selectedClass.schedule}
                    </p>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="quick-stats">
                <div className="stat-card">
                    <BiUser className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{classStats.totalStudents}</span>
                        <span className="stat-label">Students</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BiBookOpen className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{classStats.activeAssignments}</span>
                        <span className="stat-label">Active Assignments</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BiTrendingUp className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{classStats.averageReadiness}%</span>
                        <span className="stat-label">Avg. Readiness</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BiCalendar className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{classStats.recentActivity}</span>
                        <span className="stat-label">Recent Activity</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="dashboard-cards">
                <h2>Class Management</h2>
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
                            </div>

                            <div className="card-stats">
                                {card.stats.map((stat, index) => (
                                    <div key={index} className="card-stat">
                                        <span className="stat-value">{stat.value}</span>
                                        <span className="stat-label">{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="card-footer">
                                <span className="card-action">{card.action}</span>
                                <BiChevronRight size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                    <div className="activity-item">
                        <div className="activity-icon">
                            <BiUser />
                        </div>
                        <div className="activity-content">
                            <p><strong>3 new students</strong> enrolled in the class</p>
                            <span className="activity-time">2 hours ago</span>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon">
                            <BiBookOpen />
                        </div>
                        <div className="activity-content">
                            <p><strong>Assignment "Chapter 5 Quiz"</strong> was submitted by 12 students</p>
                            <span className="activity-time">1 day ago</span>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon">
                            <BiTrendingUp />
                        </div>
                        <div className="activity-content">
                            <p><strong>Class average readiness</strong> improved by 5.2%</p>
                            <span className="activity-time">3 days ago</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
