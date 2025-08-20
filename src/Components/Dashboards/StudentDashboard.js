import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../Styling/Dashboards/StudentDashboard.css';

const StudentDashboard = () => {
    const location = useLocation();
    const student = location.state || {};

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