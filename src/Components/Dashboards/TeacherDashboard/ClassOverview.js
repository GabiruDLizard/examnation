import React, { useState, useEffect } from 'react';
import { BiUser, BiBarChart, BiBookOpen, BiCalendar, BiTrendingUp, BiAssignments, BiStats, BiGroup, BiChevronRight } from 'react-icons/bi';
import { getTeacherClasses, getAllEnrolledStudentInfo, getAssignmentsForClass, getSubmissionStatsForTeacher, getSubmissionsByAssignmentId } from "./TeacherDashboardService";
import "../ClassOverview.css";

export default function ClassOverview({ teacherInfo, selectedClass, onBack, onNavigate }) {
    const [classStats, setClassStats] = useState({
        totalStudents: 0,
        activeAssignments: 0,
        averageReadiness: 0,
        recentActivity: 0,
        totalSubmissions: 0,
        submissionRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);

    useEffect(() => {
        const fetchAssignmentsForClass = async () => {
            if(selectedClass.id){
                try {
                    const classAssignments = await getAssignmentsForClass(selectedClass.id);
                    setAssignments(classAssignments);
                } catch (error) {
                    setAssignments([]);
                }
            }
        };
        
        fetchAssignmentsForClass();
    }, [selectedClass]);

    useEffect(() => {
        if (selectedClass) {
            fetchClassStats();
        }
    }, [selectedClass, assignments]);

    const fetchClassStats = async () => {
        try {
            setLoading(true);
            
            // Get students for this class
            const classStudents = await getAllEnrolledStudentInfo(selectedClass.id);
            
            // Calculate basic stats
            const totalStudents = classStudents.length;
            const studentsWithReadiness = classStudents.filter(([, progress]) => Number(progress?.readinessLevel) > 0);
            const averageReadiness = studentsWithReadiness.length > 0
                ? Math.round(studentsWithReadiness.reduce((sum, [, progress]) =>
                    sum + Number(progress.readinessLevel), 0) / studentsWithReadiness.length)
                : 0;

            // Calculate submission statistics
            let totalSubmissions = 0;
            let submissionRate = 0;
            
            if (assignments.length > 0) {
                for (const assignment of assignments) {
                    try {
                        const submissions = await getSubmissionsByAssignmentId(assignment.id);
                        totalSubmissions += submissions.length;
                    } catch (error) {
                    }
                }
                
                const possibleSubmissions = assignments.length * totalStudents;
                submissionRate = possibleSubmissions > 0 ? Math.round((totalSubmissions / possibleSubmissions) * 100) : 0;
            }

            setClassStats({
                totalStudents,
                activeAssignments: assignments.length, 
                averageReadiness,
                recentActivity: totalSubmissions,
                totalSubmissions,
                submissionRate
            });
            
        } catch (error) {
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
                { label: 'Performance Trend', value: '--%' },
                { label: 'Completion Rate', value: '--%' },
                { label: 'Engagement Score', value: '--%' }
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
                { label: 'Total Submissions', value: classStats.totalSubmissions },
                { label: 'Submission Rate', value: `${classStats.submissionRate}%` }
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

            {/* Recent Activity Section - Deactivated */}
            <div className="recent-activity" style={{ 
                opacity: 0.7, 
                pointerEvents: 'none',
                position: 'relative'
            }}>
                <h3 style={{ color: '#888' }}>Recent Activity (Coming Soon)</h3>
                <div className="activity-list">
                    <div className="activity-item" style={{ cursor: 'not-allowed' }}>
                        <div className="activity-icon" style={{ color: '#aaa' }}>
                            <BiUser />
                        </div>
                        <div className="activity-content">
                            <p style={{ color: '#777' }}><strong>-- new students</strong> enrolled in the class</p>
                            <span className="activity-time" style={{ color: '#999' }}>-- hours ago</span>
                        </div>
                    </div>
                    <div className="activity-item" style={{ cursor: 'not-allowed' }}>
                        <div className="activity-icon" style={{ color: '#aaa' }}>
                            <BiBookOpen />
                        </div>
                        <div className="activity-content">
                            <p style={{ color: '#777' }}><strong>Assignment "--"</strong> was submitted by -- students</p>
                            <span className="activity-time" style={{ color: '#999' }}>-- day ago</span>
                        </div>
                    </div>
                    <div className="activity-item" style={{ cursor: 'not-allowed' }}>
                        <div className="activity-icon" style={{ color: '#aaa' }}>
                            <BiTrendingUp />
                        </div>
                        <div className="activity-content">
                            <p style={{ color: '#777' }}><strong>Class average readiness</strong> improved by --%</p>
                            <span className="activity-time" style={{ color: '#999' }}>-- days ago</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
