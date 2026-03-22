import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { BiLogOut, BiCog, BiBrain, BiFile, BiClipboard, BiBarChart, BiGroup, BiHome, BiMenu, BiX } from "react-icons/bi";
import "../TeacherDashboard.css";

// Import services
import { getTeacherInfo, getTeacherClasses, getAllEnrolledStudentInfo, getTeacherReadinessChartData, getClassTopicAbility } from "./TeacherDashboardService";
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboardNav } from '../../../hooks/useDashboardNav';

// Import chart components
import TeacherReadinessChart from "../Charts/TeacherReadinessChart";
import { generateClassColors, calculateTeacherStats } from "../Charts/TeacherReadinessLogic";

// Import the components
import MyClasses from "./MyClasses";
import StudentProfile from "./StudentProfile";

import ClassOverview from "./ClassOverview";
import StudentView from "./StudentView";
import Assignments from "./Assignments";
import MyTA from "../TAPage/TAPageTeacher";
import Settings from "../../Settings/Settings";
import Breadcrumb from '../../Breadcrumb/Breadcrumb.js';


function heatColor(v) {
  // 0 = red, 0.5 = amber, 1 = green
  const hue = Math.round(v * 120);
  return `hsl(${hue}deg 65% ${35 + v * 20}%)`;
}

