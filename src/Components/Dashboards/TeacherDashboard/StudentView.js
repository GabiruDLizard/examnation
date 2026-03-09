import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BiSearch, BiFilter, BiPlus, BiUser, BiEnvelope, BiPhone, BiCalendar, BiTrendingUp, BiGridAlt, BiListUl } from 'react-icons/bi';
import { getTeacherClasses, enrollStudentInClass, searchStudents, getAllEnrolledStudentInfo } from "./TeacherDashboardService";
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import "../StudentView.css";

export default function StudentView({ teacherInfo, selectedClass, onBack }) {
    const [studentsData, setStudentsData] = useState([]);
    const [classesData, setClassesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('all');
    const [showEnrollForm, setShowEnrollForm] = useState(false);
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "column"
    const [enrollSearch, setEnrollSearch] = useState('');
    const [enrollResults, setEnrollResults] = useState([]);
    const [enrollSearching, setEnrollSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [enrolling, setEnrolling] = useState(false);
    const [enrollError, setEnrollError] = useState('');
    const searchDebounceRef = useRef(null);

    useEffect(() => {
        fetchStudentsData();
    }, [selectedClass]);

    const fetchStudentsData = async () => {
        try {
            setLoading(true);
            const teacherId = getUserIdFromToken();
            if (!teacherId) {
                throw new Error('No authentication token found');
            }

            const classes = await getTeacherClasses();
            setClassesData(classes);

            let allStudents = [];

            if (selectedClass) {
                try {
                    const classStudents = await getAllEnrolledStudentInfo(selectedClass.id);
                    allStudents = classStudents.map(([studentInfo, studentProgress]) => ({
                        id: studentInfo.id,
                        name: `${studentInfo.firstName} ${studentInfo.lastName}`,
                        email: studentInfo.email,
                        phone: studentInfo.phoneNumber || 'N/A',
                        className: selectedClass.name,
                        classId: selectedClass.id,
                        grade: selectedClass.gradeLevel || 'N/A',
                        averageScore: studentProgress?.averageScore ?? 0,
                        readinessLevel: studentProgress?.readinessLevel ?? 0,
                        assignmentsCompleted: studentProgress?.assignmentsCompleted ?? 0,
                        totalAssignments: studentProgress?.totalAssignments ?? 0,
                        attendanceRate: studentProgress?.attendanceRate ?? null,
                        lastActivity: studentProgress?.lastActivity ?? null,
                        status: !studentProgress ? 'no_data' :
                               studentProgress.readinessLevel >= 85 ? 'active' :
                               studentProgress.readinessLevel >= 70 ? 'active' :
                               studentProgress.readinessLevel >= 50 ? 'needs_attention' : 'at_risk',
                        profileImage: studentInfo.profileImageUrl || null
                    }));
                } catch (classError) {
                    console.error(`❌ Error fetching students for class ${selectedClass.name}:`, classError);
                    allStudents = [];
                }
            } else {
                // Get students from all classes
                const allStudentsPromises = classes.map(async (classItem) => {
                    try {
                        const classStudents = await getAllEnrolledStudentInfo(classItem.id);
                        return classStudents.map(([studentInfo, studentProgress]) => ({
                            id: studentInfo.id,
                            name: `${studentInfo.firstName} ${studentInfo.lastName}`,
                            email: studentInfo.email,
                            phone: studentInfo.phoneNumber || 'N/A',
                            className: classItem.name,
                            classId: classItem.id,
                            grade: classItem.gradeLevel || 'N/A',
                            averageScore: studentProgress?.averageScore ?? 0,
                            readinessLevel: studentProgress?.readinessLevel ?? 0,
                            assignmentsCompleted: studentProgress?.assignmentsCompleted ?? 0,
                            totalAssignments: studentProgress?.totalAssignments ?? 0,
                            attendanceRate: studentProgress?.attendanceRate ?? null,
                            lastActivity: studentProgress?.lastActivity ?? null,
                            status: !studentProgress ? 'no_data' :
                                   studentProgress.readinessLevel >= 85 ? 'active' :
                                   studentProgress.readinessLevel >= 70 ? 'active' :
                                   studentProgress.readinessLevel >= 50 ? 'needs_attention' : 'at_risk',
                            profileImage: studentInfo.profileImageUrl || null
                        }));
                    } catch (error) {
                        console.error(`❌ Error fetching students for class ${classItem.name}:`, error);
                        return [];
                    }
                });

                const allStudentsArrays = await Promise.all(allStudentsPromises);
                allStudents = allStudentsArrays.flat();
            }

            setStudentsData(allStudents);
            setError(null);
            
        } catch (error) {
            console.error('❌ Error fetching students data:', error);
            setError(error.message);
            setStudentsData([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = studentsData.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterClass === 'all' || student.classId.toString() === filterClass;
        return matchesSearch && matchesFilter;
    });

    const totalStudents = studentsData.length;
    const activeStudents = studentsData.filter(s => s.status === 'active').length;
    const atRiskStudents = studentsData.filter(s => s.status === 'at_risk').length;
    const averageReadiness = totalStudents > 0 
        ? Math.round(studentsData.reduce((sum, s) => sum + (Number(s.readinessLevel) || 0), 0) / totalStudents)
        : 0;

    const getStatusColor = (status) => {
        switch(status) {
            case 'active': return '#10b981';
            case 'needs_attention': return '#f59e0b';
            case 'at_risk': return '#ef4444';
            case 'no_data': return '#9ca3af';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'active': return 'Active';
            case 'needs_attention': return 'Needs Attention';
            case 'at_risk': return 'At Risk';
            case 'no_data': return 'No Data';
            default: return 'Unknown';
        }
    };

    const handleStudentClick = (student) => {
        console.log('Selected student:', student.name);
        // Add your student detail navigation logic here
    };

    if (loading) {
        return (
            <div className="student-view-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <h2>Loading Students...</h2>
                    <p>Fetching student information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="student-view-container">
            {/* Navigation header */}
            <div className="student-view-nav">
                <button onClick={onBack} className="back-btn">
                    ← Back to {selectedClass ? selectedClass.name : 'Class Overview'}
                </button>
                <h2>Students {selectedClass ? `in ${selectedClass.name}` : 'Overview'}</h2>
            </div>

            {/* Overview stats header */}
            <div className="overview-header">
                <div className="overview-stats">
                    <div className="stat-item">
                        <span className="stat-number">{totalStudents}</span>
                        <span className="stat-label">Total Students</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{activeStudents}</span>
                        <span className="stat-label">On Track</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{atRiskStudents}</span>
                        <span className="stat-label">At Risk</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{averageReadiness}%</span>
                        <span className="stat-label">Avg. Readiness</span>
                    </div>
                </div>

                <div className="header-controls">
                    {/* View Mode Toggle */}
                    <div className="view-mode-toggle">
                        <button 
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <BiGridAlt />
                        </button>
                        <button 
                            className={`view-btn ${viewMode === 'column' ? 'active' : ''}`}
                            onClick={() => setViewMode('column')}
                            title="Column View"
                        >
                            <BiListUl />
                        </button>
                    </div>

                    <button 
                        className="create-class-btn"
                        onClick={() => setShowEnrollForm(true)}
                    >
                        <BiPlus style={{ marginRight: '8px' }} />
                        Enroll A Student
                    </button>
                </div>
            </div>

            {/* Search and filter bar */}
            <div className="filter-bar">
                <div className="search-container">
                    <BiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <div className="filter-container">
                    <BiFilter className="filter-icon" />
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Classes</option>
                        {classesData.map(cls => (
                            <option key={cls.id} value={cls.id.toString()}>
                                {cls.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error notification */}
            {error && (
                <div className="error-notification">
                    ⚠️ Error: {error}
                    <button onClick={fetchStudentsData} className="retry-link">Try Again</button>
                </div>
            )}

            {/* Students Display - Dynamic based on view mode */}
            <div className={`students-container ${viewMode}-view`}>
                {filteredStudents.length === 0 ? (
                    <div className="empty-state">
                        <h3>No Students Found</h3>
                        <p>{searchTerm || filterClass !== "all" ? "No students match your search criteria." : "No students enrolled yet."}</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    // Grid View (smaller cards in 4 columns)
                    <div className="students-grid">
                        {filteredStudents.map((student) => (
                            <div 
                                key={student.id} 
                                className="student-card grid-card"
                                onClick={() => handleStudentClick(student)}
                            >
                                <div className="student-header">
                                    <div className="student-avatar">
                                        {student.profileImage ? (
                                            <img src={student.profileImage} alt={student.name} />
                                        ) : (
                                            <BiUser size={24} />
                                        )}
                                    </div>
                                    <div 
                                        className="student-status-badge"
                                        style={{ backgroundColor: getStatusColor(student.status) }}
                                    >
                                        {getStatusText(student.status)}
                                    </div>
                                </div>
                                
                                <div className="student-content-compact">
                                    <h4 className="student-name-compact">{student.name}</h4>
                                    <p className="student-class-compact">{student.className}</p>
                                    
                                    <div className="student-metrics-compact">
                                        <div className="metric-compact">
                                            <span>Score</span>
                                            <span>{student.averageScore}%</span>
                                        </div>
                                        <div className="metric-compact">
                                            <span>Ready</span>
                                            <span>{student.readinessLevel}%</span>
                                        </div>
                                        <div className="metric-compact">
                                            <span>Assignments</span>
                                            <span>{student.assignmentsCompleted}/{student.totalAssignments}</span>
                                        </div>
                                    </div>

                                    <div className="readiness-bar-compact">
                                        <div 
                                            className="readiness-fill-compact" 
                                            style={{ 
                                                width: `${student.readinessLevel}%`,
                                                backgroundColor: getStatusColor(student.status)
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Column View (larger detailed cards)
                    <div className="students-column">
                        {filteredStudents.map((student) => (
                            <div 
                                key={student.id} 
                                className="student-card column-card"
                                onClick={() => handleStudentClick(student)}
                            >
                                <div className="student-content-expanded">
                                    <div className="student-info-section">
                                        <div className="student-header-expanded">
                                            <div className="student-avatar">
                                                {student.profileImage ? (
                                                    <img src={student.profileImage} alt={student.name} />
                                                ) : (
                                                    <BiUser size={40} />
                                                )}
                                            </div>
                                            <div className="student-basic-info">
                                                <h3 className="student-name">{student.name}</h3>
                                                <p className="student-class">{student.className}</p>
                                                <div 
                                                    className="student-status-badge"
                                                    style={{ backgroundColor: getStatusColor(student.status) }}
                                                >
                                                    {getStatusText(student.status)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="student-contact-expanded">
                                            <div className="contact-item">
                                                <BiEnvelope size={14} />
                                                <span>{student.email}</span>
                                            </div>
                                            {student.phone && student.phone !== 'N/A' && (
                                                <div className="contact-item">
                                                    <BiPhone size={14} />
                                                    <span>{student.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="student-metrics-section">
                                        <div className="metrics-grid">
                                            <div className="metric">
                                                <span className="metric-label">Average Score</span>
                                                <span className="metric-value">{student.averageScore}%</span>
                                            </div>
                                            <div className="metric">
                                                <span className="metric-label">Readiness</span>
                                                <span className="metric-value">{student.readinessLevel}%</span>
                                            </div>
                                            <div className="metric">
                                                <span className="metric-label">Assignments</span>
                                                <span className="metric-value">{student.assignmentsCompleted}/{student.totalAssignments}</span>
                                            </div>
                                            <div className="metric">
                                                <span className="metric-label">Attendance</span>
                                                <span className="metric-value">{student.attendanceRate !== null ? `${student.attendanceRate}%` : 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="readiness-bar-expanded">
                                            <div className="readiness-label">
                                                <BiTrendingUp size={14} />
                                                <span>Readiness Level</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill" 
                                                    style={{ 
                                                        width: `${student.readinessLevel}%`,
                                                        backgroundColor: getStatusColor(student.status)
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="student-footer-expanded">
                                            <div className="last-activity">
                                                <BiCalendar size={12} />
                                                <span>Last active: {student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : 'Never'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Enroll Student Modal */}
            {showEnrollForm && (
                <div className="modal-overlay" onClick={() => { setShowEnrollForm(false); setEnrollSearch(''); setEnrollResults([]); setSelectedStudent(null); setEnrollError(''); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Enroll A Student</h2>
                            <button
                                className="close-btn"
                                onClick={() => { setShowEnrollForm(false); setEnrollSearch(''); setEnrollResults([]); setSelectedStudent(null); setEnrollError(''); }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!selectedStudent) {
                                setEnrollError('Please select a student from the search results.');
                                return;
                            }
                            const formData = new FormData(e.target);
                            const selectedClassId = formData.get('classId');
                            if (!selectedClassId) {
                                setEnrollError('Please select a class.');
                                return;
                            }
                            setEnrolling(true);
                            setEnrollError('');
                            try {
                                await enrollStudentInClass(selectedClassId, selectedStudent.id);
                                setShowEnrollForm(false);
                                setEnrollSearch('');
                                setEnrollResults([]);
                                setSelectedStudent(null);
                                fetchStudentsData();
                            } catch (error) {
                                console.error('Error enrolling student:', error);
                                setEnrollError(`Failed to enroll: ${error.message}`);
                            } finally {
                                setEnrolling(false);
                            }
                        }}>
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Search Student by Name or Email *</label>
                                {selectedStudent ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f0fdf4', border: '1px solid #10b981', borderRadius: '8px' }}>
                                        <BiUser style={{ color: '#10b981', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{selectedStudent.firstName} {selectedStudent.lastName}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedStudent.email}</div>
                                        </div>
                                        <button type="button" onClick={() => { setSelectedStudent(null); setEnrollSearch(''); setEnrollResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '18px', lineHeight: 1 }}>×</button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ position: 'relative' }}>
                                            <BiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input
                                                type="text"
                                                value={enrollSearch}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEnrollSearch(val);
                                                    setEnrollError('');
                                                    clearTimeout(searchDebounceRef.current);
                                                    if (val.trim().length < 2) { setEnrollResults([]); return; }
                                                    setEnrollSearching(true);
                                                    searchDebounceRef.current = setTimeout(async () => {
                                                        const results = await searchStudents(val);
                                                        setEnrollResults(results);
                                                        setEnrollSearching(false);
                                                    }, 300);
                                                }}
                                                placeholder="Type a name or email..."
                                                style={{ paddingLeft: '36px', width: '100%' }}
                                                autoFocus
                                            />
                                        </div>
                                        {enrollSearching && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Searching...</div>}
                                        {!enrollSearching && enrollResults.length > 0 && (
                                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                {enrollResults.map(s => (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => { setSelectedStudent(s); setEnrollResults([]); setEnrollSearch(''); }}
                                                        style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                                    >
                                                        <BiUser style={{ color: '#94a3b8', flexShrink: 0 }} />
                                                        <div>
                                                            <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>{s.firstName} {s.lastName}</div>
                                                            <div style={{ fontSize: '12px', color: '#64748b' }}>{s.email}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {!enrollSearching && enrollSearch.trim().length >= 2 && enrollResults.length === 0 && (
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>No students found.</div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="classId">Assign to Class *</label>
                                <select name="classId" id="classId" required defaultValue={selectedClass?.id ?? ''}>
                                    <option value="">Select a class</option>
                                    {classesData.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {enrollError && (
                                <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{enrollError}</div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => { setShowEnrollForm(false); setEnrollSearch(''); setEnrollResults([]); setSelectedStudent(null); setEnrollError(''); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={enrolling || !selectedStudent}
                                >
                                    <BiPlus style={{ marginRight: '8px' }} />
                                    {enrolling ? 'Enrolling...' : 'Enroll Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Results footer */}
            {filteredStudents.length > 0 && (
                <div className="results-footer">
                    Showing {filteredStudents.length} of {totalStudents} students
                </div>
            )}
        </div>
    );
}