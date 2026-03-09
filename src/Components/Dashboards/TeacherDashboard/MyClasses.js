import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { BiPlus, BiEdit, BiTrash, BiUser, BiCalendar, BiBook, BiGridAlt, BiListUl } from "react-icons/bi";
import "../MyClasses.css";
import { getTeacherClasses, createTeacherClass, deleteTeacherClass, getClassEnrollments, getAssignmentsForClass } from "./TeacherDashboardService";
import { getUserIdFromToken } from '../../../utils/tokenUtils';

export default function MyClasses({ teacherInfo, onClassClick }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "column"
  const [assignments, setAssignments] = useState({});

  // Color options for the picker
  const colorOptions = [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Yellow
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#84cc16", // Lime
    "#ec4899", // Pink
    "#6b7280", // Gray
    "#14b8a6", // Teal
    "#a855f7"  // Violet
  ];

  // Fetch teacher classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);
  useEffect(() => {
    const fetchAllAssignments = async () => {
      if (classesData.length > 0) {
        const assignmentPromises = classesData.map(async (classItem) => {
          try {
            const classAssignments = await getAssignmentsForClass(classItem.id);
            return { classId: classItem.id, assignments: classAssignments || [] };
          } catch (error) {
            console.error(`Error fetching assignments for class ${classItem.id}:`, error);
            return { classId: classItem.id, assignments: [] };
          }
        });
        
        const results = await Promise.all(assignmentPromises);
        const assignmentsMap = {};
        results.forEach(({ classId, assignments: classAssignments }) => {
          assignmentsMap[classId] = classAssignments;
        });
        
        setAssignments(assignmentsMap);
      }
    };
    
    fetchAllAssignments();
  }, [classesData]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const teacherId = getUserIdFromToken();
      if (!teacherId) {
        throw new Error('No authentication token found');
      }

      const classes = await getTeacherClasses();
      
      // Transform the API response to match your component's expected format
      const transformedClasses = await Promise.all(classes.map(async (classItem) => {
        let studentcount = 0;
        try {
          const enrolls = await getClassEnrollments(classItem.id);
          studentcount = enrolls ? enrolls.length : 0;
          console.log(`Class ${classItem.name} ID ${classItem.id} has ${studentcount} students.`);
          studentcount = Array.isArray(enrolls) ? enrolls.length : 0;
          console.log(studentcount);
        } catch (error) {
          console.error('Error fetching class enrollments:', error);
          studentcount = 0;
        }

        return {
          id: classItem.id,
          name: classItem.name,
          subject: classItem.subject,
          grade: classItem.gradeLevel,
          students: Number(studentcount) || 0,
          schedule: classItem.schedule,
          avgReadiness: Math.round(classItem.avgReadiness || 0),
          activeAssignments: classItem.activeAssignments || 0,
          color: classItem.color || "#3b82f6",
          roomNumber: classItem.roomNumber,
          maxStudents: classItem.maxStudents,
          status: classItem.status,
          term: classItem.term
        };
      }));

      setClassesData(transformedClasses);
      setError(null);


      
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      setError(error.message);
      
      // Fallback to empty array if API fails
      setClassesData([]);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateClass = async (formData) => {
    try {
      await createTeacherClass(formData);
      await fetchClasses(); // Refresh the list
      setShowCreateForm(false);
      setSelectedColor("#3b82f6"); // Reset color picker
      toast.success('Class created successfully!');
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Error creating class: ' + error.message);
    }
  };

  const handleClassClick = (classItem) => {
    console.log('Clicked on class:', classItem.name);
    // Call the parent function to switch views
    if (onClassClick) {
      onClassClick(classItem);
    }
  };

  const handleEditClass = (e, classItem) => {
    e.stopPropagation();
    console.log('Edit class:', classItem.name);
    toast.info(`Editing ${classItem.name}...`);
  };

  const handleDeleteClass = async (e, classItem) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${classItem.name}?`)) {
      try {
        await deleteTeacherClass(classItem.id);
        await fetchClasses(); // Refresh the list
        toast.success(`${classItem.name} deleted successfully!`);
      } catch (error) {
        console.error('Error deleting class:', error);
        toast.error('Error deleting class: ' + error.message);
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="my-classes-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading Your Classes...</h2>
          <p>Fetching class information from the server...</p>
        </div>
      </div>
    );
  }

  // Calculate stats from real data
  const totalClasses = classesData.length;
  const totalStudents = classesData.reduce((sum, cls) => {
    const students = Number(cls.students) || 0; // Convert to number, default to 0 if invalid
    return sum + students;
  }, 0);
  const avgReadiness = totalClasses > 0 
    ? Math.round(classesData.reduce((sum, cls) => sum + cls.avgReadiness, 0) / totalClasses)
    : 0;

  return (
    <div className="my-classes-container">
      {/* Header Stats - Now using real data */}
      <div className="classes-header">
        <div className="classes-stats">
          <div className="stat-item">
            <span className="stat-number">{totalClasses}</span>
            <span className="stat-label">Total Classes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{totalStudents}</span>
            <span className="stat-label">Total Students</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{avgReadiness}%</span>
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
            onClick={() => setShowCreateForm(true)}
          >
            <BiPlus style={{ marginRight: '8px' }} />
            Create New Class
          </button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="error-notification">
          ⚠️ Error: {error}
          <button onClick={fetchClasses} className="retry-link">Try Again</button>
        </div>
      )}

      {/* Classes Display - Dynamic based on view mode */}
      <div className={`classes-container ${viewMode}-view`}>
        {classesData.length === 0 ? (
          <div className="empty-state">
            <h3>No Classes Found</h3>
            <p>You haven't created any classes yet.</p>
            <button 
              className="create-first-class-btn"
              onClick={() => setShowCreateForm(true)}
            >
              <BiPlus /> Create Your First Class
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View (4x4 smaller cards)
          <div className="classes-grid">
            {classesData.map((classItem) => (
              <div 
                key={classItem.id} 
                className="class-card grid-card"
                onClick={() => handleClassClick(classItem)}
              >
                <div className="class-header">
                  <div className="class-color-bar" style={{ backgroundColor: classItem.color }}></div>
                  <div className="class-actions">
                    <button 
                      className="action-btn edit"
                      onClick={(e) => handleEditClass(e, classItem)}
                      title="Edit Class"
                    >
                      <BiEdit />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={(e) => handleDeleteClass(e, classItem)}
                      title="Delete Class"
                    >
                      <BiTrash />
                    </button>
                  </div>
                </div>
                
                <div className="class-content">
                  <h3 className="class-name"><b>{classItem.name}</b></h3>
                  <p className="class-grade"><b>{classItem.grade} • {classItem.subject}</b></p>
                  
                  <div className="class-stats-compact">
                    <div className="stat-compact">
                      <BiUser />
                      <span>{classItem.students}</span>
                    </div>
                    <div className="stat-compact">
                      <BiBook />
                      <span>{(assignments[classItem.id] || []).length}</span>
                    </div>
                  </div>

                  <div className="readiness-compact">
                    <span className="readiness-label">Readiness: {classItem.avgReadiness}%</span>
                    <div className="readiness-bar-compact">
                      <div 
                        className="readiness-fill-compact" 
                        style={{ 
                          width: `${classItem.avgReadiness}%`,
                          backgroundColor: classItem.color 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Column View (larger detailed cards)
          <div className="classes-column">
            {classesData.map((classItem) => (
              <div 
                key={classItem.id} 
                className="class-card column-card"
                onClick={() => handleClassClick(classItem)}
              >
                <div className="class-header">
                  <div className="class-color-bar" style={{ backgroundColor: classItem.color }}></div>
                  <div className="class-actions">
                    <button 
                      className="action-btn edit"
                      onClick={(e) => handleEditClass(e, classItem)}
                      title="Edit Class"
                    >
                      <BiEdit />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={(e) => handleDeleteClass(e, classItem)}
                      title="Delete Class"
                    >
                      <BiTrash />
                    </button>
                  </div>
                </div>
                
                <div className="class-content">
                  <div className="class-info-section">
                    <h3 className="class-name"><b>{classItem.name}</b></h3>
                    <p className="class-grade"><b>{classItem.grade} • {classItem.subject}</b></p>
                    
                    <div className="class-details-expanded">
                      <div className="detail-item">
                        <BiUser style={{ marginRight: '6px' }} />
                        <span>{classItem.students} Students</span>
                      </div>
                      <div className="detail-item">
                        <BiCalendar style={{ marginRight: '6px' }} />
                        <span>{classItem.schedule}</span>
                      </div>
                      <div className="detail-item">
                        <BiBook style={{ marginRight: '6px' }} />
                        <span>{(assignments[classItem.id] || []).length} Active Assignments</span>
                      </div>
                    </div>
                  </div>

                  <div className="class-metrics-section">
                    <div className="metric">
                      <span className="metric-label">Avg. Readiness</span>
                      <div className="metric-bar">
                        <div 
                          className="metric-fill" 
                          style={{ 
                            width: `${classItem.avgReadiness}%`,
                            backgroundColor: classItem.color 
                          }}
                        ></div>
                      </div>
                      <span className="metric-value">{classItem.avgReadiness}%</span>
                    </div>
                  </div>

                  <div className="class-footer">
                    <button 
                      className="view-class-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClassClick(classItem);
                      }}
                    >
                      View Class Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Form Modal with Color Picker */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Class</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const classData = {
                name: formData.get('name'),
                subject: formData.get('subject'),
                gradeLevel: formData.get('gradeLevel'),
                schedule: formData.get('schedule'),
                roomNumber: formData.get('roomNumber'),
                maxStudents: parseInt(formData.get('maxStudents')) || 30,
                color: selectedColor // Add the selected color
              };
              
              if (!classData.name || !classData.subject || !classData.gradeLevel || !classData.schedule) {
                toast.warn('Please fill in all required fields');
                return;
              }
              
              handleCreateClass(classData);
            }}>
              <input 
                type="text" 
                name="name"
                placeholder="Class Name" 
                required 
              />
              <select name="gradeLevel" required>
                <option value="">Select Grade Level</option>
                <option value="7th Grade">7th Grade</option>
                <option value="8th Grade">8th Grade</option>
                <option value="9th Grade">9th Grade</option>
                <option value="10th Grade">10th Grade</option>
                <option value="11th Grade">11th Grade</option>
                <option value="12th Grade">12th Grade</option>
              </select>
              <select name="subject" required>
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Biology">Biology</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Physics">Physics</option>
              </select>
              <input 
                type="text" 
                name="schedule"
                placeholder="Schedule (e.g., Mon, Wed, Fri - 8:00 AM)" 
                required 
              />
              <input 
                type="text" 
                name="roomNumber"
                placeholder="Room Number" 
              />
              <input 
                type="number" 
                name="maxStudents"
                placeholder="Max Students" 
                min="1" 
                max="50"
                defaultValue="30"
              />
              
              {/* Color Picker */}
              <div className="color-picker-section">
                <label>Choose Class Color:</label>
                <div className="color-picker-preview">
                  <div 
                    className="selected-color-preview"
                    style={{ backgroundColor: selectedColor }}
                  ></div>
                  <span>Selected: {selectedColor}</span>
                </div>
                <div className="color-options">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <button type="submit">Create Class</button>
              <button type="button" onClick={() => {
                setShowCreateForm(false);
                setSelectedColor("#3b82f6"); // Reset color when closing
              }}>Close</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}