// Compute weak spots from flat array of { studentId, topic, theta } rows
function computeWeakSpots(rows) {
  // Deduplicate: keep one row per (studentId, topic) — last wins is fine
  const lookup = {};
  rows.forEach(r => {
    const key = `${r.studentId}::${r.topic}`;
    lookup[key] = r.theta;
  });

  const byTopic = {};
  Object.entries(lookup).forEach(([key, theta]) => {
    const topic = key.split('::')[1];
    if (!byTopic[topic]) byTopic[topic] = { total: 0, struggling: 0, thetaSum: 0 };
    byTopic[topic].total += 1;
    if (theta < 0) byTopic[topic].struggling += 1;
    byTopic[topic].thetaSum += theta;
  });

  return Object.entries(byTopic)
    .map(([topic, d]) => ({
      topic,
      strugglingCount: d.struggling,
      totalCount: d.total,
      avgReadiness: Math.round(((d.thetaSum / d.total + 4) / 8) * 100),
      pctStruggling: Math.round((d.struggling / d.total) * 100),
    }))
    .filter(s => s.strugglingCount > 0)
    .sort((a, b) => b.pctStruggling - a.pctStruggling);
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
  const [heatmapData, setHeatmapData] = useState({ topics: [], students: [], grid: [] });
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [weakSpots, setWeakSpots] = useState([]);
  const [loadingWeakSpots, setLoadingWeakSpots] = useState(false);

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

      // Load cross-class weak spots
      setLoadingWeakSpots(true);
      try {
        const allTopicRows = [];
        for (const classItem of classes) {
          const cid = classItem.classId || classItem.id;
          if (!cid) continue;
          const rows = await getClassTopicAbility(cid);
          if (Array.isArray(rows)) allTopicRows.push(...rows);
        }
        setWeakSpots(computeWeakSpots(allTopicRows));
        console.log('📊 Weak spots computed:', computeWeakSpots(allTopicRows).length, 'topics');
      } catch (wsErr) {
        console.error('Error loading weak spots:', wsErr);
        setWeakSpots([]);
      } finally {
        setLoadingWeakSpots(false);
      }

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

  // Load topic heatmap whenever we have enrolled students and classes
  useEffect(() => {
    const classId = selectedClass?.classId || selectedClass?.id;
    if (!classId) return;

    setLoadingHeatmap(true);
    getClassTopicAbility(classId)
      .then(rows => {
        if (!rows || rows.length === 0) {
          setHeatmapData({ topics: [], students: [], grid: [] });
          return;
        }

        // Unique sorted topics and student IDs
        const topics = [...new Set(rows.map(r => r.topic))].sort();
        const studentIds = [...new Set(rows.map(r => r.studentId))];

        // Build lookup: studentId → topic → readiness (0-1)
        const lookup = {};
        rows.forEach(r => {
          if (!lookup[r.studentId]) lookup[r.studentId] = {};
          // Convert theta (-4 to +4) → 0 to 1
          lookup[r.studentId][r.topic] = Math.max(0, Math.min(1, (r.theta + 4) / 8));
        });

        // Grid: rows = topics, columns = students
        const grid = topics.map(topic =>
          studentIds.map(sid => lookup[sid]?.[topic] ?? null)
        );

        // Match student names from actualStudentsData if available
        const students = studentIds.map(sid => {
          const found = actualStudentsData.find(s => s.studentId === sid || s.id === sid);
          return found ? (found.studentName || found.name || `Student ${sid}`) : `Student ${sid}`;
        });

        setHeatmapData({ topics, students, grid });
      })
      .catch(() => setHeatmapData({ topics: [], students: [], grid: [] }))
      .finally(() => setLoadingHeatmap(false));
  }, [selectedClass, actualStudentsData]);

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
    // ===== STUDENT PROFILE VIEW =====
    if (selectedStudentProfile) {
      return (
        <StudentProfile
          studentId={selectedStudentProfile.studentId}
          studentName={selectedStudentProfile.studentName}
          classId={selectedClass?.classId || selectedClass?.id}
          onBack={() => setSelectedStudentProfile(null)}
        />
      );
    }

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
          <div className="kpi-title">At-Risk Students</div>
          <div className="kpi-value" style={{ color: actualStudentsData.filter(s => (s.readiness || 0) < 50).length > 0 ? '#ef4444' : '#10b981' }}>
            {loadingStudentsData ? (
              <div className="loading-indicator">...</div>
            ) : (
              actualStudentsData.filter(s => (s.readiness || 0) < 50).length
            )}
          </div>
          {!loadingStudentsData && (
            <div className="kpi-subtitle">Readiness below 50%</div>
          )}
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

        <div className="panel panel-small">
          <div className="panel-title">Topic Mastery by Student</div>
          {loadingHeatmap ? (
            <div className="loading-indicator">Loading heatmap...</div>
          ) : heatmapData.topics.length === 0 ? (
            <div className="no-data" style={{ padding: '16px', color: '#888', fontSize: '13px' }}>
              No topic data yet. Students need to complete adaptive tests or assignments for this class.
            </div>
          ) : (
            <div className="heatmap" style={{ overflowX: 'auto' }}>
              {/* Column headers = student names */}
              <div style={{ display: 'flex', marginLeft: '140px', marginBottom: '4px' }}>
                {heatmapData.students.map((name, i) => (
                  <div key={i} style={{ width: 32, fontSize: '10px', color: '#666', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>
                    {name.split(' ')[0]}
                  </div>
                ))}
              </div>
              <div className="heatmap-label-column" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {heatmapData.topics.map((topic, rIdx) => (
                  <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div className="heatmap-label" style={{ width: '136px', fontSize: '11px', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }} title={topic}>
                      {topic}
                    </div>
                    {heatmapData.grid[rIdx].map((cell, cIdx) => (
                      <div
                        key={cIdx}
                        className="heatmap-cell"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 4,
                          flexShrink: 0,
                          background: cell === null ? '#e8e8e8' : heatColor(cell),
                          cursor: 'default'
                        }}
                        title={cell === null
                          ? `${heatmapData.students[cIdx]} — no data`
                          : `${heatmapData.students[cIdx]} · ${topic}: ${Math.round(cell * 100)}%`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: '#666' }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(0.1) }} /> Low
                <div style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(0.5), marginLeft: 6 }} /> Mid
                <div style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(0.9), marginLeft: 6 }} /> High
              </div>
            </div>
          )}
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
                  <tr
                    key={student.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedStudentProfile({ studentId: student.id, studentName: student.name })}
                  >
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
          <div className="panel-title">Struggling Topics</div>
          {loadingWeakSpots ? (
            <div className="loading-indicator" style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>Analyzing topic data...</div>
          ) : weakSpots.length === 0 ? (
            <div style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>
              No weak spots detected yet — students need to complete adaptive tests or assignments.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
              {weakSpots.slice(0, 5).map(s => (
                <div key={s.topic} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{s.topic}</span>
                    <span style={{
                      fontSize: '12px', fontWeight: 600, padding: '1px 7px', borderRadius: '999px',
                      background: s.pctStruggling > 60 ? '#fef2f2' : s.pctStruggling > 30 ? '#fffbeb' : '#f0fdf4',
                      color: s.pctStruggling > 60 ? '#dc2626' : s.pctStruggling > 30 ? '#d97706' : '#16a34a',
                    }}>
                      {s.strugglingCount}/{s.totalCount} students
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#1e293b', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${s.pctStruggling}%`,
                      background: s.pctStruggling > 60 ? '#ef4444' : s.pctStruggling > 30 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              ))}
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
                Your students averaged <strong>{Math.round(actualStudentsData.reduce((sum, s) => sum + s.readiness, 0) / actualStudentsData.length)}% readiness</strong> this month.{' '}
                {weakSpots.length > 0 ? (
                  <><strong>{weakSpots[0].topic}</strong> needs attention — {weakSpots[0].strugglingCount} of {weakSpots[0].totalCount} students ({weakSpots[0].pctStruggling}%) are below 50% readiness on this topic.</>
                ) : (
                  <>Top performer is <strong>{actualStudentsData[0]?.name}</strong> with {actualStudentsData[0]?.readiness}% readiness.</>
                )}
              </>
            ) : (
              'No student data available for analysis.'
            )}
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

  // Breadcrumb trail based on current nav state
  const getBreadcrumbs = () => {
    const home = { label: 'Home', onClick: () => handleNavClick('overview') };

    if (selectedClass) {
      const classesCrumb = { label: 'My Classes', onClick: handleBackToClasses };
      const classCrumb = { label: selectedClass.name, onClick: handleBackToOverview };

      if (currentView === 'class-overview') {
        return [home, classesCrumb, { label: selectedClass.name }];
      }
      if (currentView === 'students') {
        return [home, classesCrumb, classCrumb, { label: 'Students' }];
      }
      if (currentView === 'analytics') {
        return [home, classesCrumb, classCrumb, { label: 'Analytics' }];
      }
      if (currentView === 'assignments') {
        return [home, classesCrumb, classCrumb, { label: 'Assignments' }];
      }
    }

    switch (activePage) {
      case 'classes': return [home, { label: 'My Classes' }];
      case 'assignments': return [home, { label: 'Assignments' }];
      case 'insights': return [home, { label: 'Insights' }];
      case 'ta': return [home, { label: 'My TA' }];
      case 'reports': return [home, { label: 'Reports' }];
      case 'settings': return [home, { label: 'Settings' }];
      default: return [home];
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
        <Breadcrumb crumbs={getBreadcrumbs()} />

        {/* ONLY RENDER PAGE CONTENT - NO DUPLICATE COMPONENTS */}
        {renderPageContent()}
      </main>
    </div>
  );
}

