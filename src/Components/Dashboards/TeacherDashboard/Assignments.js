import React, { useState, useEffect } from 'react';
import { BiPlus, BiBarChart, BiEdit, BiTrendingUp, BiCalendar, BiFile, BiGroup } from 'react-icons/bi';
import AssignmentCreation from './AssignmentCreation';
import '../../../Styling/Dashboards/Assignments.css';

const Assignments = ({ 
    teacherInfo, 
    actualStudentsData = [], 
    loadingStudentsData = false, 
    onNavigate, 
    onBack 
}) => {
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'create', 'results', 'manage', 'analytics'
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [assignmentStats, setAssignmentStats] = useState({
        totalAssignments: 0,
        activeAssignments: 0,
        totalSubmissions: 0,
        avgScore: 0,
        pendingGrading: 0
    });
    const [recentAssignments, setRecentAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignmentData();
    }, [teacherInfo, actualStudentsData]);

    const fetchAssignmentData = async () => {
        try {
            setLoading(true);
            
            // Use real context data when available
            const totalStudents = actualStudentsData.length;
            const uniqueClasses = Array.from(new Set(actualStudentsData.map(s => s.className)));
            
            console.log('📊 Assignment Dashboard Context:');
            console.log(`   Teacher: ${teacherInfo?.firstName} ${teacherInfo?.lastName}`);
            console.log(`   Total Students: ${totalStudents}`);
            console.log(`   Classes: ${uniqueClasses.join(', ')}`);
            
            // Calculate realistic stats
            setAssignmentStats({
                totalAssignments: uniqueClasses.length * 4, // 4 assignments per class
                activeAssignments: uniqueClasses.length * 2, // 2 active per class
                totalSubmissions: Math.floor(totalStudents * 3.5), // Realistic submission count
                avgScore: actualStudentsData.length > 0 ? 
                    Math.round(actualStudentsData.reduce((sum, s) => sum + s.readiness, 0) / actualStudentsData.length) : 82,
                pendingGrading: Math.floor(totalStudents * 0.4)
            });

            // Create realistic assignments based on actual classes
            const mockAssignments = uniqueClasses.flatMap((className, classIndex) => {
                const studentsInClass = actualStudentsData.filter(s => s.className === className);
                return Array.from({ length: 3 }, (_, index) => ({
                    id: classIndex * 10 + index + 1,
                    title: `${className} - ${['Quiz', 'Test', 'Practice'][index]} ${index + 1}`,
                    className: className,
                    type: ['quiz', 'test', 'practice'][index],
                    dueDate: new Date(Date.now() + (classIndex + index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    createdDate: new Date(Date.now() - (classIndex + index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    submissions: Math.floor(studentsInClass.length * (0.6 + Math.random() * 0.4)),
                    totalStudents: studentsInClass.length,
                    avgScore: studentsInClass.length > 0 ? 
                        Math.round(studentsInClass.reduce((sum, s) => sum + s.readiness, 0) / studentsInClass.length) + (Math.random() * 20 - 10) : 0,
                    status: ['active', 'grading', 'completed'][index % 3],
                    questions: 10 + index * 5,
                    timeLimit: (15 + index * 15) // minutes
                }));
            });

            setRecentAssignments(mockAssignments.slice(0, 6));
            
        } catch (error) {
            console.error('Error fetching assignment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (cardId) => {
        console.log('Assignment card clicked:', cardId);
        setCurrentView(cardId);
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
        setSelectedAssignment(null);
    };

    const assignmentCards = [
        {
            id: 'create',
            title: 'Create Assignment',
            description: 'Build new quizzes, tests, and homework assignments with our easy-to-use builder',
            icon: <BiPlus />,
            color: '#4ea8ff',
            action: 'Start Creating',
            stats: null
        },
        {
            id: 'results',
            title: 'Assignment Results',
            description: 'View submissions, grades, and detailed student performance analytics',
            icon: <BiBarChart />,
            color: '#10b981',
            action: 'View Results',
            stats: `${assignmentStats.totalSubmissions} submissions`
        },
        {
            id: 'manage',
            title: 'Manage Assignments',
            description: 'Edit, duplicate, archive, and organize your existing assignments',
            icon: <BiEdit />,
            color: '#f59e0b',
            action: 'Manage',
            stats: `${assignmentStats.totalAssignments} total assignments`
        },
        {
            id: 'analytics',
            title: 'Assignment Analytics',
            description: 'Deep insights into assignment performance and class learning trends',
            icon: <BiTrendingUp />,
            color: '#8b5cf6',
            action: 'View Analytics',
            stats: `${assignmentStats.avgScore}% average score`
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#4ea8ff';
            case 'grading': return '#f59e0b';
            case 'completed': return '#10b981';
            case 'draft': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'grading': return 'Pending Grading';
            case 'completed': return 'Completed';
            case 'draft': return 'Draft';
            default: return 'Unknown';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'quiz': return '❓';
            case 'test': return '📝';
            case 'practice': return '💪';
            default: return '📄';
        }
    };

    // Handle different views
    if (currentView === 'create') {
        return (
            <div className="assignments-dashboard">
                <AssignmentCreation onBack={handleBackToDashboard} />
            </div>
        );
    }

    if (currentView !== 'dashboard') {
        return (
            <div className="assignments-dashboard">
                <div style={{ padding: '40px', textAlign: 'center', color: '#f0f6fc' }}>
                    <button 
                        onClick={handleBackToDashboard}
                        style={{
                            background: '#4ea8ff',
                            border: 'none',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginBottom: '20px'
                        }}
                    >
                        ← Back to Assignments
                    </button>
                    <h2>{currentView.charAt(0).toUpperCase() + currentView.slice(1)} - Coming Soon!</h2>
                    <p>This feature will be available soon.</p>
                </div>
            </div>
        );
    }

    // Main Dashboard View
    if (loading || loadingStudentsData) {
        return (
            <div className="assignments-dashboard loading">
                <div className="loading-indicator">
                    Loading assignment data for {teacherInfo?.firstName} {teacherInfo?.lastName}...
                </div>
            </div>
        );
    }

    return (
        <div className="assignments-dashboard">
            {/* Header Stats */}
            <section className="assignment-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <BiFile />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{assignmentStats.totalAssignments}</div>
                        <div className="stat-label">Total Assignments</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon active">
                        <BiCalendar />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{assignmentStats.activeAssignments}</div>
                        <div className="stat-label">Active Assignments</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon submissions">
                        <BiGroup />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{assignmentStats.totalSubmissions}</div>
                        <div className="stat-label">Total Submissions</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon score">
                        <BiTrendingUp />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{assignmentStats.avgScore}%</div>
                        <div className="stat-label">Average Score</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon pending">
                        <BiBarChart />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{assignmentStats.pendingGrading}</div>
                        <div className="stat-label">Pending Grading</div>
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <section className="assignment-grid">
                <div className="grid-main">
                    <h2 className="grid-title">Assignment Management</h2>
                    <div className="assignment-cards">
                        {assignmentCards.map(card => (
                            <div 
                                key={card.id}
                                className="assignment-card"
                                onClick={() => handleCardClick(card.id)}
                            >
                                <div className="card-header">
                                    <div 
                                        className="card-icon"
                                        style={{ backgroundColor: card.color }}
                                    >
                                        {card.icon}
                                    </div>
                                    <div className="card-title">{card.title}</div>
                                </div>
                                
                                <div className="card-description">
                                    {card.description}
                                </div>
                                
                                {card.stats && (
                                    <div className="card-stats">
                                        {card.stats}
                                    </div>
                                )}
                                
                                <div className="card-footer">
                                    <button 
                                        className="card-action-btn"
                                        style={{ backgroundColor: card.color }}
                                    >
                                        {card.action} →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Assignments Sidebar */}
                <div className="grid-sidebar">
                    <h3 className="sidebar-title">Recent Assignments</h3>
                    <div className="recent-assignments">
                        {recentAssignments.slice(0, 5).map(assignment => (
                            <div key={assignment.id} className="recent-assignment">
                                <div className="assignment-header">
                                    <div className="assignment-title-row">
                                        <span className="assignment-type-icon">
                                            {getTypeIcon(assignment.type)}
                                        </span>
                                        <h4 className="assignment-title">{assignment.title}</h4>
                                    </div>
                                    <span 
                                        className="assignment-status"
                                        style={{ backgroundColor: getStatusColor(assignment.status) }}
                                    >
                                        {getStatusText(assignment.status)}
                                    </span>
                                </div>
                                
                                <div className="assignment-meta">
                                    <span className="assignment-class">{assignment.className}</span>
                                    <span className="assignment-due">Due: {assignment.dueDate}</span>
                                </div>
                                
                                <div className="assignment-details">
                                    <span>{assignment.questions} questions</span>
                                    <span>{assignment.timeLimit} min</span>
                                </div>
                                
                                <div className="assignment-progress">
                                    <div className="progress-info">
                                        <span>{assignment.submissions}/{assignment.totalStudents} submitted</span>
                                        <span>{Math.round(assignment.avgScore)}% avg</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ 
                                                width: `${(assignment.submissions / assignment.totalStudents) * 100}%`,
                                                backgroundColor: getStatusColor(assignment.status)
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        className="view-all-assignments"
                        onClick={() => handleCardClick('manage')}
                    >
                        View All Assignments →
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Assignments;
