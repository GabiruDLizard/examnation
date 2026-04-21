import React, { useState, useEffect, useCallback } from 'react';
import { BiPlus, BiBarChart, BiEdit, BiTrendingUp, BiCalendar, BiFile, BiGroup } from 'react-icons/bi';
import AssignmentCreation from './AssignmentCreation';
import AssignmentQuestionCreationPage from './AssignmentQuestionPage';
import ManageAssignment from './ManageAssignment';
import AssignmentResults from './AssignmentResults';
import { getAssignmentsByTeacher, getSubmissionStatsForTeacher, getSubmissionsByAssignmentId } from './TeacherDashboardService';
import '../Assignments-new.css';

const Assignments = ({
    teacherInfo,
    actualStudentsData = [],
    loadingStudentsData = false,
    onNavigate,
    onBack,
    selectedClass = null,
    onSubmissionApproved,
    initialView,
    initialAssignmentId
}) => {
    const [currentView, setCurrentView] = useState(initialView); // 'dashboard', 'create', 'questions', 'results', 'manage', 'analytics'
    const [assignmentStats, setAssignmentStats] = useState({
        totalAssignments: 0, 
        activeAssignments: 0,
        totalSubmissions: 0,
        avgScore: 0,
        pendingGrading: 0
    });
    const [recentAssignments, setRecentAssignments] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submissionStats, setSubmissionStats] = useState({
        totalSubmissions: 0,
        totalPossibleSubmissions: 0,
        overallSubmissionRate: 0,
        submissionsByAssignment: {}
    });
    const [assignmentsWithStats, setAssignmentsWithStats] = useState([]);

    useEffect(() => {
        const fetchAssignments = async () => {
            if (teacherInfo?.id) {
                try {
                    setLoading(true);

                    // Fetch assignments first — populate counts immediately
                    const teacherAssignments = await getAssignmentsByTeacher(teacherInfo.id);
                    setAssignments(teacherAssignments);
                    setAssignmentStats(prev => ({
                        ...prev,
                        totalAssignments: teacherAssignments.length,
                        activeAssignments: teacherAssignments.filter(a => a.status === 'active').length,
                    }));
                    setLoading(false);

                    // Fetch submission stats in background — updates KPIs when ready
                    const stats = await getSubmissionStatsForTeacher(teacherInfo.id);
                    setSubmissionStats(stats);

                    const assignmentsWithSubmissionData = teacherAssignments.map(assignment => {
                        const submissionData = stats.submissionsByAssignment[assignment.id] || {
                            submitted: 0,
                            total: 0,
                            pending: 0,
                            submissionRate: 0
                        };
                        return {
                            ...assignment,
                            submissions: submissionData.submitted,
                            totalStudents: submissionData.total,
                            pendingSubmissions: submissionData.pending,
                            submissionRate: submissionData.submissionRate,
                            avgScore: 0,
                        };
                    });
                    setAssignmentsWithStats(assignmentsWithSubmissionData);
                    setRecentAssignments(assignmentsWithSubmissionData.slice(0, 6));
                    setAssignmentStats({
                        totalAssignments: teacherAssignments.length,
                        activeAssignments: teacherAssignments.filter(a => a.status === 'active').length,
                        totalSubmissions: stats.totalSubmissions,
                        avgScore: 0,
                        pendingGrading: stats.totalSubmissions - Math.floor(stats.totalSubmissions * 0.7)
                    });

                } catch (error) {
                    setAssignments([]);
                    setAssignmentsWithStats([]);
                    setLoading(false);
                }
            }
        };

        fetchAssignments();
    }, [teacherInfo?.id]);

    const handleCardClick = (cardId) => {
        setCurrentView(cardId);
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
    };

    const handleGoToQuestions = () => {
        setCurrentView('questions');
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
            case 'overdue': return '#ef4444';
            case 'draft': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'grading': return 'Submissions In';
            case 'completed': return 'Completed';
            case 'overdue': return 'Overdue';
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
                <AssignmentCreation 
                    onBack={handleBackToDashboard} 
                    onGoToQuestions={handleGoToQuestions}
                    selectedClass={selectedClass} // Pass selected class
                />
            </div>
        );
    }
    if (currentView === 'results') {
        return (
            <div className="assignments-dashboard">
                <AssignmentResults
                    teacherInfo={teacherInfo}
                    onBack={handleBackToDashboard}
                    selectedClass={selectedClass}
                    onSubmissionApproved={onSubmissionApproved}
                    initialAssignmentId={initialAssignmentId}
                />
            </div>
        );
    }
    if(currentView === 'manage') {
        return (
            <div className="assignments-dashboard">
                <ManageAssignment 
                    onBack={handleBackToDashboard}
                    selectedClass={selectedClass} // Pass selected class
                />
            </div>
        );
    }

    if (currentView === 'questions') {
        return (
            <div className="assignments-dashboard">
                <AssignmentQuestionCreationPage 
                    onBack={handleBackToDashboard}
                    selectedClass={selectedClass} // Pass selected class
                />
            </div>
        );
    }

    if (currentView !== 'dashboard' && currentView !== 'results' && currentView !== 'manage' && currentView !== 'create' && currentView !== 'questions') {
        return (
            <div className="assignments-dashboard">
                <div className="loading-container flex-col text-center" style={{ padding: '40px' }}>
                    <button 
                        onClick={handleBackToDashboard}
                        className="btn btn-primary mb-lg"
                    >
                        ← Back to Assignments
                    </button>
                    <h2 className="text-2xl mb-md">{currentView.charAt(0).toUpperCase() + currentView.slice(1)} - Coming Soon!</h2>
                    <p className="text-secondary">This feature will be available soon.</p>
                </div>
            </div>
        );
    }

    // Main Dashboard View
    if (loading || loadingStudentsData) {
        return (
            <div className="assignments-dashboard">
                <div className="loading-container">
                    <div className="spinner"></div>
                    Loading assignment data for {teacherInfo?.firstName} {teacherInfo?.lastName}...
                </div>
            </div>
        );
    }

    return (
        <div className="assignments-dashboard">
            {/* Header Stats */}
            <section className="assignment-stats">
                <div className="stat-card card card-md flex items-center gap-md">
                    <div className="icon-box icon-xl icon-box-primary">
                        <BiFile />
                    </div>
                    <div>
                        <div className="stat-value">{assignmentStats.totalAssignments}</div>
                        <div className="stat-label">Total Assignments</div>
                    </div>
                </div>

                <div className="stat-card card card-md flex items-center gap-md">
                    <div className="icon-box icon-xl icon-box-info">
                        <BiCalendar />
                    </div>
                    <div>
                        <div className="stat-value">{assignmentStats.activeAssignments}</div>
                        <div className="stat-label">Active Assignments</div>
                    </div>
                </div>

                <div className="stat-card card card-md flex items-center gap-md">
                    <div className="icon-box icon-xl icon-box-warning">
                        <BiGroup />
                    </div>
                    <div>
                        <div className="stat-value">{assignmentStats.totalSubmissions}</div>
                        <div className="stat-label">Total Submissions</div>
                    </div>
                </div>

                <div className="stat-card card card-md flex items-center gap-md">
                    <div className="icon-box icon-xl icon-box-success">
                        <BiBarChart />
                    </div>
                    <div>
                        <div className="stat-value">{Math.round(submissionStats.overallSubmissionRate)}%</div>
                        <div className="stat-label">Submission Rate</div>
                    </div>
                </div>

                <div className="stat-card card card-md flex items-center gap-md">
                    <div className="icon-box icon-xl icon-box-danger">
                        <BiBarChart />
                    </div>
                    <div>
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
                                className="assignment-card card card-lg"
                                onClick={() => handleCardClick(card.id)}
                                style={{ '--card-color': card.color }}
                            >
                                <div className="card-header">
                                    <div 
                                        className="card-icon icon-box icon-lg"
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
                                    <div className="card-stats text-sm text-muted">
                                        {card.stats}
                                    </div>
                                )}
                                
                                <div className="card-footer">
                                    <button 
                                        className="card-action-btn btn btn-primary"
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
                        {recentAssignments.slice(0, 5).map(assignment => {
                            // Calculate status based on dates and submissions
                            const now = new Date();
                            const dueDate = new Date(assignment.dueDate);
                            const isOverdue = now > dueDate;
                            const submissionRate = assignment.totalStudents > 0 ? 
                                (assignment.submissions / assignment.totalStudents) * 100 : 0;
                            
                            let status = 'active';
                            if (isOverdue && submissionRate < 100) {
                                status = 'overdue';
                            } else if (submissionRate === 100) {
                                status = 'completed';
                            } else if (submissionRate > 0) {
                                status = 'grading';
                            }
                            
                            return (
                            <div key={assignment.id} className="recent-assignment">
                                <div className="assignment-header">
                                    <div className="assignment-title-row">
                                        <span className="assignment-type-icon">
                                            {getTypeIcon(assignment.assignmentType || 'quiz')}
                                        </span>
                                        <h4 className="assignment-title">{assignment.title}</h4>
                                    </div>
                                    <span 
                                        className={`assignment-status status-${
                                            status === 'active' ? 'active' :
                                            status === 'grading' ? 'warning' :
                                            status === 'completed' ? 'success' : 'danger'
                                        }`}
                                    >
                                        {getStatusText(status)}
                                    </span>
                                </div>
                                
                                <div className="assignment-meta">
                                    <span className="assignment-class">{assignment.className || 'Class'}</span>
                                    <span className="assignment-due">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                </div>
                                
                                <div className="assignment-details">
                                    <span>{assignment.questions?.length || assignment.questionCount || 0} questions</span>
                                    <span>{assignment.timeLimit || 60} min</span>
                                </div>
                                
                                <div className="assignment-progress">
                                    <div className="progress-info">
                                        <span>{assignment.submissions || 0}/{assignment.totalStudents || 0} submitted</span>
                                        <span>{Math.round(submissionRate)}% rate</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ 
                                                width: `${submissionRate}%`,
                                                backgroundColor: getStatusColor(status)
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            )
                        })}
                    </div>
                    
                    <button 
                        className="view-all-assignments btn btn-secondary"
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
