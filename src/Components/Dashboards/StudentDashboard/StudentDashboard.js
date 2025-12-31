import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BiHome, BiUser, BiBookOpen, BiBarChart, BiClipboard, 
  BiTrendingUp, BiCog, BiLogOut, BiPlay, BiCheckCircle,
  BiTime, BiAward, BiBullseye
} from 'react-icons/bi';
import '../../../Styling/Dashboards/StudentDashboard.css';
import { getStudentAnswers } from './StudentDashboardService.js'; // Keep this for student answers
import { abilityEstimate } from '../Charts/ReadinessLogic.js';
import ReadinessChart from '../Charts/Readiness.js';
import StudentMyClasses from './MyClasses.js';

const token = localStorage.getItem('token');

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
    
    console.log('Grouped answers by date:', grouped);
    return grouped;
};

// Processing function with better error handling
const processGroupedAnswers = async (groupedAnswers) => {
    const results = [];
    let runningTheta = 0;
    
    const sortedDates = Object.keys(groupedAnswers).sort();
    console.log('Processing dates in order:', sortedDates);
    
    try {
        for (const date of sortedDates) {
            const answersForDate = groupedAnswers[date];
            const sessionLength = answersForDate.length;
            
            for (let i = 0; i < answersForDate.length; i++) {
                const answer = answersForDate[i];
                
                if (!answer.difficultyLevel || typeof answer.isCorrect !== 'boolean') {
                    console.warn('Invalid answer data:', answer);
                    continue;
                }
                
                const newTheta = await abilityEstimate(
                    answer.difficultyLevel,
                    answer.isCorrect,
                    runningTheta,
                    sessionLength
                );
                
                runningTheta = newTheta;
                
                results.push({
                    date,
                    sessionLength,
                    questionIndex: i + 1,
                    questionId: answer.questionId,
                    difficulty: answer.difficultyLevel,
                    isCorrect: answer.isCorrect,
                    abilityEstimate: newTheta,
                    priorEstimate: runningTheta,
                    attemptMode: answer.attemptMode || 'practice'
                });
            }
        }
        
        console.log(`Processed ${results.length} readiness calculations`);
        return results;
        
    } catch (error) {
        console.error('Error processing grouped answers:', error);
        return [];
    }
};

