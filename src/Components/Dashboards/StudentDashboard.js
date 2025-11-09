import React, { use, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Si from './Sidebar';
import '../../Styling/Dashboards/StudentDashboard.css';
import Navbar from '../Navbar'
import { useNavigate } from 'react-router-dom';
import { getUserProgress, getStudentAnswers } from './DashboarrdServicing.js'; 
import { abilityEstimate } from './Charts/ReadinessLogic.js';
import defaultAvatar from '../../Resources/default-avatar.jpg';
import ReadinessChart from './Charts/Readiness.js';

// Add these functions above your component or in a separate utils file
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
    console.log('Grouped answers:', grouped);
    return grouped;
};

const processGroupedAnswers = async (groupedAnswers) => {
    const results = [];
    let runningTheta = 0;
    
    const sortedDates = Object.keys(groupedAnswers).sort();
    
    for (const date of sortedDates) {
        const answersForDate = groupedAnswers[date];
        const sessionLength = answersForDate.length;
        
        for (let i = 0; i < answersForDate.length; i++) {
            const answer = answersForDate[i];            
            
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
                attemptMode: answer.attemptMode || 'practice' // Add this line
            });
        }
    }
    
    return results;
};

const StudentDashboard = () => {
    const location = useLocation();
    const [student, setStudent] = useState({});
    const [studentprogress, setStudentProgress] = useState({});
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [loading, setLoading] = useState(true); // Start with true
    const [studentAnswers, setStudentAnswers] = useState([]);
    const [qAnswered, setQAnswered] = useState(0);
    const [correctAns, setCorrectAns] = useState(0);
    const [averageCorrectness, setAverageCorrectness] = useState(0);
    const [studentId, setStudentId] = useState(null);
    const [readinessScores, setReadinessScores] = useState([]);

    // REMOVE the duplicate useEffects and keep only this one
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const payload = JSON.parse(atob(token.split('.')[1]));
        const id = payload.sub;
        setStudentId(id);

        const fetchAllData = async () => {
            if (!id) return;
            
            setLoading(true); // Set loading to true at start
            
            try {
                console.log('Starting data fetch...');
                
                // Fetch all data in parallel
                const [studentResponse, progressResponse, answersResponse] = await Promise.all([
                    fetch(`https://examnationwebapi.azurewebsites.net/api/user/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }),
                    fetch(`https://examnationwebapi.azurewebsites.net/api/userprogress/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }),
                    getStudentAnswers(id)
                ]);

                console.log('API calls completed');

                // Process student data
                if (studentResponse.ok) {
                    const studentData = await studentResponse.json();
                    setStudent(studentData);
                    console.log('Student data loaded');
                } else {
                    console.error('Student API error:', studentResponse.status);
                    setStudent({});
                }

                // Process progress data (skip if 404)
                if (progressResponse.ok) {
                    const progressData = await progressResponse.json();
                    setStudentProgress(progressData);
                    console.log('Progress data loaded');
                } else {
                    console.warn('Progress API warning:', progressResponse.status);
                    setStudentProgress({});
                }

                // Process answers and calculate statistics
                setStudentAnswers(answersResponse);
                setQAnswered(answersResponse.length);
                const correctAnswersCount = answersResponse.filter(answer => answer.isCorrect).length;
                setCorrectAns(correctAnswersCount);
                setAverageCorrectness(answersResponse.length ? (correctAnswersCount / answersResponse.length) * 100 : 0);
                
                console.log('Basic statistics calculated');

                // Group answers by date and process with abilityEstimate
                if (answersResponse.length > 0) {
                    console.log('Processing readiness scores...');
                    const groupedByDate = groupAnswersByDate(answersResponse);
                    const readinessResults = await processGroupedAnswers(groupedByDate);
                    setReadinessScores(readinessResults);
                    console.log('Readiness scores processed:', readinessResults.length);
                } else {
                    console.log('No answers to process');
                    setReadinessScores([]);
                }

                console.log('All data processing completed');

            } catch (error) {
                console.error('Error fetching data:', error);
                setStudent({});
                setStudentProgress({});
                setStudentAnswers([]);
                setReadinessScores([]);
            } finally {
                // Only set loading to false after ALL processing is complete
                setLoading(false);
                console.log('Loading completed');
            }
        };

        fetchAllData();
    }, [token, navigate]);

    // Helper function to get the latest readiness info
    const getLatestReadiness = () => {
        if (!readinessScores || readinessScores.length === 0) {
            return {
                estimate: 0,
                level: 'No Data',
                percentage: 0
            };
        }
        
        const lastScore = readinessScores[readinessScores.length - 1];
        const estimate = lastScore.abilityEstimate;
        const percentage = Math.max(0, Math.min(100, ((estimate + 3) / 6) * 100));
        
        let level;
        if (percentage >= 85) level = "Ready";
        else if (percentage >= 70) level = "Nearly Ready";
        else if (percentage >= 50) level = "Developing";
        else if (percentage >= 30) level = "Needs Practice";
        else level = "Beginner";
        
        return {
            estimate: estimate,
            level: level,
            percentage: Math.round(percentage)
        };
    };

    // Add this function before the return statement in StudentDashboard component
    const getRecentTests = () => {
        if (!readinessScores || readinessScores.length === 0) {
            return [];
        }
        
        // Group readiness scores by date to create test sessions
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
            // Keep updating the final readiness (will be the last one for that date)
            testSessions[score.date].finalReadiness = score.abilityEstimate;
        });
        
        // Convert to array and add calculated fields
        const tests = Object.values(testSessions).map(session => {
            const correctAnswers = session.questions.filter(q => q.isCorrect).length;
            const totalQuestions = session.questions.length;
            const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
            
            // Calculate average difficulty
            const difficultyMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
            const avgDifficultyNum = session.questions.reduce((sum, q) => {
                return sum + (difficultyMap[q.difficulty] || 2);
            }, 0) / session.questions.length;
            
            let avgDifficulty = 'Medium';
            if (avgDifficultyNum <= 1.3) avgDifficulty = 'Easy';
            else if (avgDifficultyNum >= 2.7) avgDifficulty = 'Hard';
            
            // Convert ability estimate to percentage
            const finalReadinessPercentage = Math.max(0, Math.min(100, ((session.finalReadiness + 3) / 6) * 100));
            
            const testType = session.questions[0].attemptMode || 'practice';

            let displayTestType='Practice';
            if(testType==='adaptive_test'){
                displayTestType='Adaptive';
            } else {
                displayTestType='Practice';
            }

            return {
                date: new Date(session.date).toLocaleDateString(),
                totalQuestions,
                correctAnswers,
                accuracy,
                avgDifficulty,
                finalReadiness: Math.round(finalReadinessPercentage),
                testType: displayTestType,
                rawDate: session.date // Keep for sorting
            };
        });
        
        // Sort by date (most recent first) and return top 5
        return tests
            .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate))
            .slice(0, 5);
    };

    // Show loading screen while data is being fetched
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <h2>Loading Dashboard...</h2>
                    <p>Fetching your data and calculating readiness scores...</p>
                </div>
            </div>
        );
    }

    // Show login redirect if no token
    if (!token) {
        return null; // Will redirect in useEffect
    }

    const latestReadiness = getLatestReadiness();

    return (
        <>
            <Navbar />
            <div className="dashboard-layout">
                <div className="dashboard-content">
                    <aside className="dashboard-sidebar">
                        <div className="user-info">
                            <h3>Readiness</h3>
                            <div className="readiness-square">
                                <p className='readiness-percentage'>{latestReadiness.percentage}%</p>
                                <p className='readiness-level'>{latestReadiness.level}</p>
                            </div>
                            <button className="edit-profile-button" onClick={() => navigate('/testentrance')}>
                                Start new Adaptive Test
                            </button>
                        </div>
                        <div className="user-info">
                            <p>Questions Answered: {qAnswered || 0}</p>
                            <p>Correct Answers: {correctAns || 0}</p>
                            <p>Accuracy: {qAnswered ? ((correctAns / qAnswered) * 100).toFixed(2) : '0.00'}%</p>
                        </div>
                        <div className="user-info">
                            <h3>Your Progress</h3>
                            <button onClick={() => navigate('/tapagestudent')}>Your Analytics</button>
                        </div>
                    </aside>
                    
                    <main className="dashboard-main">
                        <div className="dashboard-container">
                            <div>
                                <ReadinessChart readinessScores={readinessScores} />
                            </div>
                            <div className="dahsboard-section">
                                <div className="dashboard-subsection">
                                    <div className="recent-tests">
                                        <h3>Recent Tests</h3>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Test type</th>
                                                    <th>Questions</th>
                                                    <th>Readiness</th>
                                                </tr>  
                                            </thead>
                                            <tbody>
                                                {getRecentTests().map((test, index) => (
                                                    <tr key={index}>
                                                        <td>{new Date(test.date).toLocaleDateString()}</td>
                                                        <td>{test.testType}</td>
                                                        <td>{test.totalQuestions}</td>
                                                        <td>{test.finalReadiness}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="next-steps">
                                        <h3>Next Steps</h3>

                                    </div>
                                </div>
                            <div className="dashboard-section">
                                <h3>Quick Actions</h3>
                                <button onClick={() => navigate('/exampage')}>Practice Questions</button>
                                <button onClick={() => navigate('/testentrance')}>Take an adaptive test</button>
                                <button onClick={() => navigate('/fullreview')}>Review Answers</button>
                                <button onClick={() => navigate('/updateprofile')}>Update Profile</button>
                            </div>
                            
                                <div className="dashboard-section">
                                    <h3>Recommended for You</h3>
                                    <p>Try a new set of Math questions!</p>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default StudentDashboard;