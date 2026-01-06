import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { BiLogOut, BiCog, BiBrain, BiFile, BiClipboard, BiBarChart, BiGroup, BiHome } from "react-icons/bi";
import "../TeacherDashboard.css";

// Import services
import { getTeacherInfo, getTeacherClasses, getAllEnrolledStudentInfo } from "./TeacherDashboardService";

// Import the new components
import MyClasses from "./MyClasses";
import ClassOverview from "./ClassOverview";
import StudentView from "./StudentView";
import Assignments from "./Assignments";

const token = localStorage.getItem('token');

const lineData = [
  { session: 1, readiness: 12 },
  { session: 3, readiness: 18 },
  { session: 6, readiness: 22 },
  { session: 9, readiness: 28 },
  { session: 12, readiness: 35 },
  { session: 15, readiness: 45 },
  { session: 18, readiness: 55 },
  { session: 20, readiness: 72 }
];

const students = [
  { name: "Abigall", readiness: 80, improvement: 12, attempts: 158 },
  { name: "Grace", readiness: 85, improvement: 8, attempts: 22 },
  { name: "Noah", readiness: 82, improvement: 6, attempts: 23 },
  { name: "Victoria", readiness: 79, improvement: 4, attempts: 18 },
  { name: "Ethan", readiness: 75, improvement: 2, attempts: 23 },
];

const topics = ["Algebra", "Geometry", "Statistics", "Trigonometry", "Number Theory"];
const heatmap = [
  [0.6, 0.5, 0.4, 0.3, 0.2],
  [0.3, 0.5, 0.4, 0.6, 0.7],
  [0.5, 0.6, 0.7, 0.5, 0.4],
  [0.2, 0.3, 0.6, 0.7, 0.6],
  [0.4, 0.5, 0.6, 0.5, 0.3]
];

function heatColor(v) {
  const hue = 220 - v * 140;
  return `hsl(${hue}deg 70% ${30 + v*30}%)`;
}

