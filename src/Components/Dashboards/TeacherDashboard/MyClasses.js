import React, { useState } from "react";
import { BiPlus, BiEdit, BiTrash, BiUser, BiCalendar, BiBook } from "react-icons/bi";
import "../../../Styling/Dashboards/MyClasses.css";

const classesData = [
  {
    id: 1,
    name: "Algebra I - Period 1",
    subject: "Mathematics",
    grade: "9th Grade",
    students: 24,
    schedule: "Mon, Wed, Fri - 8:00 AM",
    avgReadiness: 78,
    activeAssignments: 3,
    color: "#3b82f6"
  },
  {
    id: 2,
    name: "Geometry - Period 3",
    subject: "Mathematics", 
    grade: "10th Grade",
    students: 28,
    schedule: "Tue, Thu - 10:30 AM",
    avgReadiness: 72,
    activeAssignments: 2,
    color: "#10b981"
  },
  {
    id: 3,
    name: "Pre-Calculus - Period 5",
    subject: "Mathematics",
    grade: "11th Grade", 
    students: 19,
    schedule: "Mon, Wed, Fri - 1:15 PM",
    avgReadiness: 85,
    activeAssignments: 4,
    color: "#f59e0b"
  }
];

export default function MyClasses() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleClassClick = (classItem) => {
    console.log('Clicked on class:', classItem.name);
    // TODO: Navigate to class detail page or show class details
    alert(`Opening ${classItem.name} details...`);
  };

  const handleEditClass = (e, classItem) => {
    e.stopPropagation(); // Prevent card click
    console.log('Edit class:', classItem.name);
    // TODO: Open edit modal
    alert(`Editing ${classItem.name}...`);
  };

  const handleDeleteClass = (e, classItem) => {
    e.stopPropagation(); // Prevent card click
    if (window.confirm(`Are you sure you want to delete ${classItem.name}?`)) {
      console.log('Delete class:', classItem.name);
      // TODO: Delete class logic
      alert(`${classItem.name} deleted!`);
    }
  };

  return (
    <div className="my-classes-container">
      {/* Header Stats */}
      <div className="classes-header">
        <div className="classes-stats">
          <div className="stat-item">
            <span className="stat-number">3</span>
            <span className="stat-label">Total Classes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">71</span>
            <span className="stat-label">Total Students</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">78%</span>
            <span className="stat-label">Avg. Readiness</span>
          </div>
        </div>
        <button 
          className="create-class-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <BiPlus style={{ marginRight: '8px' }} />
          Create New Class
        </button>
      </div>
      <div className="classes-grid">
        {classesData.map((classItem) => (
          <div 
            key={classItem.id} 
            className="class-card"
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
              <h3 className="class-name">{classItem.name}</h3>
              <p className="class-grade">{classItem.grade} • {classItem.subject}</p>
              
              <div className="class-details">
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
                  <span>{classItem.activeAssignments} Active Assignments</span>
                </div>
              </div>

              <div className="class-metrics">
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
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Class</h2>
            <input type="text" placeholder="Class Name" />
            <select>
                <option value="">Select Grade Level</option>
                <option value="7th">7th Grade</option>
                <option value="8th">8th Grade</option>
                <option value="9th">9th Grade</option>
                <option value="10th">10th Grade</option>
                <option value="11th">11th Grade</option>
                <option value="12th">12th Grade</option>
            </select>
            <select>
              <option value="">Select Subject</option>
              <option value="math">Mathematics</option>
              <option value="english">English</option>
              <option value="history">History</option>
            </select>
            <input type="text" placeholder="Schedule" />
            <p>Form coming soon...</p>
            <button onClick={() => setShowCreateForm(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}