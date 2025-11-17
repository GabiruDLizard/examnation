import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { BiCog, BiBrain, BiFile, BiClipboard, BiBarChart, BiGroup, BiHome } from "react-icons/bi";
import "../../../Styling/Dashboards/TeacherDashboard.css";

// Import services
import { getTeacherInfo } from "./TeacherDashboardService";

// Import the new components
import MyClasses from "./MyClasses";

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

export default function TeacherDashboard() {
  const [activePage, setActivePage] = useState('overview');
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teacher info on component mount
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        const data = await getTeacherInfo();
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
    switch (activePage) {
      case 'classes':
        return <MyClasses teacherInfo={teacherInfo} />;
      case 'insights':
        return <div className="coming-soon">Insights page coming soon...</div>;
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

  // Get page title based on active page
  const getPageTitle = () => {
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
          >
            <BiCog style={{ marginRight: '8px', fontSize: '18px'}} />
            Settings
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

/* small helper to map 0..1 -> color */
function heatColor(v) {
  const hue = 220 - v * 140;
  return `hsl(${hue}deg 70% ${30 + v*30}%)`;
}
