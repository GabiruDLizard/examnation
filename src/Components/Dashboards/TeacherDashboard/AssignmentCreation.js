import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { BiPlus, BiBarChart, BiEdit, BiTrendingUp, BiCalendar, BiFile, BiGroup, BiSave, BiX, BiArrowBack, BiBrain, BiBullseye } from 'react-icons/bi';
import '../Assignments.css';
import { getTeacherClasses, getAllEnrolledStudentInfo, createAssignmentForClass, getClassReadinessHistory } from './TeacherDashboardService';
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import AssignmentQuestionCreationPage from './AssignmentQuestionPage';

const AssignmentCreation = ({ onBack, onGoToQuestions }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        dueTime: '',
        assignedClass: '',
        passingMarks: '',
        duration: '',
        instructions: '',
        allowLateSubmission: false,
        showResults: true,
        randomizeQuestions: false,
        allowMultipleAttempts: false,
        maxAttempts: 1,
        // Readiness-based settings
        adjustDifficultyByReadiness: false,
        minimumReadinessThreshold: 70,
        enableReadinessRecommendations: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studentsData, setStudentsData] = useState([]);
    const [readinessStats, setReadinessStats] = useState({
        averageReadiness: 0,
        lowReadinessCount: 0,
        highReadinessCount: 0
    });
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [classesData, setClassesData] = useState([]);
    const [selectedClass, setSelectedClass] = useState('all');


    // Load student readiness data on component mount
    useEffect(() => {
        loadStudentReadinessData();
        fetchClassData();
    }, []);

    const fetchClassData = async () => {
        try {
            const teacherId = getUserIdFromToken();
            if (!teacherId) {
                throw new Error('No authentication token found');
            }

            const classes = await getTeacherClasses();
            setClassesData(classes);
        }
        catch (error) {
            }
    }

    const loadStudentReadinessData = async () => {
        setLoadingStudents(true);
        try {
            const classes = await getTeacherClasses();
            const allStudentsData = [];

            for (const classItem of classes) {
                try {
                    const history = await getClassReadinessHistory(classItem.id, 4);
                    // Latest record per student
                    const latestByStudent = {};
                    history.forEach(record => {
                        if (!latestByStudent[record.studentId] ||
                            new Date(record.weekDate) > new Date(latestByStudent[record.studentId].weekDate)) {
                            latestByStudent[record.studentId] = record;
                        }
                    });
                    Object.values(latestByStudent).forEach(record => {
                        allStudentsData.push({
                            id: record.studentId,
                            className: classItem.name,
                            readiness: Math.round(record.readinessPercentage)
                        });
                    });
                } catch { /* non-fatal per class */ }
            }

            const totalStudents = allStudentsData.length;
            const averageReadiness = totalStudents > 0
                ? Math.round(allStudentsData.reduce((sum, s) => sum + s.readiness, 0) / totalStudents)
                : 0;
            const lowReadinessCount = allStudentsData.filter(s => s.readiness < 70).length;
            const highReadinessCount = allStudentsData.filter(s => s.readiness >= 85).length;

            setStudentsData(allStudentsData);
            setReadinessStats({ averageReadiness, lowReadinessCount, highReadinessCount });
        } catch (error) {
            } finally {
            setLoadingStudents(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Assignment title is required';
        }

        if (!formData.dueDate) {
            newErrors.dueDate = 'Due date is required';
        }

        if (!formData.dueTime) {
            newErrors.dueTime = 'Due time is required';
        }

        if (!formData.duration || formData.duration <= 0) {
            newErrors.duration = 'Duration must be greater than 0';
        }

        if (!formData.assignedClass) {
            newErrors.assignedClass = 'Please select a class';
        }

        if (formData.allowMultipleAttempts && (!formData.maxAttempts || formData.maxAttempts <= 0)) {
            newErrors.maxAttempts = 'Maximum attempts must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        const classId = parseInt(formData.assignedClass, 10);
        if (!classId || isNaN(classId)) {
            toast.error('Please select a valid class.');
            return;
        }

        setIsSubmitting(true);

        try {
            const teacherId = getUserIdFromToken();

            // Prepare assignment data for API
            const assignmentData = {
                title: formData.title,
                description: formData.description,
                dueDate: formData.dueDate ? new Date(formData.dueDate + 'T' + (formData.dueTime || '23:59')).toISOString() : null,
                pointsPossible: 100,
                assignmentType: 'homework',
                status: 'active',
                classId: classId,
                teacherId: parseInt(teacherId),
                durationMinutes: formData.duration ? parseInt(formData.duration) : null,
                // Additional metadata for future use
                metadata: {
                    duration: formData.duration,
                    instructions: formData.instructions,
                    allowLateSubmission: formData.allowLateSubmission,
                    showResults: formData.showResults,
                    randomizeQuestions: formData.randomizeQuestions,
                    allowMultipleAttempts: formData.allowMultipleAttempts,
                    maxAttempts: formData.maxAttempts,
                    adjustDifficultyByReadiness: formData.adjustDifficultyByReadiness,
                    minimumReadinessThreshold: formData.minimumReadinessThreshold,
                    enableReadinessRecommendations: formData.enableReadinessRecommendations,
                    readinessStats: readinessStats,
                    studentReadinessData: studentsData
                }
            };

            // Create assignment via API
            const createdAssignment = await createAssignmentForClass(assignmentData);

            // Save assignment data to localStorage for question creation
            localStorage.setItem('currentAssignmentData', JSON.stringify({
                ...assignmentData,
                assignmentId: createdAssignment.id,
                createdAt: new Date().toISOString()
            }));
            
            // Go to question creation page using callback
            if (onGoToQuestions) {
                onGoToQuestions();
            }
            
            // Don't remove localStorage data immediately - let the question page handle it
            
        } catch (error) {
            toast.error('Error creating assignment: ' + (error.message || 'Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            title: '',
            description: '',
            dueDate: '',
            dueTime: '',
            totalMarks: '',
            passingMarks: '',
            duration: '',
            instructions: '',
            allowLateSubmission: false,
            showResults: true,
            randomizeQuestions: false,
            allowMultipleAttempts: false,
            maxAttempts: 1,
            adjustDifficultyByReadiness: false,
            minimumReadinessThreshold: 70,
            enableReadinessRecommendations: true
        });
        setErrors({});
    };

    return (
        <div className="assignment-creation">
            <div className="assignment-creation-header">
                <div className="header-top">
                    <button type="button" onClick={onBack} className="back-button">
                        <BiArrowBack /> Back to Assignments
                    </button>
                </div>
                <h2><BiFile /> Create New Assignment</h2>
                <p>Set up a new assignment for your students</p>
            </div>

            <form onSubmit={handleSubmit} className="assignment-form">
                <div className="form-grid">
                    {/* Basic Information Section */}
                    <div className="form-section">
                        <h3>Basic Information</h3>
                        
                        <div className="form-group">
                            <label htmlFor="title">Assignment Title *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter assignment title"
                                className={errors.title ? 'error' : ''}
                            />
                            {errors.title && <span className="error-message">{errors.title}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter assignment description"
                                rows="3"
                            />
                        </div>

                    </div>

                    {/* Timing Section */}
                    <div className="form-section">
                        <h3><BiCalendar /> Timing & Schedule</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="dueDate">Due Date *</label>
                                <input
                                    type="date"
                                    id="dueDate"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={errors.dueDate ? 'error' : ''}
                                />
                                {errors.dueDate && <span className="error-message">{errors.dueDate}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="dueTime">Due Time *</label>
                                <input
                                    type="time"
                                    id="dueTime"
                                    name="dueTime"
                                    value={formData.dueTime}
                                    onChange={handleInputChange}
                                    className={errors.dueTime ? 'error' : ''}
                                />
                                {errors.dueTime && <span className="error-message">{errors.dueTime}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="duration">Duration (minutes) *</label>
                            <input
                                type="number"
                                id="duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleInputChange}
                                placeholder="e.g., 60"
                                min="1"
                                className={errors.duration ? 'error' : ''}
                            />
                            {errors.duration && <span className="error-message">{errors.duration}</span>}
                        </div>
                    </div>

                    {/* Marking Section */}
                    <div className="form-section">
                        <h3><BiBarChart /> Scoring</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="totalMarks">Assign to a class *</label>
                                <select
                                    value={formData.assignedClass}
                                    onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                                    className={`filter-select${errors.assignedClass ? ' error' : ''}`}
                                >
                                    <option value="">Select a class</option>
                                    {classesData.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.assignedClass && <span className="error-message">{errors.assignedClass}</span>}
                               

                                {/* <input
                                    type="number"
                                    id="totalMarks"
                                    name="totalMarks"
                                    value={formData.totalMarks}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 100"
                                    min="1"
                                    className={errors.totalMarks ? 'error' : ''}
                                />
                                {errors.totalMarks && <span className="error-message">{errors.totalMarks}</span>} */}
                            </div>

                        </div>
                    </div>

                    {/* Instructions Section */}
                    <div className="form-section">
                        <h3>Instructions</h3>
                        
                        <div className="form-group">
                            <label htmlFor="instructions">Special Instructions</label>
                            <textarea
                                id="instructions"
                                name="instructions"
                                value={formData.instructions}
                                onChange={handleInputChange}
                                placeholder="Enter any special instructions for students"
                                rows="4"
                            />
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="form-section" style={{opacity: 0.5, pointerEvents: 'none'}}>
                        <h3>Assignment Settings <span style={{color: '#888', fontSize: '0.8em'}}>(Coming Soon)</span></h3>
                        
                        <div className="form-group">
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        disabled
                                        style={{cursor: 'not-allowed'}}
                                    />
                                    Allow late submissions
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        disabled
                                        style={{cursor: 'not-allowed'}}
                                    />
                                    Show results immediately after submission
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        disabled
                                        style={{cursor: 'not-allowed'}}
                                    />
                                    Randomize question order
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        disabled
                                        style={{cursor: 'not-allowed'}}
                                    />
                                    Allow multiple attempts
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="maxAttempts">Maximum Attempts</label>
                            <input
                                type="text"
                                value="--"
                                disabled
                                style={{cursor: 'not-allowed', backgroundColor: '#f5f5f5'}}
                            />
                        </div>
                    </div>

                    {/* Student Readiness Section */}
                    <div className="form-section">
                        <h3><BiBrain /> Student Readiness Insights</h3>

                        <div className="readiness-overview">
                            <div className="readiness-stats">
                                <div className="stat-card">
                                    <div className="stat-value">
                                        {loadingStudents ? '...' : studentsData.length > 0 ? `${readinessStats.averageReadiness}%` : '--'}
                                    </div>
                                    <div className="stat-label">Average Readiness</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">
                                        {loadingStudents ? '...' : studentsData.length > 0 ? readinessStats.highReadinessCount : '--'}
                                    </div>
                                    <div className="stat-label">High Performers (≥85%)</div>
                                </div>
                                <div className="stat-card low-readiness">
                                    <div className="stat-value">
                                        {loadingStudents ? '...' : studentsData.length > 0 ? readinessStats.lowReadinessCount : '--'}
                                    </div>
                                    <div className="stat-label">Need Support (&lt;70%)</div>
                                </div>
                            </div>

                            <div className="readiness-recommendation">
                                <BiBullseye />
                                <strong>Recommendation:</strong>{' '}
                                {loadingStudents ? 'Loading readiness data...' :
                                 studentsData.length === 0 ? 'No readiness data yet — students need to complete assignments first.' :
                                 readinessStats.averageReadiness >= 85 ? `Class is ready! Average readiness is ${readinessStats.averageReadiness}%.` :
                                 readinessStats.lowReadinessCount > 0 ? `${readinessStats.lowReadinessCount} student(s) may need additional support before this assignment.` :
                                 `Average class readiness is ${readinessStats.averageReadiness}%.`}
                            </div>

                            <div className="form-group">
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            disabled
                                            style={{cursor: 'not-allowed'}}
                                        />
                                        Adjust question difficulty based on individual student readiness
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            disabled
                                            style={{cursor: 'not-allowed'}}
                                        />
                                        Provide readiness-based study recommendations to students
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="minimumReadinessThreshold">Minimum Readiness Threshold (%)</label>
                                <input
                                    type="text"
                                    value="--"
                                    disabled
                                    style={{cursor: 'not-allowed', backgroundColor: '#f5f5f5'}}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn-secondary"
                        disabled={isSubmitting}
                    >
                        <BiX /> Reset
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        <BiSave />
                        {isSubmitting ? 'Creating...' : 'Create Assignment'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AssignmentCreation;