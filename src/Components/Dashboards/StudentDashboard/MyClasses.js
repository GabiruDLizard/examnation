import React, { useState, useEffect } from "react";
import { BiUser, BiCalendar, BiBook, BiGridAlt, BiListUl, BiTrendingUp, BiBullseye } from "react-icons/bi";
import "../MyClasses.css";
import { getStudentClassesWithDetails, getAssignmentsForClass } from './StudentDashboardService.js';
import { getUserIdFromToken } from '../../../utils/tokenUtils';

export default function StudentMyClasses({ studentInfo, onClassClick }) {
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "column"

  // Fetch student classes on component mount
  useEffect(() => {
    fetchStudentClasses();
  }, []);

  const fetchStudentClasses = async () => {
    try {
      setLoading(true);
      const studentId = getUserIdFromToken();

      if (!studentId) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching student classes with details for studentId:', studentId);

      // Use the combined function to get enrollments + class details
      const classesWithDetails = await getStudentClassesWithDetails(studentId);
      
      console.log('Classes with details received:', classesWithDetails);

      // Now fetch assignments for each class
      const classesWithAssignments = await Promise.all(
        classesWithDetails.map(async (classItem) => {
          try {
            console.log(`Fetching assignments for class ${classItem.classId}:`, classItem.name);
            const assignments = await getAssignmentsForClass(classItem.classId);
            
            console.log(`Assignments for class ${classItem.name}:`, assignments);
            
            return {
              ...classItem,
              assignmentIds: assignments.map(assignment => assignment.id),
              actualTotalAssignments: assignments.length,
              assignments: assignments
            };
          } catch (error) {
            console.error(`Error fetching assignments for class ${classItem.classId}:`, error);
            return {
              ...classItem,
              assignmentIds: [],
              actualTotalAssignments: 0,
              assignments: []
            };
          }
        })
      );

      console.log('Classes with assignment data:', classesWithAssignments);

      setClassesData(classesWithAssignments);
      setError(null);
      
    } catch (error) {
      console.error('Error fetching student classes:', error);
      setError(error.message);
      setClassesData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classItem) => {
    console.log('Clicked on class:', classItem.name);
    if (onClassClick) {
      onClassClick(classItem);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="my-classes-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading Your Classes...</h2>
          <p>Fetching your enrolled classes...</p>
        </div>
      </div>
    );
  }

  // Calculate stats from real data (matching teacher dashboard)
  const totalClasses = classesData.length;
  const avgReadiness = totalClasses > 0 
    ? Math.round(classesData.reduce((sum, cls) => sum + (cls.avgReadiness || 0), 0) / totalClasses)
    : 0;
  const totalAssignments = classesData.reduce((sum, cls) => sum + (cls.actualTotalAssignments || 0), 0);

  // Render class card in grid view (matching teacher dashboard)
  const renderClassCard = (classItem) => (
    <div 
      key={classItem.id} 
      className="class-card"
      onClick={() => handleClassClick(classItem)}
    >
      <div className="class-color-bar" style={{ backgroundColor: classItem.color }}></div>
      
      <div className="class-header">
        <div className="class-info">
          <h3 className="class-name">{classItem.name}</h3>
          <p className="class-grade">{classItem.subject} - {classItem.grade}</p>
        </div>
      </div>
      
      <div className="class-content">
        <div className="class-details">
          <div className="detail-item">
            <BiUser style={{ marginRight: '8px' }} />
            {classItem.teacher}
          </div>
          <div className="detail-item">
            <BiCalendar style={{ marginRight: '8px' }} />
            {classItem.schedule}
          </div>
          <div className="detail-item">
            <BiBook style={{ marginRight: '8px' }} />
            {classItem.roomNumber}
          </div>
        </div>

        <div className="class-metrics">
          <div className="metric">
            <span className="metric-label">Readiness</span>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ width: `${classItem.avgReadiness}%`, backgroundColor: classItem.color }}
              ></div>
            </div>
            <span className="metric-value">{classItem.avgReadiness}%</span>
          </div>
          
          <div className="metric" style={{ marginTop: '0.75rem' }}>
            <span className="metric-label">Assignments</span>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ 
                  width: `${classItem.actualTotalAssignments > 0 ? (classItem.completedAssignments / classItem.actualTotalAssignments) * 100 : 0}%`, 
                  backgroundColor: '#10b981' 
                }}
              ></div>
            </div>
            <span className="metric-value">{classItem.completedAssignments}/{classItem.actualTotalAssignments}</span>
          </div>
        </div>
      </div>

      <div className="class-footer">
        <button className="view-class-btn" onClick={(e) => { e.stopPropagation(); handleClassClick(classItem); }}>
          View Class
        </button>
      </div>
    </div>
  );

  // Render class row in column view (matching teacher dashboard)
  const renderClassRow = (classItem) => (
    <tr key={classItem.id} onClick={() => handleClassClick(classItem)}>
      <td>
        <div className="table-class-info">
          <div 
            className="class-color-indicator" 
            style={{ backgroundColor: classItem.color }}
          ></div>
          <div>
            <strong>{classItem.name}</strong>
            <div className="table-class-meta">{classItem.subject} - {classItem.grade}</div>
          </div>
        </div>
      </td>
      <td>{classItem.teacher}</td>
      <td>{classItem.schedule}</td>
      <td>{classItem.roomNumber}</td>
      <td>
        <div className="table-progress">
          <div className="metric-bar small">
            <div 
              className="metric-fill" 
              style={{ width: `${classItem.avgReadiness}%`, backgroundColor: classItem.color }}
            ></div>
          </div>
          <span className="metric-value">{classItem.avgReadiness}%</span>
        </div>
      </td>
      <td>{classItem.completedAssignments}/{classItem.actualTotalAssignments}</td>
      <td>
        <span className={`status ${classItem.status.toLowerCase()}`}>
          {classItem.status}
        </span>
      </td>
    </tr>
  );

  return (
    <div className="my-classes-container">
      {/* Header Stats - Matching teacher dashboard */}
      <div className="classes-header">
        <div className="classes-stats">
          <div className="stat-item">
            <span className="stat-number">{totalClasses}</span>
            <span className="stat-label">Enrolled Classes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{totalAssignments}</span>
            <span className="stat-label">Total Assignments</span>
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
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Classes Content */}
      {classesData.length === 0 ? (
        <div className="empty-state">
          <BiBook size={64} />
          <h2>No Classes Found</h2>
          <p>You're not enrolled in any classes yet.</p>
          <p>Contact your teacher or administrator to get enrolled.</p>
        </div>
      ) : (
        <div className="classes-content">
          {viewMode === 'grid' ? (
            <div className="classes-grid">
              {classesData.map(renderClassCard)}
            </div>
          ) : (
            <div className="classes-table-wrapper">
              <table className="classes-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Teacher</th>
                    <th>Schedule</th>
                    <th>Room</th>
                    <th>Readiness</th>
                    <th>Assignments</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classesData.map(renderClassRow)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}