export default function TeacherDashboard() {
  const [activePage, setActivePage] = useState('overview');
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null); 
  const [currentView, setCurrentView] = useState('main'); // 'main', 'class-overview', 'students', 'analytics', 'assignments'
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [loadingStudentCount, setLoadingStudentCount] = useState(true);

  // Add this new state variable for storing actual student data
  const [actualStudentsData, setActualStudentsData] = useState([]);
  const [loadingStudentsData, setLoadingStudentsData] = useState(true);

  const navigate = useNavigate();

  // Navigation handlers
  const handleClassClick = (classItem) => {
    console.log('Class clicked:', classItem.name);
    setSelectedClass(classItem);
    setCurrentView('class-overview'); // Set to class overview
  };

  const handleNavigateFromOverview = (section) => {
    console.log('🎯 Navigating to:', section);
    
    // Special case: if navigating to assignments, switch to main assignments page
    if (section === 'assignments') {
      setActivePage('assignments');     // Switch to assignments page
      setCurrentView('main');          // Go to main view
      setSelectedClass(null);          // Clear selected class
    } else if(section === 'analytics') {
      setActivePage('insights');
      setCurrentView('main');          // Go to analytics view
      setSelectedClass(null);          // Clear selected class
    } else {
      // For other sections (students), stay in class context
      setCurrentView(section);         // Changes view to 'students', etc.
    }
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setCurrentView('main'); // Go back to main dashboard
  };

  const handleBackToOverview = () => {
    setCurrentView('class-overview'); // Go back to class overview
  };

  // Clean up page navigation
  const handlePageChange = (page) => {
    setActivePage(page);
    setCurrentView('main');
    setSelectedClass(null);
  };
   
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch teacher data...');
        
        const data = await getTeacherInfo();
        console.log('Teacher data received in component:', data);
        
        setTeacherInfo(data);
        setError(null);

        // Calculate total students after getting teacher info
        await calculateTotalStudents();
        
      } catch (err) {
        setError('Failed to load teacher information');
        console.error('Error loading teacher data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTeacherData();
    } else {
      setError('No authentication token found');
      setLoading(false);
    }
  }, [token]);

  // Function to calculate total students
  const calculateTotalStudents = async () => {
    try {
      setLoadingStudentCount(true);
      setLoadingStudentsData(true);
      console.log('📊 Starting to calculate unique students...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get teacher ID from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const teacherId = payload.sub;

      // Get all classes for this teacher
      const classes = await getTeacherClasses(teacherId);
      console.log('📚 Found classes:', classes.map(c => c.name));

      // Use a Set to track unique student IDs and Map to store student data
      const uniqueStudentIds = new Set();
      const studentDataMap = new Map();
      let totalEnrollments = 0;

      // For each class, get the enrolled students
      for (const classItem of classes) {
        try {
          const studentsInClass = await getAllEnrolledStudentInfo(classItem.id);
          const studentCount = studentsInClass.length;
          totalEnrollments += studentCount;
          
          // Add each student ID to the Set and collect their data
          studentsInClass.forEach(([studentInfo, studentProgress]) => {
            const studentId = studentInfo.id;
            uniqueStudentIds.add(studentId);
            
            // If we haven't seen this student before, or if this class has better data, store it
            if (!studentDataMap.has(studentId) || 
                (studentProgress && (!studentDataMap.get(studentId).progress || 
                 studentDataMap.get(studentId).progress.averageScore < studentProgress.averageScore))) {
              
              studentDataMap.set(studentId, {
                id: studentId,
                name: `${studentInfo.firstName} ${studentInfo.lastName}`,
                email: studentInfo.email,
                className: classItem.name,
                readiness: studentProgress?.readinessLevel || Math.floor(Math.random() * 40 + 60),
                averageScore: studentProgress?.averageScore || Math.floor(Math.random() * 30 + 70),
                improvement: studentProgress?.improvement || Math.floor(Math.random() * 15 + 1),
                attempts: studentProgress?.totalAttempts || studentProgress?.assignmentsCompleted || Math.floor(Math.random() * 50 + 10),
                attendanceRate: studentProgress?.attendanceRate || Math.floor(Math.random() * 20 + 80),
                lastActivity: studentProgress?.lastActivity || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                progress: studentProgress
              });
            }
            
            console.log(`👤 Student ID ${studentId} (${studentInfo.firstName} ${studentInfo.lastName}) in class "${classItem.name}"`);
          });
          
          console.log(`👥 Class "${classItem.name}": ${studentCount} enrollments`);
        } catch (classError) {
          console.error(`❌ Error getting students for class ${classItem.name}:`, classError);
          // Continue with other classes even if one fails
        }
      }

      const uniqueStudentCount = uniqueStudentIds.size;
      
      // Convert Map to Array and sort by readiness/performance
      const studentsArray = Array.from(studentDataMap.values())
        .sort((a, b) => {
          // Sort by readiness first, then by average score
          if (b.readiness !== a.readiness) {
            return b.readiness - a.readiness;
          }
          return b.averageScore - a.averageScore;
        });
      
      console.log(`📊 Summary:`);
      console.log(`   - Total enrollments: ${totalEnrollments}`);
      console.log(`   - Unique students: ${uniqueStudentCount}`);
      console.log(`   - Unique student IDs: [${Array.from(uniqueStudentIds).join(', ')}]`);
      console.log(`   - Student ranking data:`, studentsArray.map(s => `${s.name} (${s.readiness}%)`));
      
      if (totalEnrollments > uniqueStudentCount) {
        console.log(`🔄 Found ${totalEnrollments - uniqueStudentCount} duplicate enrollments (students in multiple classes)`);
      }
      
      setTotalStudentsCount(uniqueStudentCount);
      setActualStudentsData(studentsArray);
      
    } catch (error) {
      console.error('❌ Error calculating unique students:', error);
      setTotalStudentsCount(0);
      setActualStudentsData([]);
    } finally {
      setLoadingStudentCount(false);
      setLoadingStudentsData(false);
    }
  };

  // Function to get teacher display name
  const getTeacherDisplayName = () => {
    if (loading) return 'Loading...';
    if (error || !teacherInfo) return 'Teacher';
    
    if (teacherInfo.firstName && teacherInfo.lastName) {
      return `${teacherInfo.firstName} ${teacherInfo.lastName}`;
    } else if (teacherInfo.first_name && teacherInfo.last_name) {
      return `${teacherInfo.first_name} ${teacherInfo.last_name}`;
    } else if (teacherInfo.name) {
      return teacherInfo.name;
    } else if (teacherInfo.username) {
      return teacherInfo.username;
    } else {
      return 'Teacher';
    }
  };

  // Function to render different page content
  const renderPageContent = () => {
    console.log('🔍 RENDER DEBUG:', { currentView, activePage, selectedClass: selectedClass?.name });

    // ===== CLASS-SPECIFIC VIEWS (HIGHEST PRIORITY) =====
    if (selectedClass && currentView === 'students') {
        console.log('✅ Rendering StudentView');
        return (
            <StudentView 
                teacherInfo={teacherInfo}
                selectedClass={selectedClass}
                onBack={handleBackToOverview}
            />
        );
    }

    if (selectedClass && currentView === 'class-overview') {
        console.log('✅ Rendering ClassOverview');
        return (
            <ClassOverview 
                teacherInfo={teacherInfo} 
                selectedClass={selectedClass} 
                onBack={handleBackToClasses} 
                onNavigate={handleNavigateFromOverview}
            />
        );
    }

    if (selectedClass && currentView === 'analytics') {
        console.log('✅ Rendering Analytics');
        return (
            <div className="coming-soon">
                <button onClick={handleBackToOverview} className="back-btn">← Back to Overview</button>
                <h2>Class Analytics - Coming Soon!</h2>
                <p>Analytics for {selectedClass.name}</p>
            </div>
        );
    }

    if (selectedClass && currentView === 'assignments') {
        console.log('✅ Rendering Assignments');
        return (
            <div className="coming-soon">
                <button onClick={handleBackToOverview} className="back-btn">← Back to Overview</button>
                <h2>Assignments - Coming Soon!</h2>
                <p>Assignment management for {selectedClass.name}</p>
            </div>
        );
    }


    if (currentView === 'main') {
        console.log('✅ Rendering main dashboard page:', activePage);
        switch (activePage) {
            case 'classes':
                return <MyClasses teacherInfo={teacherInfo} onClassClick={handleClassClick} />;
            case 'insights':
                return <div className="coming-soon">Insights page coming soon</div>;
            case 'assignments':
                return <div className="coming-soon"><Assignments /></div>;
            case 'ta':
                return <div className="coming-soon">MY TA page coming soon...</div>;
            case 'reports':
                return <div className="coming-soon">Reports page coming soon...</div>;
            case 'settings':
                return <div className="coming-soon">Settings page coming soon...</div>;
            default:
                return renderOverviewContent();
        }
    }

    // ===== FALLBACK =====
    console.log('⚠️ Fallback render - this should not happen');
    return <div>Unknown view state</div>;
  };

  // Overview page content 
  const renderOverviewContent = () => (
    <>
      <section className="td-kpis">
        <div className="kpi-card">
          <div className="kpi-title">Avg. Readiness</div>
          <div className="kpi-value">
            {loadingStudentsData ? (
              <div className="loading-indicator">...</div>
            ) : (
              actualStudentsData.length > 0 
                ? Math.round(actualStudentsData.reduce((sum, s) => sum + s.readiness, 0) / actualStudentsData.length) + '%'
                : '0%'
            )}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total Students</div>
          <div className="kpi-value">
            {loadingStudentCount ? (
              <div className="loading-indicator">...</div>
            ) : (
              totalStudentsCount
            )}
          </div>
          {!loadingStudentCount && (
            <div className="kpi-subtitle">Unique students across all classes</div>
          )}
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Weakest Topic</div>
          <div className="kpi-value">
            {loadingStudentsData ? (
              <div className="loading-indicator">...</div>
            ) : (
              'Algebra' // You can make this dynamic later based on actual data
            )}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Avg. Session Time (min)</div>
          <div className="kpi-value">23</div>
        </div>
      </section>

      <section className="td-grid">
        <div className="panel panel-large">
          <div className="panel-title">Class Performance</div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={lineData}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="session" tick={{ fill: "#cfd8e3" }} />
                <YAxis tick={{ fill: "#cfd8e3" }} />
                <Tooltip />
                <Line type="monotone" dataKey="readiness" stroke="#4ea8ff" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel panel-small">
          <div className="panel-title">Topic Mastery</div>
          <div className="heatmap">
            <div className="heatmap-label-column">
              {topics.map((t) => <div key={t} className="heatmap-label">{t}</div>)}
            </div>
            <div className="heatmap-grid">
              {heatmap.map((row, rIdx) => (
                <div key={rIdx} className="heatmap-row">
                  {row.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className="heatmap-cell"
                      style={{ background: heatColor(cell) }}
                      title={`${topics[rIdx]} - ${(cell*100).toFixed(0)}%`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel panel-medium">
          <div className="panel-title">Student Ranking</div>
          {loadingStudentsData ? (
            <div className="loading-students">
              <div className="loading-indicator">Loading students...</div>
            </div>
          ) : actualStudentsData.length > 0 ? (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Readiness</th>
                  <th>Improvement</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {actualStudentsData.slice(0, 5).map((student, index) => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-info">
                        <div className="student-name">{student.name}</div>
                        <div className="student-rank">#{index + 1}</div>
                      </div>
                    </td>
                    <td className="class-name">{student.className}</td>
                    <td className="readiness-cell">
                      <span className="readiness-value">{student.readiness}%</span>
                    </td>
                    <td>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${Math.min(student.improvement * 6, 100)}%`,
                            backgroundColor: student.improvement >= 10 ? '#10b981' : 
                                           student.improvement >= 5 ? '#f59e0b' : '#ef4444'
                          }} 
                        />
                      </div>
                      <span className="improvement-text">+{student.improvement}%</span>
                    </td>
                    <td className="attempts-cell">{student.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-students">
              <p>No students found</p>
            </div>
          )}
          {actualStudentsData.length > 5 && (
            <div className="view-all-students">
              <button 
                className="view-all-btn"
                onClick={() => handlePageChange('classes')}
              >
                View all {actualStudentsData.length} students →
              </button>
            </div>
          )}
        </div>

        <div className="panel panel-medium">
          <div className="panel-title">AI Insights Summary</div>
          <div className="ai-text">
            {loadingStudentsData ? (
              'Analyzing student performance...'
            ) : actualStudentsData.length > 0 ? (
              <>
                Your students averaged <strong>{Math.round(actualStudentsData.reduce((sum, s) => sum + s.readiness, 0) / actualStudentsData.length)}% readiness</strong> this month. 
                Top performer is <strong>{actualStudentsData[0]?.name}</strong> with {actualStudentsData[0]?.readiness}% readiness.
              </>
            ) : (
              'No student data available for analysis.'
            )}
          </div>
          <div className="ai-actions">
            <button className="ai-btn">Generate new practice quiz</button>
            <button className="ai-btn ghost">Send feedback to students</button>
          </div>
        </div>
      </section>
    </>
  );

  // Get page title based on active page and current view
  const getPageTitle = () => {
    if (currentView === 'class-overview' && selectedClass) {
      return `${selectedClass.name} - Overview`;
    }
    if (currentView === 'students' && selectedClass) {
      return `${selectedClass.name} - Students`;
    }
    if (currentView === 'analytics' && selectedClass) {
      return `${selectedClass.name} - Analytics`;
    }
    if (currentView === 'assignments' && selectedClass) {
      return `${selectedClass.name} - Assignments`;
    }
    
    switch (activePage) {
      case 'classes': return 'My Classes';
      case 'insights': return 'Insights';
      case 'assignments': return 'Assignments';
      case 'ta': return 'MY TA';
      case 'reports': return 'Reports';
      case 'settings': return 'Settings';
      default: return 'Teacher Dashboard';
    }
  };

  return (
    <div className="td-root">
      <aside className="td-sidebar">
        <div className="td-brand">Examnation</div>
        <nav className="td-nav">
          <button 
            className={`td-nav-item ${activePage === 'overview' ? 'active' : ''}`}
            onClick={() => handlePageChange('overview')}
          >
            <BiHome style={{ marginRight: '8px', fontSize: '18px'}} />
            Overview
          </button>
          <button 
            className={`td-nav-item ${activePage === 'classes' ? 'active' : ''}`}
            onClick={() => handlePageChange('classes')}
          >
            <BiGroup style={{ marginRight: '8px', fontSize: '18px'}} />
            My Classes
          </button>
          <button 
            className={`td-nav-item ${activePage === 'insights' ? 'active' : ''}`}
            onClick={() => handlePageChange('insights')}
          >
            <BiBarChart style={{ marginRight: '8px', fontSize: '18px'}} />
            Insights
          </button>
          <button 
            className={`td-nav-item ${activePage === 'assignments' ? 'active' : ''}`}
            onClick={() => handlePageChange('assignments')}
          >
            <BiClipboard style={{ marginRight: '8px', fontSize: '18px'}} />
            Assignments
          </button>
          <button 
            className={`td-nav-item ${activePage === 'ta' ? 'active' : ''}`}
            onClick={() => handlePageChange('ta')}
          >
            <BiBrain style={{ marginRight: '8px', fontSize: '18px'}}/>
            MY TA
          </button>
          <button 
            className={`td-nav-item ${activePage === 'reports' ? 'active' : ''}`}
            onClick={() => handlePageChange('reports')}
          >
            <BiFile style={{ marginRight: '8px', fontSize: '18px'}} />
            Reports
          </button>
          <button 
            className={`td-nav-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => handlePageChange('settings')}
          >
            <BiCog style={{ marginRight: '8px', fontSize: '18px'}} />
            Settings
          </button>
        </nav>
        
        {/* Logout button positioned at bottom of sidebar */}
        <div className="td-sidebar-bottom">
          <button
            className="td-nav-item logout-btn"
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
          >
            <BiLogOut style={{ marginRight: '8px', fontSize: '18px'}} />
            Logout
          </button>
        </div>
      </aside>

      <main className="td-main">
        <header className="td-header">
          <h1>{getPageTitle()}</h1>
          <div className="td-user">{getTeacherDisplayName()}</div>
        </header>

        {/* ONLY RENDER PAGE CONTENT - NO DUPLICATE COMPONENTS */}
        {renderPageContent()}
      </main>
    </div>
  );
}

