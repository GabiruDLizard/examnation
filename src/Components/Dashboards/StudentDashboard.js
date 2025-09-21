import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../Styling/Dashboards/StudentDashboard.css';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    const location = useLocation();
    // Get student ID from navigation state or localStorage
    //const studentId = location.state?.id || localStorage.getItem('studentId');
    const [student, setStudent] = useState({});
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
            fetchStudentData();
        }
    }, [token]);

    return (
        <div className="dashboard-layout">
            <Sidebar />
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
                        <button>Practice Questions</button>
                        <button>Review Answers</button>
                        <button>Update Profile</button>
                    </div>
                    <div className="dashboard-section">
                        <h3>Recommended for You</h3>
                        <p>Try a new set of CXC Math questions!</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;