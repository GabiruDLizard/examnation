import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { BiLogOut, BiCog, BiBrain, BiFile, BiClipboard, BiBarChart, BiGroup, BiHome } from "react-icons/bi";
import "../../../Styling/Dashboards/TeacherDashboard.css";

// Import services
import { getTeacherInfo } from "./TeacherDashboardService";

// Import the new components
import MyClasses from "./MyClasses";
import ClassOverview from "./ClassOverview";

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
  const [showClassOverview, setShowClassOverview] = useState(false); 
  const [showInsights, setShowInsights] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);
  const [showTA, setShowTA] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleClassClick = (classItem) => {
    console.log('Class clicked:', classItem.name);
    setSelectedClass(classItem);
    setShowClassOverview(true); // Show class overview without changing activePage
  };

  // Fixed the incomplete function
  const handleInsightsClick = (classItem) => {
    setSelectedClass(classItem);
    setShowInsights(true);
  };

  const handleBackToInsights = () => {
    setSelectedClass(null);
    setShowInsights(false);
  }; // Added missing semicolon

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setShowClassOverview(false);
    // activePage stays as 'classes'
  };

  const navigate = useNavigate();
   
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch teacher data...'); // Debug log
        
        const data = await getTeacherInfo(); // No parameters needed
        console.log('Teacher data received in component:', data); // Debug log
        
        setTeacherInfo(data);
        setError(null);
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

  // Function to get teacher display name
  const getTeacherDisplayName = () => {
    if (loading) return 'Loading...';
    if (error || !teacherInfo) return 'Teacher';
    
    // Try different name combinations
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
    // If we're showing class overview, show that regardless of activePage
    if (showClassOverview && activePage === 'classes') {
      return <ClassOverview teacherInfo={teacherInfo} selectedClass={selectedClass} onBack={handleBackToClasses} />;
    }
    // Commented out undefined components for now
    /*
    else if(showInsights && activePage === 'insights'){
      return <InsightsOverview teacherInfo={teacherInfo} selectedClass={selectedClass} onBack={handleBackToInsights} />;
    }
    else if(showAssignments && activePage === 'assignments'){
      return <AssignmentsOverview teacherInfo={teacherInfo} selectedClass={selectedClass} onBack={handleBackToAssignments} />;
    }
    else if(showTA && activePage === 'ta'){
      return <TAOverview teacherInfo={teacherInfo} selectedClass={selectedClass} onBack={handleBackToTA} />;
    }
    else if(showReports && activePage === 'reports'){
      return <ReportsOverview teacherInfo={teacherInfo} selectedClass={selectedClass} onBack={handleBackToReports} />;
    }
    else if(showSettings && activePage === 'settings'){
      return <SettingsOverview teacherInfo={teacherInfo} selectedClass={selectedClass} onBack={handleBackToSettings} />;
    }
    */

    // Otherwise, render based on activePage
    switch (activePage) {
      case 'classes':
        return <MyClasses teacherInfo={teacherInfo} onClassClick={handleClassClick} />;
      case 'insights':
        return <div className="coming-soon">Insights page coming soon...</div>; // Keep insights as original
      case 'assignments':
        return <div className="coming-soon">Assignments page coming soon...</div>;
      case 'ta':
        return <div className="coming-soon">MY TA page coming soon...</div>;
      case 'reports':
        return <div className="coming-soon">Reports page coming soon...</div>;
      case 'settings':
        return <div className="coming-soon">Settings page coming soon...</div>;
      default:
        return renderOverviewContent();
    }
  };

  // Overview page content (your original dashboard)
  const renderOverviewContent = () => (
    <>
      <section className="td-kpis">
        <div className="kpi-card">
          <div className="kpi-title">Avg. Readiness</div>
          <div className="kpi-value">74%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total Students</div>
          <div className="kpi-value">28</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Weakest Topic</div>
          <div className="kpi-value">Algebra</div>
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
          <table className="student-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Readiness</th>
                <th>Improvement</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.readiness}%</td>
                  <td>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${s.improvement * 6}%` }} />
                    </div>
                  </td>
                  <td>{s.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel panel-medium">
          <div className="panel-title">AI Insights Summary</div>
          <div className="ai-text">
            Your class improved <strong>12%</strong> this month. Most errors were in factoring quadratic equations and simplifying algebraic fractions.
          </div>
          <div className="ai-actions">
            <button className="ai-btn">Generate new Algebra quiz</button>
            <button className="ai-btn ghost">Send feedback to 5 students</button>
          </div>
        </div>
      </section>
    </>
  );

  // Get page title based on active page and class overview state
  const getPageTitle = () => {
    if (showClassOverview && selectedClass) {
      return `${selectedClass.name} - Students`;
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
            onClick={() => setActivePage('overview')}
          >
            <BiHome style={{ marginRight: '8px', fontSize: '18px'}} />
            Overview
          </button>
          <button 
            className={`td-nav-item ${activePage === 'classes' ? 'active' : ''}`}
            onClick={() => setActivePage('classes')}
          >
            <BiGroup style={{ marginRight: '8px', fontSize: '18px'}} />
            My Classes
          </button>
          <button 
            className={`td-nav-item ${activePage === 'insights' ? 'active' : ''}`}
            onClick={() => setActivePage('insights')}
          >
            <BiBarChart style={{ marginRight: '8px', fontSize: '18px'}} />
            Insights
          </button>
          <button 
            className={`td-nav-item ${activePage === 'assignments' ? 'active' : ''}`}
            onClick={() => setActivePage('assignments')}
          >
            <BiClipboard style={{ marginRight: '8px', fontSize: '18px'}} />
            Assignments
          </button>
          <button 
            className={`td-nav-item ${activePage === 'ta' ? 'active' : ''}`}
            onClick={() => setActivePage('ta')}
          >
            <BiBrain style={{ marginRight: '8px', fontSize: '18px'}}/>
            MY TA
          </button>
          <button 
            className={`td-nav-item ${activePage === 'reports' ? 'active' : ''}`}
            onClick={() => setActivePage('reports')}
          >
            <BiFile style={{ marginRight: '8px', fontSize: '18px'}} />
            Reports
          </button>
          <button 
            className={`td-nav-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => setActivePage('settings')}
            id="bottom-button"
          >
            <BiCog style={{ marginRight: '8px', fontSize: '18px'}} />
            Settings
          </button>
          <button
            className="td-nav-item"
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
            id="bottom-button"
          >
            <BiLogOut style={{ marginRight: '8px', fontSize: '18px'}} />
            Logout
          </button>
        </nav>
      </aside>

      <main className="td-main">
        <header className="td-header">
          <h1>{getPageTitle()}</h1>
          <div className="td-user">{getTeacherDisplayName()}</div>
        </header>

        {renderPageContent()}
      </main>
    </div>
  );
}