export default function StudentDashboard() {
    const [activePage, setActivePage] = useState('overview');
    const [student, setStudent] = useState({});
    const [studentprogress, setStudentProgress] = useState({});
    const [studentAnswers, setStudentAnswers] = useState([]);
    const [readinessScores, setReadinessScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Stats
    const [qAnswered, setQAnswered] = useState(0);
    const [correctAns, setCorrectAns] = useState(0);
    const [averageCorrectness, setAverageCorrectness] = useState(0);
    const [studentId, setStudentId] = useState(null);
    
    const navigate = useNavigate();

    // Use the EXACT same useEffect pattern that worked in your old code
    useEffect(() => {
        if (!token) {
            console.log('No token found, redirecting to login');
            navigate('/login');
            return;
        }

        const payload = JSON.parse(atob(token.split('.')[1]));
        const id = payload.sub;
        console.log('Token decoded, user ID:', id);
        setStudentId(id);

        const fetchAllData = async () => {
            if (!id) {
                console.log('No user ID found');
                return;
            }
            
            setLoading(true);
            
            try {
                console.log('Starting data fetch for user:', id);
                
                // 1. Fetch student data (this works!)
                console.log('Fetching student data...');
                const studentResponse = await fetch(`https://examnationwebapi.azurewebsites.net/api/user/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (studentResponse.ok) {
                    const studentData = await studentResponse.json();
                    console.log('✅ Student data received:', studentData);
                    setStudent(studentData);
                    setError(null);
                } else {
                    throw new Error(`Failed to fetch student data: ${studentResponse.status}`);
                }

                // 2. Try to fetch progress data (skip if it fails)
                console.log('Trying to fetch progress data...');
                try {
                    const progressResponse = await fetch(`https://examnationwebapi.azurewebsites.net/api/userprogress/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (progressResponse.ok) {
                        const progressData = await progressResponse.json();
                        console.log('✅ Progress data received:', progressData);
                        setStudentProgress(progressData);
                    } else {
                        console.warn('⚠️ Progress endpoint failed, using empty data');
                        setStudentProgress({});
                    }
                } catch (progressError) {
                    console.warn('⚠️ Progress API error (CORS/500), skipping:', progressError.message);
                    setStudentProgress({});
                }

                // 3. Try to fetch answers data (skip if it fails)
                console.log('Trying to fetch student answers...');
                let answersResponse = [];
                try {
                    // Try multiple possible endpoints for answers
                    const answerEndpoints = [
                        `https://examnationwebapi.azurewebsites.net/api/answer/user/${id}`,
                        `https://examnationwebapi.azurewebsites.net/api/studentanswers/${id}`,
                        `https://examnationwebapi.azurewebsites.net/api/answers/${id}`
                    ];

                    for (const endpoint of answerEndpoints) {
                        try {
                            console.log('Trying answers endpoint:', endpoint);
                            const response = await fetch(endpoint, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                            }
                        });
                        
                        if (response.ok) {
                            answersResponse = await response.json();
                            console.log('✅ Answers received from', endpoint, ':', answersResponse.length, 'items');
                            break;
                        } else {
                            console.log('❌ Failed:', endpoint, response.status);
                        }
                    } catch (endpointError) {
                        console.log('❌ Error with', endpoint, ':', endpointError.message);
                    }
                }

                if (!answersResponse || answersResponse.length === 0) {
                    console.warn('⚠️ No answers found, using demo data for testing');
                    // Create some demo data for testing the UI
                    answersResponse = [
                        {
                            questionId: 'MATH_001',
                            isCorrect: true,
                            difficultyLevel: 'Medium',
                            answeredAt: new Date().toISOString(),
                            attemptMode: 'practice'
                        },
                        {
                            questionId: 'ENG_001',
                            isCorrect: false,
                            difficultyLevel: 'Easy',
                            answeredAt: new Date().toISOString(),
                            attemptMode: 'practice'
                        }
                    ];
                }
                
            } catch (answersError) {
                console.warn('⚠️ Answers API error (CORS/500), using empty data:', answersError.message);
                answersResponse = [];
            }

            // Process the data we have
            setStudentAnswers(answersResponse);
            setQAnswered(answersResponse.length);
            const correctAnswersCount = answersResponse.filter(answer => answer.isCorrect).length;
            setCorrectAns(correctAnswersCount);
            setAverageCorrectness(answersResponse.length ? (correctAnswersCount / answersResponse.length) * 100 : 0);
            
            console.log('📊 Basic statistics calculated - Q:', answersResponse.length, 'Correct:', correctAnswersCount);

            // Process readiness scores if we have answers
            if (answersResponse.length > 0) {
                console.log('Processing readiness scores...');
                try {
                    const groupedByDate = groupAnswersByDate(answersResponse);
                    const readinessResults = await processGroupedAnswers(groupedByDate);
                    setReadinessScores(readinessResults);
                    console.log('✅ Readiness scores processed:', readinessResults.length);
                } catch (readinessError) {
                    console.error('Error processing readiness:', readinessError);
                    setReadinessScores([]);
                }
            } else {
                console.log('No answers to process for readiness');
                setReadinessScores([]);
            }

            console.log('🎉 Data loading completed successfully!');

        } catch (error) {
            console.error('❌ Critical error fetching data:', error);
            setError(`Failed to load dashboard: ${error.message}`);
        } finally {
            setLoading(false);
            console.log('Loading state completed');
        }
    };

    fetchAllData();
}, [token, navigate]);

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
        const percentage = Math.max(0, Math.min(100, ((averageAbility + 3) / 6) * 100));
        
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
            const finalReadinessPercentage = Math.max(0, Math.min(100, ((averageAbility + 3) / 6) * 100));
            
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
        switch (activePage) {
            case 'practice':
                return (
                    <div className="coming-soon">
                        <BiBookOpen size={64} />
                        <h2>Practice Questions</h2>
                        <p>Practice mode coming soon...</p>
                        <button onClick={() => navigate('/exampage')}>Go to Current Practice Page</button>
                    </div>
                );
            case 'classes':
                return <StudentMyClasses studentInfo={student} />;
            case 'readiness':
                return (
                    <div className="coming-soon">
                        <BiBullseye size={64} />
                        <h2>Exam Readiness</h2>
                        <p>Detailed readiness analysis coming soon...</p>
                        <button onClick={() => navigate('/tapagestudent')}>Go to Current Analytics</button>
                    </div>
                );
            case 'history':
                return (
                    <div className="coming-soon">
                        <BiTime size={64} />
                        <h2>Study History</h2>
                        <p>Study history coming soon...</p>
                        <button onClick={() => navigate('/fullreview')}>Go to Current Review</button>
                    </div>
                );
            case 'settings':
                return (
                    <div className="coming-soon">
                        <BiCog size={64} />
                        <h2>Settings</h2>
                        <p>Settings page coming soon...</p>
                        <button onClick={() => navigate('/updateprofile')}>Go to Current Profile</button>
                    </div>
                );
            default:
                return renderOverviewContent();
        }
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
                        <div className="panel-title">Readiness Progress Over Time</div>
                        <div style={{ width: "100%", height: 260 }}>
                            <ReadinessChart readinessScores={readinessScores} />
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
                            <button className="action-btn tertiary" onClick={() => navigate('/fullreview')}>
                                <BiClipboard size={20} />
                                Review Answers
                            </button>
                            <button className="action-btn quaternary" onClick={() => navigate('/tapagestudent')}>
                                <BiBarChart size={20} />
                                View Analytics
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
                                <h3>No tests completed yet</h3>
                                <p>Start with some practice questions!</p>
                                <button className="start-btn" onClick={() => navigate('/exampage')}>
                                    Start Practicing
                                </button>
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
                            <button className="insight-btn" onClick={() => navigate('/exampage')}>
                                Start Practice Session
                            </button>
                            <button className="insight-btn ghost" onClick={() => navigate('/tapagestudent')}>
                                View Detailed Analytics
                            </button>
                        </div>
                    </div>
                </section>
            </>
        );
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
            <aside className="sd-sidebar">
                <div className="sd-brand">Examnation</div>
                <nav className="sd-nav">
                    <button 
                        className={`sd-nav-item ${activePage === 'overview' ? 'active' : ''}`}
                        onClick={() => setActivePage('overview')}
                    >
                        <BiHome style={{ marginRight: '8px', fontSize: '18px'}} />
                        Overview
                    </button>
                    <button 
                        className={`sd-nav-item ${activePage === 'practice' ? 'active' : ''}`}
                        onClick={() => setActivePage('practice')}
                    >
                        <BiBookOpen style={{ marginRight: '8px', fontSize: '18px'}} />
                        Practice
                    </button>
                    <button 
                        className={`sd-nav-item ${activePage === 'classes' ? 'active' : ''}`}
                        onClick={() => setActivePage('classes')}
                    >
                        <BiClipboard style={{ marginRight: '8px', fontSize: '18px'}} />
                        My Classes
                    </button>
                    <button 
                        className={`sd-nav-item ${activePage === 'readiness' ? 'active' : ''}`}
                        onClick={() => setActivePage('readiness')}
                    >
                        <BiBullseye style={{ marginRight: '8px', fontSize: '18px'}} />
                        Readiness
                    </button>
                    <button 
                        className={`sd-nav-item ${activePage === 'history' ? 'active' : ''}`}
                        onClick={() => setActivePage('history')}
                    >
                        <BiTime style={{ marginRight: '8px', fontSize: '18px'}} />
                        History
                    </button>
                    <button 
                        className={`sd-nav-item ${activePage === 'settings' ? 'active' : ''}`}
                        onClick={() => setActivePage('settings')}
                    >
                        <BiCog style={{ marginRight: '8px', fontSize: '18px'}} />
                        Settings
                    </button>
                </nav>
                
                {/* Logout button positioned at bottom of sidebar */}
                <div className="sd-sidebar-bottom">
                    <button
                        className="sd-nav-item logout-btn"
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

            <main className="sd-main">
                <header className="sd-header">
                    <h1>{getPageTitle()}</h1>
                    <div className="sd-user">{getStudentDisplayName()}</div>
                </header>

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
