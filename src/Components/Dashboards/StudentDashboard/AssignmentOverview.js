import React, { useState, useEffect, useMemo } from 'react';
import { BiUser, BiCalendar, BiBook, BiTime, BiCheckCircle, BiPlay, BiFlag, BiLeftArrow } from 'react-icons/bi';
import { getAssignmentsForClass, getSubmissionByAssignmentAndStudent } from './StudentDashboardService';
import '../ClassOverview.css';
import { getUserIdFromToken } from '../../../utils/tokenUtils';

export default function AssignmentOverview({ selectedClass, onBack, onNavigate }) {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userSubmissions, setUserSubmissions] = useState({});

    const currentUserId = useMemo(() => {
        const id = getUserIdFromToken();
        if (id) return id;
        try {
            const userData = localStorage.getItem('userData');
            if (userData) return JSON.parse(userData)?.id;
        } catch { /* ignore */ }
        return null;
    }, []);

    useEffect(() => {
        fetchAssignments();
    }, [selectedClass, currentUserId]);

    const fetchAssignments = async () => {
        if (!currentUserId) {
            setError('Unable to identify current user. Please log in again.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const assignmentData = await getAssignmentsForClass(selectedClass.classId, currentUserId);
            console.log('Fetched assignments:', assignmentData);
            setAssignments(assignmentData);
            
            // Fetch submission data for each assignment
            const submissionsData = {};
            for (const assignment of assignmentData) {
                try {
                    const submission = await getSubmissionByAssignmentAndStudent(assignment.id, currentUserId);
                    if (submission) {
                        submissionsData[assignment.id] = submission;
                    }
                } catch (error) {
                    console.warn(`No submission found for assignment ${assignment.id}:`, error);
                }
            }
            setUserSubmissions(submissionsData);
            console.log('User submissions:', submissionsData);
            
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setError('Failed to load assignments');
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    const getAssignmentStatus = (assignment) => {
        const submission = userSubmissions[assignment.id];
        const dueDate = new Date(assignment.dueDate);
        const now = new Date();
        
        // If submitted, it's completed
        if (submission && submission.status === 'submitted') {
            return 'completed';
        }
        
        // If past due date and not submitted, it's overdue
        if (dueDate < now && (!submission || submission.status !== 'submitted')) {
            return 'overdue';
        }
        
        // If has submission but not submitted, it's in progress
        if (submission && submission.status === 'in_progress') {
            return 'in-progress';
        }
        
        // Otherwise it's pending
        return 'pending';
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'completed': return <BiCheckCircle style={{ color: '#10b981' }} />;
            case 'overdue': return <BiTime style={{ color: '#ef4444' }} />;
            case 'in-progress': return <BiPlay style={{ color: '#f59e0b' }} />;
            default: return <BiBook style={{ color: '#64748b' }} />;
        }
    };

    const handleAssignmentClick = (assignment) => {
        const submission = userSubmissions[assignment.id];
        const status = getAssignmentStatus(assignment);

        // Completed assignments go to the review page
        if (status === 'completed' && submission) {
            onNavigate('assignment-review', { assignment, submission });
            return;
        }

        onNavigate('assignment-questions', { assignment });
    };

    if (loading) {
        return (
            <div className="class-overview-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <h2>Loading Assignments...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="class-overview-container">
                <div className="overview-header">
                    <button onClick={onBack} className="back-btn">
                        ← Back to Class Overview
                    </button>
                    <div className="class-info">
                        <h1>{selectedClass.name} - Assignments</h1>
                    </div>
                </div>
                <div className="error-state">
                    <h3>Error Loading Assignments</h3>
                    <p>{error}</p>
                    <button onClick={fetchAssignments} className="retry-btn">Try Again</button>
                </div>
            </div>
        );
    }

    const completedCount = assignments.filter(a => getAssignmentStatus(a) === 'completed').length;
    const pendingCount = assignments.filter(a => ['pending', 'in-progress'].includes(getAssignmentStatus(a))).length;
    const overdueCount = assignments.filter(a => getAssignmentStatus(a) === 'overdue').length;

    return (
        <div className="class-overview-container">
            {/* Header */}
            <div className="overview-header">
                <button onClick={onBack} className="back-btn">
                    ← Back to Class Overview
                </button>
                <div className="class-info">
                    <h1>{selectedClass.name} - Assignments</h1>
                    <p className="class-details">
                        {selectedClass.subject} • {selectedClass.teacher}
                    </p>
                </div>
            </div>

            {/* Assignment Stats */}
            <div className="quick-stats">
                <div className="stat-card">
                    <BiBook className="stat-icon" />
                    <div className="stat-info">
                        <span className="stat-number">{assignments.length}</span>
                        <span className="stat-label">Total Assignments</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BiCheckCircle className="stat-icon" style={{ color: '#10b981' }} />
                    <div className="stat-info">
                        <span className="stat-number">{completedCount}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BiPlay className="stat-icon" style={{ color: '#f59e0b' }} />
                    <div className="stat-info">
                        <span className="stat-number">{pendingCount}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BiTime className="stat-icon" style={{ color: '#ef4444' }} />
                    <div className="stat-info">
                        <span className="stat-number">{overdueCount}</span>
                        <span className="stat-label">Overdue</span>
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            <div className="assignments-section">
                <h2>All Assignments</h2>
                {assignments.length === 0 ? (
                    <div className="empty-state">
                        <BiBook size={64} />
                        <h3>No Assignments Yet</h3>
                        <p>Your teacher hasn't assigned any work for this class yet.</p>
                    </div>
                ) : (
                    <div className="assignments-grid">
                        {assignments.map((assignment) => {
                            const status = getAssignmentStatus(assignment);
                            const submission = userSubmissions[assignment.id];
                            const progress = status === 'completed' ? 100 : 
                                           status === 'in-progress' ? 50 : 0;
                            
                            return (
                                <div 
                                    key={assignment.id} 
                                    className={`assignment-card ${status}`}
                                    onClick={() => handleAssignmentClick(assignment)}
                                >
                                    <div className="assignment-header">
                                        <div className="assignment-title-section">
                                            <h3>{assignment.title || `Assignment ${assignment.id}`}</h3>
                                            <p className="assignment-description">
                                                {assignment.description || 'No description provided'}
                                            </p>
                                        </div>
                                        <div className="assignment-status-icon">
                                            {getStatusIcon(status)}
                                        </div>
                                    </div>

                                    <div className="assignment-details">
                                        <div className="assignment-detail">
                                            <BiCalendar />
                                            <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</span>
                                        </div>
                                        <div className="assignment-detail">
                                            <BiBook />
                                            <span>{assignment.questions?.length || assignment.questionCount || 0} Questions</span>
                                        </div>
                                        <div className="assignment-detail">
                                            <BiTime />
                                            <span>Est. {assignment.estimatedTime || assignment.timeLimit || '30'} min</span>
                                        </div>
                                        {submission && (
                                            <div className="assignment-detail">
                                                <BiFlag />
                                                <span>
                                                    {status === 'completed' ? 'Submitted' : 
                                                     status === 'in-progress' ? 'In Progress' : 'Not Started'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="assignment-progress">
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill" 
                                                style={{ 
                                                    width: `${progress}%`,
                                                    backgroundColor: status === 'completed' ? '#10b981' : 
                                                                   status === 'in-progress' ? '#f59e0b' : '#64748b'
                                                }}
                                            />
                                        </div>
                                        <span className="progress-text">
                                            {status === 'completed' ? 'Submitted' : 
                                             status === 'in-progress' ? 'In Progress' : 
                                             status === 'overdue' ? 'Overdue' : 'Not Started'}
                                        </span>
                                    </div>

                                    <div className="assignment-actions">
                                        <button 
                                            className={`assignment-action-btn ${status}`}
                                            onClick={(e) => { e.stopPropagation(); handleAssignmentClick(assignment); }}
                                        >
                                            {status === 'completed' ? 'View Submission' :
                                             status === 'in-progress' ? 'Continue' :
                                             status === 'overdue' ? 'View Assignment' :
                                             'Start Assignment'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}