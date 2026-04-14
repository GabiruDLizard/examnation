import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiHome, BiBookOpen, BiBarChart, BiClipboard,
  BiTrendingUp, BiCog, BiLogOut, BiPlay, BiCheckCircle,
  BiTime, BiBullseye, BiMenu, BiX, BiBrain
} from 'react-icons/bi';
import '../StudentDashboard.css';
import { getStudentAnswers } from './StudentDashboardService.js';
import { getStudentReadinessHistory } from '../TeacherDashboard/TeacherDashboardService.js';
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboardNav } from '../../../hooks/useDashboardNav';
import { authFetch } from '../../../utils/api';
import { abilityEstimate } from '../Charts/ReadinessLogic.js';
import ReadinessChart from '../Charts/Readiness.js';
import StudentMyClasses from './MyClasses.js';
import StudentClassOverview from './ClassOverview.js';
import AssignmentOverview from './AssignmentOverview.js';
import AssignmentQuestionPage from './AssignmentQuestionPage.js';
import AssignmentReview from './AssignmentReview.js';
import TAPageStudent from '../TAPage/TAPageStudent.js';
import StudyHistory from './StudyHistory.js';
import Settings from '../../Settings/Settings.js';
import Breadcrumb from '../../Breadcrumb/Breadcrumb.js';
import { useTour } from '../../Tour/useTour';
import studentSteps from './StudentSteps';
import { DEMO_MODE, DEMO_STUDENT_INFO, DEMO_STUDENT_STATS, DEMO_READINESS_SCORES, DEMO_CLASS_READINESS_HISTORY } from '../../../demo/dummyData';
import NotificationBell from '../../Notifications/NotificationBell';

// Helper function for grouping answers by date
const groupAnswersByDate = (answers) => {
    const grouped = {};
    
    answers.forEach(answer => {
        const dateKey = answer.answeredAt ? 
            answer.answeredAt.split('T')[0] : 
            'unknown-date';
        
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(answer);
    });
    
    return grouped;
};

// Processing function with better error handling
const processGroupedAnswers = (groupedAnswers) => {
    const results = [];
    let runningTheta = 0;
    let globalIndex = 0;

    const sortedDates = Object.keys(groupedAnswers).sort();

    for (const date of sortedDates) {
        const answersForDate = groupedAnswers[date];

        for (let i = 0; i < answersForDate.length; i++) {
            const answer = answersForDate[i];

            if (!answer.difficultyLevel || typeof answer.isCorrect !== 'boolean') continue;

            const newTheta = abilityEstimate(
                answer.difficultyLevel,
                answer.isCorrect,
                runningTheta,
                globalIndex
            );

            runningTheta = newTheta;
            globalIndex++;

            results.push({
                date,
                questionIndex: i + 1,
                questionId: answer.questionId,
                difficulty: answer.difficultyLevel,
                isCorrect: answer.isCorrect,
                abilityEstimate: newTheta,
                attemptMode: answer.attemptMode || 'practice'
            });
        }
    }

    return results;
};

