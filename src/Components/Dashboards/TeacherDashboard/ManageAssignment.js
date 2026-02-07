import React, { useState, useEffect } from 'react';
import { BiPlus, BiBarChart, BiEdit, BiTrendingUp, BiCalendar, BiFile, BiGroup, BiSave, BiX, BiArrowBack, BiBrain, BiBullseye, BiTrash, BiEye, BiBook, BiTime, BiCheck } from 'react-icons/bi';
import '../Assignments.css';
import { 
    getTeacherClasses, 
    getAllEnrolledStudentInfo, 
    createAssignmentForClass, 
    getAssignmentsForClassWithQuestions,
    getAssignmentsByTeacher,
    deleteAssignment,
    updateAssignment, 
} from './TeacherDashboardService';
import AssignmentCreation from './AssignmentCreation';

const ManageAssignment = ({ onBack }) => {
    const [classes, setClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Form states
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [assignmentDescription, setAssignmentDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            loadAssignments();
        }
    }, [selectedClassId]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const teacherClasses = await getTeacherClasses();
            setClasses(teacherClasses);
            
            // Load all assignments for the teacher
            const teacherAssignments = await getAssignmentsByTeacher();
            setAssignments(teacherAssignments);
            
            setLoading(false);
        } catch (error) {
            console.error('Error loading initial data:', error);
            setError('Failed to load data');
            setLoading(false);
        }
    };

    const loadAssignments = async () => {
        try {
            if (!selectedClassId) return;
            
            const classAssignments = await getAssignmentsForClassWithQuestions(selectedClassId);
            setAssignments(classAssignments);
        } catch (error) {
            console.error('Error loading assignments:', error);
            setError('Failed to load assignments');
        }
    };

    const handleClassSelect = (classData) => {
        setSelectedClassId(classData.id);
        setSelectedClass(classData);
        setView('list');
    };

    const handleCreateAssignment = async () => {
        if (!assignmentTitle || !selectedClassId) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setIsCreating(true);
            
            const assignmentData = {
                title: assignmentTitle,
                description: assignmentDescription,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                classId: parseInt(selectedClassId),
                isPublished: false,
                maxAttempts: 3,
                timeLimit: null,
                instructions: assignmentDescription,
                createdAt: new Date().toISOString()
            };

            await createAssignmentForClass(assignmentData);
            
            // Reset form
            setAssignmentTitle('');
            setAssignmentDescription('');
            setDueDate('');
            setView('list');
            
            // Reload assignments
            await loadAssignments();
            
            setIsCreating(false);
        } catch (error) {
            console.error('Error creating assignment:', error);
            setError('Failed to create assignment');
            setIsCreating(false);
        }
    };

    const handleEditAssignment = (assignment) => {
        setEditingAssignment(assignment);
        setAssignmentTitle(assignment.title);
        setAssignmentDescription(assignment.description || assignment.instructions || '');
        setDueDate(assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '');
        setView('edit');
    };

    const handleUpdateAssignment = async () => {
        if (!editingAssignment || !assignmentTitle) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setIsCreating(true);
            
            const updatedData = {
                ...editingAssignment,
                title: assignmentTitle,
                description: assignmentDescription,
                instructions: assignmentDescription,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            };

            await updateAssignment(editingAssignment.id, updatedData);
            
            // Reset form
            setEditingAssignment(null);
            setAssignmentTitle('');
            setAssignmentDescription('');
            setDueDate('');
            setView('list');
            
            // Reload assignments
            await loadAssignments();
            
            setIsCreating(false);
        } catch (error) {
            console.error('Error updating assignment:', error);
            setError('Failed to update assignment');
            setIsCreating(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteAssignment(assignmentId);
            await loadAssignments();
        } catch (error) {
            console.error('Error deleting assignment:', error);
            setError('Failed to delete assignment');
        }
    };

    const getStatusBadge = (assignment) => {
        const now = new Date();
        const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
        const isOverdue = dueDate && now > dueDate;
        const isPublished = assignment.isPublished;

        if (isOverdue) {
            return <span className="status-badge overdue"><BiTime /> Overdue</span>;
        } else if (isPublished) {
            return <span className="status-badge published"><BiCheck /> Published</span>;
        } else {
            return <span className="status-badge draft"><BiEdit /> Draft</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No due date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="ManageAssignmentContainer">
                <div className="loading-state">
                    <h2>Loading assignments...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="ManageAssignmentContainer">
            <div className="assignment-header">
                <div className="header-content">
                    {onBack && (
                        <button 
                            onClick={onBack} 
                            className="back-btn"
                        >
                            <BiArrowBack /> Back to Assignments Overview
                        </button>
                    )}
                    <h2><BiBullseye /> Manage Assignments</h2>
                    <p>Create, edit, and manage assignments for your classes</p>
                </div>
                
                {view === 'list' && selectedClass && (
                    <button 
                        onClick={() => setView('create')} 
                        className="create-assignment-btn"
                    >
                        <BiPlus /> Create Assignment
                    </button>
                )}
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError('')} className="close-error">
                        <BiX />
                    </button>
                </div>
            )}

            {/* Class Selection */}
            {!selectedClass && (
                <div className="class-selection">
                    <h3><BiGroup /> Select a Class</h3>
                    <div className="classes-grid">
                        {classes.map(classData => (
                            <div 
                                key={classData.id} 
                                className="class-card clickable"
                                onClick={() => handleClassSelect(classData)}
                            >
                                <div className="class-header">
                                    <h4>{classData.name}</h4>
                                    <span className="class-subject">{classData.subject}</span>
                                </div>
                                <div className="class-details">
                                    <p><BiGroup /> {classData.currentEnrollment || 0} students</p>
                                    <p><BiCalendar /> {classData.schedule}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Assignment Creation Component */}
            {view === 'create' && selectedClass && (
                <AssignmentCreation 
                    selectedClass={selectedClass}
                    onBack={() => setView('list')}
                    onAssignmentCreated={() => {
                        setView('list');
                        loadAssignments();
                    }}
                />
            )}

            {/* Edit Assignment Form */}
            {view === 'edit' && selectedClass && (
                <div className="assignment-form-container">
                    <div className="form-header">
                        <button 
                            onClick={() => setView('list')} 
                            className="back-btn"
                        >
                            <BiArrowBack /> Back to Assignments
                        </button>
                        <h3>
                            Edit Assignment
                            <span className="class-context">for {selectedClass.name}</span>
                        </h3>
                    </div>

                    <div className="assignment-form">
                        <div className="form-section">
                            <label htmlFor="title">Assignment Title *</label>
                            <input
                                id="title"
                                type="text"
                                value={assignmentTitle}
                                onChange={(e) => setAssignmentTitle(e.target.value)}
                                placeholder="Enter assignment title"
                                className="form-input"
                            />
                        </div>

                        <div className="form-section">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                value={assignmentDescription}
                                onChange={(e) => setAssignmentDescription(e.target.value)}
                                placeholder="Enter assignment instructions and description"
                                className="form-textarea"
                                rows="4"
                            />
                        </div>

                        <div className="form-section">
                            <label htmlFor="dueDate">Due Date</label>
                            <input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="form-input"
                            />
                        </div>

                        <div className="form-actions">
                            <button 
                                onClick={() => setView('list')} 
                                className="btn-secondary"
                                disabled={isCreating}
                            >
                                <BiX /> Cancel
                            </button>
                            <button 
                                onClick={handleUpdateAssignment}
                                className="btn-primary"
                                disabled={isCreating || !assignmentTitle}
                            >
                                <BiSave /> {isCreating ? 'Saving...' : 'Update Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignments List */}
            {view === 'list' && selectedClass && (
                <div className="assignments-list-container">
                    <div className="assignments-header">
                        <div className="class-info">
                            <button 
                                onClick={() => setSelectedClass(null)} 
                                className="back-btn"
                            >
                                <BiArrowBack /> Back to Classes
                            </button>
                            <div>
                                <h3>{selectedClass.name} - Assignments</h3>
                                <p>{selectedClass.subject} • {selectedClass.currentEnrollment || 0} students</p>
                            </div>
                        </div>
                    </div>

                    {assignments.length === 0 ? (
                        <div className="empty-state">
                            <BiFile className="empty-icon" />
                            <h3>No assignments yet</h3>
                            <p>Create your first assignment to get started</p>
                            <button 
                                onClick={() => setView('create')} 
                                className="btn-primary"
                            >
                                <BiPlus /> Create Assignment
                            </button>
                        </div>
                    ) : (
                        <div className="assignments-grid">
                            {assignments.map(assignment => (
                                <div key={assignment.id} className="assignment-card">
                                    <div className="assignment-header">
                                        <div className="assignment-title">
                                            <h4>{assignment.title}</h4>
                                            {getStatusBadge(assignment)}
                                        </div>
                                        <div className="assignment-actions">
                                            <button 
                                                onClick={() => handleEditAssignment(assignment)}
                                                className="btn-icon"
                                                title="Edit Assignment"
                                            >
                                                <BiEdit />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteAssignment(assignment.id)}
                                                className="btn-icon danger"
                                                title="Delete Assignment"
                                            >
                                                <BiTrash />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="assignment-content">
                                        {assignment.description && (
                                            <p className="assignment-description">
                                                {assignment.description.length > 100 
                                                    ? `${assignment.description.substring(0, 100)}...` 
                                                    : assignment.description}
                                            </p>
                                        )}
                                        
                                        <div className="assignment-meta">
                                            <div className="meta-item">
                                                <BiCalendar />
                                                <span>Due: {formatDate(assignment.dueDate)}</span>
                                            </div>
                                            <div className="meta-item">
                                                <BiBook />
                                                <span>{assignment.totalQuestions || 0} questions</span>
                                            </div>
                                            {assignment.totalPoints > 0 && (
                                                <div className="meta-item">
                                                    <BiBullseye />
                                                    <span>{assignment.totalPoints} points</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="assignment-stats">
                                            <div className="stat">
                                                <span className="stat-label">Created</span>
                                                <span className="stat-value">
                                                    {formatDate(assignment.createdAt)}
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Attempts</span>
                                                <span className="stat-value">
                                                    {assignment.maxAttempts || 'Unlimited'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManageAssignment;