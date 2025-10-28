import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../Styling/Dashboards/StudentDashboard.css';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../../Resources/default-avatar.jpg';

const StudentDashboard = () => {
    const location = useLocation();
    // Get student ID from navigation state or localStorage
    //const studentId = location.state?.id || localStorage.getItem('studentId');
    const [student, setStudent] = useState({});
    const [studentprogress, setStudentProgress] = useState({});
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [loading, setLoading] = useState(true);
    //const payload = JSON.parse(atob(token.split('.')[1]));
    //const studentId = payload.sub;

    useEffect(() => {
        if(!token){
            navigate('/login');
        }
        else{
            const payload = JSON.parse(atob(token.split('.')[1]));
            const studentId = payload.sub;

            // if (!studentId) {
            //     navigate('/login');
            //     return;
            // }
            // if (payload.role !== 'student') {
            //     navigate('/login');
            //     return;
            // }
            const fetchStudentData = async () => {
                if (!studentId) return;
                try {
                    const response = await fetch(`https://examnationwebapi.azurewebsites.net/api/user/${studentId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setStudent(data);
                    }
                } catch (error) {
                    setStudent({});
                } finally {
                    setLoading(false);
                }
            };
            const fetchStudentProgress = async () => {
                if (!studentId) return;
                try {
                    const response = await fetch(`https://examnationwebapi.azurewebsites.net/api/userprogress/${studentId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setStudentProgress(data);
                    }
                } catch (error) {
                    setStudentProgress({});
                }
            };
            fetchStudentData();
            fetchStudentProgress();
        }
    }, [token]);

    if(token){
        return (
            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <div className="user-info">
                        <img src={defaultAvatar} alt="Avatar" className="userAvatar"/>
                        <h3>{student?.firstName || 'Student'}</h3>
                        <p>{student?.username || 'No Username'}</p>
                        <button className="edit-profile-button" onClick={() => {localStorage.removeItem('token'); navigate('/login');}}>Edit Profile</button>
                    </div>
                    <div className="user-info">
                        <p>Questions Answered: {student?.questionsAnswered || 0}</p>
                        <p>Correct Answers: {student?.correctAnswers || 0}</p>
                        <p>Accuracy: {student?.questionsAnswered ? ((student.correctAnswers / student.questionsAnswered) * 100).toFixed(2) : '0.00'}%</p>
                    </div>
                </aside>
                {/* <Sidebar /> */}
                <main className="dashboard-main">
                    <div className="dashboard-container">
                        <h2>Welcome, {student?.firstName || 'Student'}!</h2>
                        <div className="dashboard-section">
                            <h3>Your Progress</h3>
                            <ul>
                                <li>Setup Complete: {student?.setupComplete ? 'Yes' : 'No'}</li>
                                <li>Questions Practiced: {student?.questionsPracticed || 0}</li>
                                <li>Correct Answers: {student?.correctAnswers || 0}</li>
                            </ul>
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
                </main>
            </div>
        );
    } else {
        window.location.href = '/login';
    }
};

export default StudentDashboard;