function StudentDashboard() {
    const { userId, authLoading, logout } = useAuth();
    const {
        activePage,
        currentView, setCurrentView,
        selectedClass,
        mobileMenuOpen,
        handleNavClick,
        handleClassClick,
        handleBackToClasses,
        handleBackToOverview,
        toggleMobileMenu,
    } = useDashboardNav();

    const [student, setStudent] = useState({});
    const [studentprogress, setStudentProgress] = useState({});
    const [studentAnswers, setStudentAnswers] = useState([]);
    const [readinessScores, setReadinessScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [classReadinessHistory, setClassReadinessHistory] = useState([]);

    // Chart view state
    const [activeChartView, setActiveChartView] = useState('progress'); // 'progress' or 'class'
    const [readinessRefreshKey, setReadinessRefreshKey] = useState(0);
    const [classReadinessRefreshKey, setClassReadinessRefreshKey] = useState(0);

    // Stats
    const [qAnswered, setQAnswered] = useState(0);
    const [correctAns, setCorrectAns] = useState(0);
    const [averageCorrectness, setAverageCorrectness] = useState(0);

    const navigate = useNavigate();

    useTour(userId, 'student', studentSteps, !loading);

    const handleNavigateFromOverview = (section, data = null) => {
        if (section === 'assignment-questions' && data?.assignment) {
            setSelectedAssignment(data.assignment);
        }
        if (section === 'assignment-review' && data?.assignment) {
            setSelectedAssignment(data.assignment);
            setSelectedSubmission(data.submission);
        }
        setCurrentView(section);
    };

    // Re-fetch readiness history whenever the student returns to main overview,
    // or manually refreshes the class chart tab
    useEffect(() => {
        if (!userId || currentView !== 'main') return;
        getStudentReadinessHistory(userId, 8)
            .then(history => setClassReadinessHistory(history))
            .catch(() => {});
    }, [currentView, userId, readinessRefreshKey, classReadinessRefreshKey]);

    useEffect(() => {
        if (authLoading) return;

        const id = userId;

        if (!id) {
            navigate('/login');
            return;
        }

        if (DEMO_MODE) {
            setStudent(DEMO_STUDENT_INFO);
            setQAnswered(DEMO_STUDENT_STATS.qAnswered);
            setCorrectAns(DEMO_STUDENT_STATS.correctAns);
            setAverageCorrectness(DEMO_STUDENT_STATS.averageCorrectness);
            setReadinessScores(DEMO_READINESS_SCORES);
            setClassReadinessHistory(DEMO_CLASS_READINESS_HISTORY);
            setLoading(false);
            return;
        }

        const fetchAllData = async () => {
            if (!id) {
                return;
            }

            setLoading(true);

            try {
                // 1. Fetch student data
                const studentResponse = await authFetch(`/user/${id}`);

                if (studentResponse.ok) {
                    const studentData = await studentResponse.json();
                    setStudent(studentData);
                    setError(null);
                } else {
                    throw new Error(`Failed to fetch student data: ${studentResponse.status}`);
                }

                // Fetch class readiness history for the per-class chart
                try {
                    const history = await getStudentReadinessHistory(id, 8);
                    setClassReadinessHistory(history);
                } catch { /* non-fatal */ }

                // 2. Try to fetch progress data (skip if it fails)
                try {
                    const progressResponse = await authFetch(`/userprogress/${id}`);

                    if (progressResponse.ok) {
                        const progressData = await progressResponse.json();
                        setStudentProgress(progressData);
                    } else {
                        setStudentProgress({});
                    }
                } catch (progressError) {
                    setStudentProgress({});
                }

                // 3. Fetch practice answers
                const answersResponse = await getStudentAnswers(id);

            // Process the data we have
            setStudentAnswers(answersResponse);
            setQAnswered(answersResponse.length);
            const correctAnswersCount = answersResponse.filter(answer => answer.isCorrect).length;
            setCorrectAns(correctAnswersCount);
            setAverageCorrectness(answersResponse.length ? (correctAnswersCount / answersResponse.length) * 100 : 0);

            // Practice & Test chart — personal readiness from practice + adaptive_test only
            const practiceTestAnswers = answersResponse.filter(a =>
                a.attemptMode === 'practice' || a.attemptMode === 'adaptive_test'
            );

            if (practiceTestAnswers.length > 0) {
                try {
                    const grouped = groupAnswersByDate(practiceTestAnswers);
                    const readinessResults = processGroupedAnswers(grouped);
                    setReadinessScores(readinessResults);
                } catch (readinessError) {
                    setReadinessScores([]);
                }
            } else {
                setReadinessScores([]);
            }

        } catch (error) {
            setError(`Failed to load dashboard: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    fetchAllData();
}, [navigate, userId, authLoading]);

    // Function to get student display name using the same pattern as old code
    const getStudentDisplayName = () => {
        if (loading) return 'Loading...';
        if (!student || Object.keys(student).length === 0) return 'Student';
        
        // Try different name combinations
        if (student.firstName && student.lastName) {
            return `${student.firstName} ${student.lastName}`;
        } else if (student.first_name && student.last_name) {
            return `${student.first_name} ${student.last_name}`;
        } else if (student.name) {
            return student.name;
        } else if (student.username) {
            return student.username;
        } else {
            return 'Student';
        }
    };

    // Helper function to get the latest readiness info (using cumulative calculation like the chart)
    const getLatestReadiness = () => {
        if (!readinessScores || readinessScores.length === 0) {
            return {
                estimate: 0,
                level: 'No Data',
                percentage: 0
            };
        }
        
        // Use cumulative calculation - average of all ability estimates (same as chart)
        const totalAbility = readinessScores.reduce((sum, score) => sum + score.abilityEstimate, 0);
        const averageAbility = totalAbility / readinessScores.length;
        const percentage = Math.max(0, Math.min(100, ((averageAbility + 4) / 8) * 100));
        
        let level;
        if (percentage >= 85) level = "Ready";
        else if (percentage >= 70) level = "Nearly Ready";
        else if (percentage >= 50) level = "Developing";
        else if (percentage >= 30) level = "Needs Practice";
        else level = "Beginner";
        
        return {
            estimate: averageAbility,
            level: level,
            percentage: Math.round(percentage)
        };
    };

    // Get recent tests (with cumulative readiness calculation for each test)
    const getRecentTests = () => {
        if (!readinessScores || readinessScores.length === 0) {
            return [];
        }
        
        const testSessions = {};
        
        readinessScores.forEach(score => {
            if (!testSessions[score.date]) {
                testSessions[score.date] = {
                    date: score.date,
                    questions: [],
                    finalReadiness: 0
                };
            }
            testSessions[score.date].questions.push(score);
        });
        
        const tests = Object.values(testSessions).map(session => {
            const correctAnswers = session.questions.filter(q => q.isCorrect).length;
            const totalQuestions = session.questions.length;
            const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
            
            // Calculate cumulative readiness for this test (average of all ability estimates in this session)
            const totalAbility = session.questions.reduce((sum, q) => sum + q.abilityEstimate, 0);
            const averageAbility = totalAbility / session.questions.length;
            const finalReadinessPercentage = Math.max(0, Math.min(100, ((averageAbility + 4) / 8) * 100));
            
            const testType = session.questions[0].attemptMode || 'practice';
            
            let displayTestType = 'Practice';
            if (testType === 'adaptive_test') {
                displayTestType = 'Adaptive';
            } else {
                displayTestType = 'Practice';
            }

            return {
                date: new Date(session.date).toLocaleDateString(),
                totalQuestions,
                correctAnswers,
                accuracy,
                finalReadiness: Math.round(finalReadinessPercentage),
                testType: displayTestType,
                rawDate: session.date
            };
        });
        
        return tests
            .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate))
            .slice(0, 5);
    };

    // Function to render different page content
    const renderPageContent = () => {
        // Handle class overview navigation first
        if (selectedClass && currentView === 'class-overview') {
            return (
                <StudentClassOverview 
                    studentInfo={student} 
                    selectedClass={selectedClass} 
                    onBack={handleBackToClasses} 
                    onNavigate={handleNavigateFromOverview}
                />
            );
        }

        if (selectedClass && currentView === 'assignments') {
            return (
                <AssignmentOverview 
                    selectedClass={selectedClass} 
                    onBack={handleBackToOverview} 
                    onNavigate={handleNavigateFromOverview}
                />
            );
        }

        if (selectedClass && currentView === 'assignment-review' && selectedAssignment && selectedSubmission) {
            return (
                <AssignmentReview
                    assignment={selectedAssignment}
                    submission={selectedSubmission}
                    onBack={() => setCurrentView('assignments')}
                />
            );
        }

        if (selectedClass && currentView === 'assignment-questions' && selectedAssignment) {
            return (
                <AssignmentQuestionPage 
                    assignment={selectedAssignment}
                    selectedClass={selectedClass} 
                    questions={selectedAssignment.questions} // Pass preloaded questions
                    onBack={() => setCurrentView('assignments')}
                    onComplete={() => {
                        setCurrentView('assignments');
                        setSelectedAssignment(null);
                        setReadinessRefreshKey(k => k + 1);
                    }}
                />
            );
        }

        if (selectedClass && currentView === 'progress') {
            return (
                <div className="coming-soon">
                    <button onClick={handleBackToOverview} className="back-btn">← Back to Overview</button>
                    <h2>Class Progress - Coming Soon!</h2>
                    <p>Progress tracking for {selectedClass.name}</p>
                </div>
            );
        }

        // Handle main navigation
        if (currentView === 'main') {
            switch (activePage) {
                case 'classes':
                    return <StudentMyClasses studentInfo={student} onClassClick={handleClassClick} />;
                case 'history':
                    return <StudyHistory studentAnswers={studentAnswers} userId={userId} />;
                case 'ta':
                    return <TAPageStudent />;
                case 'settings':
                    return <Settings />;
                default:
                    return renderOverviewContent();
            }
        }

        // Fallback
        return <div>Unknown view state</div>;
    };

    // Overview page content
    const renderOverviewContent = () => {
        const latestReadiness = getLatestReadiness();
        const recentTests = getRecentTests();

        return (
            <>
                <section className="sd-kpis">
                    <div className="kpi-card">
                        <div className="kpi-title">Current Readiness</div>
                        <div className="kpi-value">{latestReadiness.percentage}%</div>
                        <div className="kpi-subtitle">{latestReadiness.level}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-title">Questions Answered</div>
                        <div className="kpi-value">{qAnswered}</div>
                        <div className="kpi-subtitle">Total attempted</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-title">Overall Accuracy</div>
                        <div className="kpi-value">{qAnswered ? Math.round((correctAns / qAnswered) * 100) : 0}%</div>
                        <div className="kpi-subtitle">{correctAns}/{qAnswered} correct</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-title">Tests Completed</div>
                        <div className="kpi-value">{recentTests.length}</div>
                        <div className="kpi-subtitle">Recent sessions</div>
                    </div>
                </section>

                <section className="sd-grid">
                    <div className="panel panel-large">
                        <div className="panel-header">
                            <div className="chart-tabs">
                                <button 
                                    className={`chart-tab ${activeChartView === 'progress' ? 'active' : ''}`}
                                    onClick={() => setActiveChartView('progress')}
                                >
                                    <BiTrendingUp size={16} />
                                    Practice & Test Progress
                                </button>
                                <button
                                    className={`chart-tab ${activeChartView === 'class' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveChartView('class');
                                        setClassReadinessRefreshKey(k => k + 1);
                                    }}
                                >
                                    <BiBarChart size={16} />
                                    By Class (Weekly)
                                </button>
                            </div>
                        </div>
                        <div className="chart-container">
                            {activeChartView === 'progress' ? (
                                <ReadinessChart 
                                    readinessScores={readinessScores} 
                                    classHistory={[]} 
                                    viewType="progress"
                                />
                            ) : (
                                <ReadinessChart 
                                    readinessScores={[]} 
                                    classHistory={classReadinessHistory}
                                    viewType="class" 
                                />
                            )}
                        </div>
                    </div>

                    <div className="panel panel-small">
                        <div className="panel-title">Quick Actions</div>
                        <div className="quick-actions">
                            <button className="action-btn primary" onClick={() => navigate('/exampage')}>
                                <BiPlay size={20} />
                                Practice Questions
                            </button>
                            <button className="action-btn secondary" onClick={() => navigate('/testentrance')}>
                                <BiBullseye size={20} />
                                Adaptive Test
                            </button>
                            <button className="action-btn tertiary" onClick={() => handleNavClick('history')}>
                                <BiClipboard size={20} />
                                Study History
                            </button>
                            <button className="action-btn quaternary" onClick={() => handleNavClick('ta')}>
                                <BiBarChart size={20} />
                                My TA
                            </button>
                        </div>
                    </div>

                    <div className="panel panel-medium">
                        <div className="panel-title">Recent Test Sessions</div>
                        {recentTests.length > 0 ? (
                            <table className="student-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Subject</th>
                                        <th>Type</th>
                                        <th>Questions</th>
                                        <th>Accuracy</th>
                                        <th>Readiness</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTests.map((test, index) => (
                                        <tr key={index}>
                                            <td>{test.date}</td>
                                            <td>{test.subject}</td>
                                            <td>
                                                <span className={`test-badge ${test.testType.toLowerCase()}`}>
                                                    {test.testType}
                                                </span>
                                            </td>
                                            <td>{test.totalQuestions}</td>
                                            <td>{test.accuracy}%</td>
                                            <td>
                                                <div className="progress-bar">
                                                    <div className="progress-fill" style={{ width: `${test.finalReadiness}%` }} />
                                                </div>
                                                <span className="progress-text">{test.finalReadiness}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="no-data">
                                <BiClipboard size={48} />
                                <h3>No sessions yet</h3>
                                <p>Complete a practice session or adaptive test to see results here.</p>
                            </div>
                        )}
                    </div>

                    <div className="panel panel-medium">
                        <div className="panel-title">Study Insights</div>
                        <div className="insight-text">
                            {latestReadiness.percentage >= 70 ? (
                                <>You're doing great! Your readiness score is <strong>{latestReadiness.percentage}%</strong>. Keep practicing to maintain your level.</>
                            ) : latestReadiness.percentage >= 50 ? (
                                <>Your readiness is <strong>{latestReadiness.percentage}%</strong>. Focus on your weak areas to improve faster.</>
                            ) : (
                                <>Your readiness is <strong>{latestReadiness.percentage}%</strong>. Regular practice will help you improve quickly.</>
                            )}
                        </div>
                        <div className="insight-actions">
                            <button className="insight-btn ghost" onClick={() => handleNavClick('ta')}>
                                View My TA
                            </button>
                        </div>
                    </div>
                </section>
            </>
        );
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
            if (currentView === 'assignments') {
                return [home, classesCrumb, classCrumb, { label: 'Assignments' }];
            }
            if (currentView === 'assignment-questions' && selectedAssignment) {
                return [home, classesCrumb, classCrumb, { label: 'Assignments', onClick: () => setCurrentView('assignments') }, { label: selectedAssignment.title }];
            }
            if (currentView === 'assignment-review') {
                return [home, classesCrumb, classCrumb, { label: 'Assignments', onClick: () => setCurrentView('assignments') }, { label: selectedAssignment?.title || 'Review' }];
            }
            if (currentView === 'progress') {
                return [home, classesCrumb, classCrumb, { label: 'Progress' }];
            }
        }

        switch (activePage) {
            case 'classes': return [home, { label: 'My Classes' }];
            case 'history': return [home, { label: 'Study History' }];
            case 'ta': return [home, { label: 'My TA' }];
            case 'settings': return [home, { label: 'Settings' }];
            default: return [home];
        }
    };

    // Get page title based on active page
    const getPageTitle = () => {
        switch (activePage) {
            case 'practice': return 'Practice Questions';
            case 'classes': return 'My Classes';
            case 'readiness': return 'Exam Readiness';
            case 'history': return 'Study History';
            case 'settings': return 'Settings';
            default: return 'Student Dashboard';
        }
    };

    return (
        <div className="sd-root">
            {/* Mobile Header with Hamburger */}
            <div className="sd-mobile-header">
                <div className="sd-brand">Examnation</div>
                <button className="sd-mobile-menu-btn" onClick={toggleMobileMenu}>
                    {mobileMenuOpen ? <BiX size={24} /> : <BiMenu size={24} />}
                </button>
            </div>

            {/* Sidebar with mobile overlay */}
            <aside className={`sd-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sd-brand desktop-only">Examnation</div>
                <nav className="sd-nav">
                    <button 
                        className={`sd-nav-item ${activePage === 'overview' ? 'active' : ''}`}
                        onClick={() => handleNavClick('overview')}
                    >
                        <BiHome style={{ marginRight: '8px', fontSize: '18px'}} />
                        Overview
                    </button>
                    <button
                        className="sd-nav-item"
                        onClick={() => navigate('/exampage')}
                    >
                        <BiBookOpen style={{ marginRight: '8px', fontSize: '18px'}} />
                        Practice
                    </button>
                    <button
                        className={`sd-nav-item ${activePage === 'classes' ? 'active' : ''}`}
                        onClick={() => handleNavClick('classes')}
                    >
                        <BiClipboard style={{ marginRight: '8px', fontSize: '18px'}} />
                        My Classes
                    </button>
                    <button
                        className={`sd-nav-item ${activePage === 'history' ? 'active' : ''}`}
                        onClick={() => handleNavClick('history')}
                    >
                        <BiTime style={{ marginRight: '8px', fontSize: '18px'}} />
                        Study History
                    </button>
                    <button
                        className={`sd-nav-item ${activePage === 'ta' ? 'active' : ''}`}
                        onClick={() => handleNavClick('ta')}
                    >
                        <BiBrain style={{ marginRight: '8px', fontSize: '18px'}} />
                        My TA
                    </button>
                    <button
                        className={`sd-nav-item ${activePage === 'settings' ? 'active' : ''}`}
                        onClick={() => handleNavClick('settings')}
                    >
                        <BiCog style={{ marginRight: '8px', fontSize: '18px'}} />
                        Settings
                    </button>
                </nav>
                
                {/* Logout button positioned at bottom of sidebar */}
                <div className="sd-sidebar-bottom">
                    <button
                        className="sd-nav-item logout-btn"
                        onClick={() => logout(navigate)}
                    >
                        <BiLogOut style={{ marginRight: '8px', fontSize: '18px'}} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {mobileMenuOpen && <div className="sd-mobile-overlay" onClick={toggleMobileMenu}></div>}

            <main className="sd-main">
                <header className="sd-header">
                    <h1>{getPageTitle()}</h1>
                    <div className="sd-header-right">
                        <NotificationBell onNavigate={(page) => handleNavClick(page)} />
                        <div className="sd-user">{getStudentDisplayName()}</div>
                    </div>
                </header>
                <Breadcrumb crumbs={getBreadcrumbs()} />

                {error && (
                    <div className="error-notification">
                        ⚠️ Error: {error}
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <h2>Loading Dashboard...</h2>
                        <p>Fetching your data and calculating readiness scores...</p>
                    </div>
                ) : (
                    renderPageContent()
                )}
            </main>
        </div>
    );
}

export default StudentDashboard;
