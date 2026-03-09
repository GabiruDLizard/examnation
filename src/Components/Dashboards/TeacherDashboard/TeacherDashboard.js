import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { BiLogOut, BiCog, BiBrain, BiFile, BiClipboard, BiBarChart, BiGroup, BiHome, BiMenu, BiX } from "react-icons/bi";
import "../TeacherDashboard.css";

// Import services
import { getTeacherInfo, getTeacherClasses, getAllEnrolledStudentInfo, getTeacherReadinessChartData } from "./TeacherDashboardService";
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboardNav } from '../../../hooks/useDashboardNav';

// Import chart components
import TeacherReadinessChart from "../Charts/TeacherReadinessChart";
import { generateClassColors, calculateTeacherStats } from "../Charts/TeacherReadinessLogic";

// Import the components
import MyClasses from "./MyClasses";

import ClassOverview from "./ClassOverview";
import StudentView from "./StudentView";
import Assignments from "./Assignments";
import MyTA from "../TAPage/TAPageTeacher";
import Settings from "../../Settings/Settings";


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
  const { userId, authLoading, logout } = useAuth();
  const {
    activePage, setActivePage,
    currentView, setCurrentView,
    selectedClass, setSelectedClass,
    mobileMenuOpen,
    handleNavClick,
    handleClassClick,
    handleBackToClasses,
    handleBackToOverview,
    toggleMobileMenu,
  } = useDashboardNav();

  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [loadingStudentCount, setLoadingStudentCount] = useState(true);
  const [readinessChartData, setReadinessChartData] = useState([]);
  const [classColors, setClassColors] = useState({});
  const [teacherStats, setTeacherStats] = useState({});
  const [actualStudentsData, setActualStudentsData] = useState([]);
  const [loadingStudentsData, setLoadingStudentsData] = useState(true);

  const navigate = useNavigate();

  const handleNavigateFromOverview = (section) => {
    // Special case: if navigating to assignments, switch to main assignments page
    if (section === 'assignments') {
      setActivePage('assignments');     // Switch to assignments page
      setCurrentView('main');          // Go to main view
      // Keep the selectedClass instead of clearing it - this will pass the class context
      // setSelectedClass(null);       // Comment out or remove this line
    } else if(section === 'analytics') {
      setActivePage('insights');
      setCurrentView('main');          // Go to analytics view
      setSelectedClass(null);          // Clear selected class
    } else {
      // For other sections (students), stay in class context
      setCurrentView(section);         // Changes view to 'students', etc.
    }
  };

  // Clean up page navigation
  const handlePageChange = (page) => {
    setActivePage(page);
    setCurrentView('main');
    setSelectedClass(null);
  };
   
  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      navigate('/login');
      return;
    }

    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        
        const data = await getTeacherInfo();
        
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

    fetchTeacherData();
  }, [navigate, userId, authLoading]);

  // Function to calculate total students
  const calculateTotalStudents = async () => {
    try {
      setLoadingStudentCount(true);
      setLoadingStudentsData(true);
      
      if (!userId) {
        throw new Error('No authentication token found');
      }

      // Get all classes for this teacher
      const classes = await getTeacherClasses();


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
                readiness: studentProgress?.readinessLevel ?? studentProgress?.score ?? 0,
                averageScore: studentProgress?.averageScore ?? 0,
                improvement: studentProgress?.improvement ?? null,
                attempts: studentProgress?.totalAttempts ?? studentProgress?.assignmentsCompleted ?? 0,
                attendanceRate: studentProgress?.attendanceRate ?? null,
                lastActivity: studentProgress?.lastActivity ?? null,
                progress: studentProgress
              });
            }
            
            console.log(`👥 Class "${classItem.name}": ${studentCount} enrollments`);
          });
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
      
      if (totalEnrollments > uniqueStudentCount) {
        console.log(`🔄 Found ${totalEnrollments - uniqueStudentCount} duplicate enrollments (students in multiple classes)`);
      }
      
      setTotalStudentsCount(uniqueStudentCount);
      setActualStudentsData(studentsArray);
      
      // Generate chart data from real API
      await generateReadinessChartData(classes);
      
    } catch (error) {
      console.error('❌ Error calculating unique students:', error);
      setTotalStudentsCount(0);
      setActualStudentsData([]);
    } finally {
      setLoadingStudentCount(false);
      setLoadingStudentsData(false);
    }
  };

  // Function to generate readiness chart data from real API data
  const generateReadinessChartData = async (classes) => {
    try {
      const chartData = await getTeacherReadinessChartData(userId, 8);
      const colors = generateClassColors(classes);
      const stats = calculateTeacherStats(chartData);

      setReadinessChartData(chartData);
      setClassColors(colors);
      setTeacherStats(stats);
    } catch (error) {
      console.error('Error generating chart data:', error);
      setReadinessChartData([]);
      setClassColors({});
      setTeacherStats({});
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

  const generateQuiz = () => {
    // Placeholder function for generating a quiz based on AI insights
    alert('This will generate a new practice quiz based on student performance data.');
  }
  // Function to render different page content
  const renderPageContent = () => {
    // ===== CLASS-SPECIFIC VIEWS (HIGHEST PRIORITY) =====
    if (selectedClass && currentView === 'students') {
        return (
            <StudentView 
                teacherInfo={teacherInfo}
                selectedClass={selectedClass}
                onBack={handleBackToOverview}
            />
        );
    }

    if (selectedClass && currentView === 'class-overview') {
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
        return (
            <div className="coming-soon">
                <button onClick={handleBackToOverview} className="back-btn">← Back to Overview</button>
                <h2>Class Analytics - Coming Soon!</h2>
                <p>Analytics for {selectedClass.name}</p>
            </div>
        );
    }

    if (selectedClass && currentView === 'assignments') {
        return (
            <div className="coming-soon">
                <button onClick={handleBackToOverview} className="back-btn">← Back to Overview</button>
                <h2>Assignments - Coming Soon!</h2>
                <p>Assignment management for {selectedClass.name}</p>
            </div>
        );
    }


    // ===== MAIN PAGE VIEWS (LOWEST PRIORITY) =====
    switch (activePage) {
      case 'assignments':
        return (
          <Assignments
            teacherInfo={teacherInfo}
            actualStudentsData={actualStudentsData}
            loadingStudentsData={loadingStudentsData}
            onNavigate={handlePageChange}
            onBack={() => setActivePage('overview')}
            selectedClass={selectedClass} // Pass the selected class
          />
        );
      case 'classes':
        return <MyClasses teacherInfo={teacherInfo} onClassClick={handleClassClick} />;
      case 'insights':
        return <div className="coming-soon">Insights page coming soon</div>;
      case 'ta':
        return <MyTA />;
      case 'reports':
        return <div className="coming-soon">Reports page coming soon...</div>;
      case 'settings':
        return <Settings />;
      default:
        return renderOverviewContent();
    }
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
              teacherStats.averageReadiness ? teacherStats.averageReadiness + '%' : '0%'
            )}
          </div>
          {!loadingStudentsData && teacherStats.improvementTrend !== undefined && (
            <div className="kpi-subtitle" style={{ 
              color: teacherStats.improvementTrend >= 0 ? '#10b981' : '#ef4444' 
            }}>
              {teacherStats.improvementTrend >= 0 ? '+' : ''}{teacherStats.improvementTrend}% this period
            </div>
          )}
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
          <div className="kpi-title">Avg. Score</div>
          <div className="kpi-value">
            {loadingStudentsData ? (
              <div className="loading-indicator">...</div>
            ) : actualStudentsData.length > 0 ? (
              `${Math.round(actualStudentsData.reduce((s, st) => s + (st.averageScore || 0), 0) / actualStudentsData.length)}%`
            ) : '—'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Avg. Readiness</div>
          <div className="kpi-value">
            {loadingStudentsData ? (
              <div className="loading-indicator">...</div>
            ) : actualStudentsData.length > 0 ? (
              `${Math.round(actualStudentsData.reduce((s, st) => s + (st.readiness || 0), 0) / actualStudentsData.length)}%`
            ) : '—'}
          </div>
        </div>
      </section>

      <section className="td-grid">
        <div className="panel panel-large">
          <div className="panel-title">Class Readiness Over Time</div>
          <div style={{ width: "100%", height: 260 }}>
            <TeacherReadinessChart 
              classReadinessData={readinessChartData}
              classColors={classColors}
            />
          </div>
        </div>

        <div className="panel panel-small" style={{ 
          opacity: 0.7, 
          pointerEvents: 'none',
          position: 'relative'
        }}>
          <div className="panel-title" style={{ color: '#888' }}>Topic Mastery (Coming Soon)</div>
          <div className="heatmap">
            <div className="heatmap-label-column">
              {topics.map((t) => <div key={t} className="heatmap-label" style={{ color: '#aaa' }}>{t}</div>)}
            </div>
            <div className="heatmap-grid">
              {heatmap.map((row, rIdx) => (
                <div key={rIdx} className="heatmap-row">
                  {row.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className="heatmap-cell"
                      style={{ 
                        background: heatColor(cell),
                        cursor: 'not-allowed',
                        filter: 'grayscale(50%)'
                      }}
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
          <div className="panel-title">Insights Summary</div>
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
            <button className="ai-btn" onClick={generateQuiz}>Generate new practice quiz</button>
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
      <aside className={`td-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="td-brand">Examnation</div>
        <nav className="td-nav">
          <button 
            className={`td-nav-item ${activePage === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavClick('overview')}
          >
            <BiHome style={{ marginRight: '8px', fontSize: '18px'}} />
            Overview
          </button>
          <button 
            className={`td-nav-item ${activePage === 'classes' ? 'active' : ''}`}
            onClick={() => handleNavClick('classes')}
          >
            <BiGroup style={{ marginRight: '8px', fontSize: '18px'}} />
            My Classes
          </button>
          <button 
            className={`td-nav-item ${activePage === 'insights' ? 'active' : ''}`}
            onClick={() => handleNavClick('insights')}
          >
            <BiBarChart style={{ marginRight: '8px', fontSize: '18px'}} />
            Insights
          </button>
          <button 
            className={`td-nav-item ${activePage === 'assignments' ? 'active' : ''}`}
            onClick={() => handleNavClick('assignments')}
          >
            <BiClipboard style={{ marginRight: '8px', fontSize: '18px'}} />
            Assignments
          </button>
          <button 
            className={`td-nav-item ${activePage === 'ta' ? 'active' : ''}`}
            onClick={() => handleNavClick('ta')}
          >
            <BiBrain style={{ marginRight: '8px', fontSize: '18px'}}/>
            MY TA
          </button>
          <button 
            className={`td-nav-item ${activePage === 'reports' ? 'active' : ''}`}
            onClick={() => handleNavClick('reports')}
          >
            <BiFile style={{ marginRight: '8px', fontSize: '18px'}} />
            Reports
          </button>
          <button 
            className={`td-nav-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <BiCog style={{ marginRight: '8px', fontSize: '18px'}} />
            Settings
          </button>
        </nav>
        
        {/* Logout button positioned at bottom of sidebar */}
        <div className="td-sidebar-bottom">
          <button
            className="td-nav-item logout-btn"
            onClick={() => logout(navigate)}
          >
            <BiLogOut style={{ marginRight: '8px', fontSize: '18px'}} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && <div className="td-mobile-overlay" onClick={toggleMobileMenu}></div>}

      <main className="td-main">
        {/* Mobile Header */}
        <div className="td-mobile-header">
          <div className="td-brand">Examnation</div>
          <button className="td-mobile-menu-btn" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <BiX size={24} /> : <BiMenu size={24} />}
          </button>
        </div>

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

