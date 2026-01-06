import React, { useState, useEffect } from 'react';
import { BiPlus, BiBarChart, BiEdit, BiTrendingUp, BiCalendar, BiFile, BiGroup, BiSave, BiX, BiArrowBack, BiBrain, BiBullseye } from 'react-icons/bi';
import '../Assignments.css';
import { getTeacherClasses, getAllEnrolledStudentInfo } from './TeacherDashboardService';

const AssignmentCreation = ({ onBack, onGoToQuestions }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        grade: '',
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
            const token = localStorage.getItem('token');
            if(!token){
                throw new Error('No authentication token found');
            }
            const payload = JSON.parse(atob(token.split('.')[1]));
            const teacherId = payload.sub;

            const classes = await getTeacherClasses(teacherId);
            setClassesData(classes);
        }
        catch (error) {
            console.error('Error fetching class data:', error);
        }
    }

    const loadStudentReadinessData = async () => {
        setLoadingStudents(true);
        try {
            const classes = await getTeacherClasses();
            const allStudentsData = [];
            
            // Collect readiness data from all classes
            for (const classItem of classes) {
                const studentsInClass = await getAllEnrolledStudentInfo(classItem.id);
                studentsInClass.forEach(([studentInfo, studentProgress]) => {
                    const readiness = studentProgress?.readinessLevel || 0;
                    allStudentsData.push({
                        id: studentInfo.id,
                        name: `${studentInfo.firstName} ${studentInfo.lastName}`,
                        className: classItem.name,
                        readiness: readiness
                    });
                });
            }

            // Calculate readiness statistics
            const totalStudents = allStudentsData.length;
            const averageReadiness = totalStudents > 0 
                ? Math.round(allStudentsData.reduce((sum, s) => sum + s.readiness, 0) / totalStudents)
                : 0;
            const lowReadinessCount = allStudentsData.filter(s => s.readiness < 70).length;
            const highReadinessCount = allStudentsData.filter(s => s.readiness >= 85).length;

            setStudentsData(allStudentsData);
            setReadinessStats({
                averageReadiness,
                lowReadinessCount,
                highReadinessCount
            });

        } catch (error) {
            console.error('Error loading student readiness data:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const subjects = [
        'Mathematics',
        'Science',
        'English Language',
        'Social Studies',
        'Computer Science',
        'Biology',
        'Chemistry',
        'Physics',
        'History',
        'Geography'
    ];

    const grades = [
        'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
        'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
        'Grade 11', 'Grade 12'
    ];

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

        if (!formData.subject) {
            newErrors.subject = 'Subject is required';
        }

        if (!formData.grade) {
            newErrors.grade = 'Grade level is required';
        }

        if (!formData.dueDate) {
            newErrors.dueDate = 'Due date is required';
        }

        if (!formData.dueTime) {
            newErrors.dueTime = 'Due time is required';
        }

        if (!formData.totalMarks || formData.totalMarks <= 0) {
            newErrors.totalMarks = 'Total marks must be greater than 0';
        }

        if (!formData.passingMarks || formData.passingMarks <= 0) {
            newErrors.passingMarks = 'Passing marks must be greater than 0';
        }

        if (formData.passingMarks > formData.totalMarks) {
            newErrors.passingMarks = 'Passing marks cannot exceed total marks';
        }

        if (!formData.duration || formData.duration <= 0) {
            newErrors.duration = 'Duration must be greater than 0';
        }

        if (formData.allowMultipleAttempts && (!formData.maxAttempts || formData.maxAttempts <= 0)) {
            newErrors.maxAttempts = 'Maximum attempts must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('🚀 Form submission started');
        
        if (!validateForm()) {
            console.log('❌ Form validation failed');
            return;
        }
        console.log('✅ Form validation passed');

        setIsSubmitting(true);

        try {
            // Prepare assignment data with readiness considerations
            const assignmentData = {
                ...formData,
                readinessStats: readinessStats,
                studentReadinessData: studentsData,
                createdAt: new Date().toISOString(),
                createdBy: localStorage.getItem('teacherId') || 'current_teacher'
            };

            // If readiness adjustment is enabled, add difficulty mapping
            if (formData.adjustDifficultyByReadiness) {
                assignmentData.difficultyMapping = {
                    easy: studentsData.filter(s => s.readiness < formData.minimumReadinessThreshold).map(s => s.id),
                    medium: studentsData.filter(s => s.readiness >= formData.minimumReadinessThreshold && s.readiness < 85).map(s => s.id),
                    hard: studentsData.filter(s => s.readiness >= 85).map(s => s.id)
                };
            }

            // Save assignment data to localStorage
            localStorage.setItem('currentAssignmentData', JSON.stringify(assignmentData));
            console.log('💾 Assignment data saved to localStorage:', assignmentData);
            
            // Go to question creation page using callback
            console.log('🧭 Calling onGoToQuestions callback');
            if (onGoToQuestions) {
                onGoToQuestions();
            }
            console.log('🧭 Callback completed');
            
        } catch (error) {
            console.error('❌ Error processing assignment data:', error);
            alert('Error processing assignment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            title: '',
            description: '',
            subject: '',
            grade: '',
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

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="subject">Subject *</label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    className={errors.subject ? 'error' : ''}
                                >
                                    <option value="">Select subject</option>
                                    {subjects.map(subject => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                                {errors.subject && <span className="error-message">{errors.subject}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="grade">Grade Level *</label>
                                <select
                                    id="grade"
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleInputChange}
                                    className={errors.grade ? 'error' : ''}
                                >
                                    <option value="">Select grade</option>
                                    {grades.map(grade => (
                                        <option key={grade} value={grade}>{grade}</option>
                                    ))}
                                </select>
                                {errors.grade && <span className="error-message">{errors.grade}</span>}
                            </div>
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
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">Assign to all</option>
                                    {classesData.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                               

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

                            <div className="form-group">
                                <label htmlFor="passingMarks">Passing Marks *</label>
                                <input
                                    type="number"
                                    id="passingMarks"
                                    name="passingMarks"
                                    value={formData.passingMarks}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 50"
                                    min="1"
                                    className={errors.passingMarks ? 'error' : ''}
                                />
                                {errors.passingMarks && <span className="error-message">{errors.passingMarks}</span>}
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
                    <div className="form-section">
                        <h3>Assignment Settings</h3>
                        
                        <div className="form-group">
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="allowLateSubmission"
                                        checked={formData.allowLateSubmission}
                                        onChange={handleInputChange}
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
                                        name="showResults"
                                        checked={formData.showResults}
                                        onChange={handleInputChange}
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
                                        name="randomizeQuestions"
                                        checked={formData.randomizeQuestions}
                                        onChange={handleInputChange}
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
                                        name="allowMultipleAttempts"
                                        checked={formData.allowMultipleAttempts}
                                        onChange={handleInputChange}
                                    />
                                    Allow multiple attempts
                                </label>
                            </div>
                        </div>

                        {formData.allowMultipleAttempts && (
                            <div className="form-group">
                                <label htmlFor="maxAttempts">Maximum Attempts</label>
                                <input
                                    type="number"
                                    id="maxAttempts"
                                    name="maxAttempts"
                                    value={formData.maxAttempts}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="10"
                                    className={errors.maxAttempts ? 'error' : ''}
                                />
                                {errors.maxAttempts && <span className="error-message">{errors.maxAttempts}</span>}
                            </div>
                        )}
                    </div>

                    {/* Student Readiness Section */}
                    <div className="form-section">
                        <h3><BiBrain /> Student Readiness Insights</h3>
                        
                        {loadingStudents ? (
                            <div className="readiness-loading">
                                <div className="loading-indicator">Loading student readiness data...</div>
                            </div>
                        ) : studentsData.length > 0 ? (
                            <div className="readiness-overview">
                                <div className="readiness-stats">
                                    <div className="stat-card">
                                        <div className="stat-value">{readinessStats.averageReadiness}%</div>
                                        <div className="stat-label">Average Readiness</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{readinessStats.highReadinessCount}</div>
                                        <div className="stat-label">High Performers (≥85%)</div>
                                    </div>
                                    <div className="stat-card low-readiness">
                                        <div className="stat-value">{readinessStats.lowReadinessCount}</div>
                                        <div className="stat-label">Need Support (&lt;70%)</div>
                                    </div>
                                </div>

                                {readinessStats.lowReadinessCount > 0 && (
                                    <div className="readiness-recommendation">
                                        <BiBullseye /> 
                                        <strong>Recommendation:</strong> {readinessStats.lowReadinessCount} student{readinessStats.lowReadinessCount > 1 ? 's' : ''} 
                                        {readinessStats.lowReadinessCount > 1 ? ' have' : ' has'} readiness below 70%. 
                                        Consider providing additional preparation time or resources.
                                    </div>
                                )}

                                <div className="form-group">
                                    <div className="checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="adjustDifficultyByReadiness"
                                                checked={formData.adjustDifficultyByReadiness}
                                                onChange={handleInputChange}
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
                                                name="enableReadinessRecommendations"
                                                checked={formData.enableReadinessRecommendations}
                                                onChange={handleInputChange}
                                            />
                                            Provide readiness-based study recommendations to students
                                        </label>
                                    </div>
                                </div>

                                {formData.adjustDifficultyByReadiness && (
                                    <div className="form-group">
                                        <label htmlFor="minimumReadinessThreshold">Minimum Readiness Threshold (%)</label>
                                        <input
                                            type="number"
                                            id="minimumReadinessThreshold"
                                            name="minimumReadinessThreshold"
                                            value={formData.minimumReadinessThreshold}
                                            onChange={handleInputChange}
                                            min="1"
                                            max="100"
                                            placeholder="e.g., 70"
                                        />
                                        <small>Students below this threshold will receive easier questions</small>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="no-readiness-data">
                                <p>No student readiness data available. Students will need to complete some practice sessions first.</p>
                            </div>
                        )}
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