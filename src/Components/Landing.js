import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../Styling/Landing.css';


const LandingPage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    const handleLogin = () => {
        // Simulate login (replace with real auth logic)
        setIsLoggedIn(true);
        navigate('/login');
    };

    const handleRegister = () => {
        navigate('/login', { state: { isLogin: false } });
    };

    return (
        <div className="landing-bg">
            <main className="landing-main">
                <section className="landing-hero">
                    <h1>Welcome to the Number One Examination Preparation Portal</h1>
                    <p>
                        Your one-stop solution for online examinations covering questions from all subjects.
                    </p>
                    {!isLoggedIn ? (
                        <div>
                            <button className="hero-btn" onClick={handleLogin}>Login</button>
                            <button className="hero-btn" onClick={handleRegister}>Sign Up</button>
                        </div>
                    ) : (
                        <p>You are logged in!</p>
                    )}
                </section>
                <section className="landing-features">
                    <div className="feature-card" onClick={() => navigate('/questions')} style={{ cursor: 'pointer' }}>
                        <h3>Practice Questions</h3>
                        <p>Access a wide range of CXC, BGCSE and BJC practice questions and detailed answer breakdowns.</p>
                    </div>
                    <div className="feature-card" onClick={() => navigate('/progress')} style={{ cursor: 'pointer' }}>
                        <h3>Progress Tracking</h3>
                        <p>Monitor your strengths and areas for improvement with smart analytics.</p>
                    </div>
                    <div className="feature-card" onClick={() => navigate('/community')} style={{ cursor: 'pointer' }}>
                        <h3>Community Support</h3>
                        <p>Connect with educators, parents, and fellow students for guidance and motivation.</p>
                    </div>
                </section>
                <section className="landing-HIW">
                    <div className="HIW-card">
                        <h2>How It Works</h2>
                        <ol>
                            <li>Sign Up: Create an account to get started.</li>
                            <li>Choose a Subject: Select the subject you want to practice.</li>
                            <li>Start Practicing: Access a variety of questions and resources.</li>
                        </ol>
                    </div>
                    <div className="HIW-card">
                        
                    </div>
                    <div className="HIW-card">
                        
                    </div>
                    <div className="HIW-card">
                        
                    </div>
    
                </section>
            </main>
            {/* <footer className="landing-footer">
                &copy; {new Date().getFullYear()} Medichrona. All rights reserved.
            </footer> */}
        </div>
    );
};

export default LandingPage;