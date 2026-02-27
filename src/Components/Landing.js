import React, { useState } from "react";
import { getToken } from '../utils/tokenUtils';
import './Landing.css';
import { useNavigate } from 'react-router-dom';
import mainPreview from '../Resources/undraw_online-test_cqv0.svg';
import dashboardPreview from '../Resources/undraw_app-benchmarks_ls0m.svg';
import teacherDashboardPreview from '../Resources/Landing/TeacherDashboardPreview.png';
import logo from '../Resources/ExamNationLogo.svg';
import { motion } from "framer-motion";
import { BiMenu, BiX } from 'react-icons/bi';

export default function ExamNationLanding() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    
    // Add the scrollToSection function
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
        setMobileMenuOpen(false); // Close mobile menu after navigation
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };
    
    const handleLogin = () => {
        // Simulate login (replace with real auth logic)
        setIsLoggedIn(true);
        navigate('/login');
    };

    const handleRegister = () => {
        navigate('/login', { state: { isLogin: false } });
    };

    const handleGetStarted = () => {
        // Check if user is logged in, if not redirect to login
        const token = getToken();
        if (token) {
            // User is logged in, redirect to dashboard
            navigate('/studentdashboard');
        } else {
            // User not logged in, redirect to login
            navigate('/login');
        }
    };

    const handleExploreInsights = () => {
        // Same logic for explore insights
        const token = getToken();
        if (token) {
            navigate('/studentdashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="landing-page">
            <nav className="landing-navbar">
                <div className="navbar-container">
                    <div className="navbar-brand">
                        <h2>ExamNation</h2>
                        <span className="brand-tagline">Elevate Your Learning</span>
                    </div>
                    
                    {/* Desktop Navigation */}
                    <div className="navbar-links desktop-nav">
                        <button className="navbar-signup" onClick={() => scrollToSection('features')}>Features</button>
                        <button className="navbar-signup" onClick={() => scrollToSection('about')}>About</button>
                        <button className="navbar-signup" onClick={() => scrollToSection('contact')}>Contact</button>
                        <button className="navbar-signup" onClick={handleLogin}>Login</button>
                        <button className="navbar-signup" onClick={handleRegister}>Sign Up</button>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                        {mobileMenuOpen ? <BiX size={24} /> : <BiMenu size={24} />}
                    </button>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="mobile-menu">
                        <div className="mobile-menu-content">
                            <button className="mobile-nav-item" onClick={() => scrollToSection('features')}>Features</button>
                            <button className="mobile-nav-item" onClick={() => scrollToSection('about')}>About</button>
                            <button className="mobile-nav-item" onClick={() => scrollToSection('contact')}>Contact</button>
                            <button className="mobile-nav-item" onClick={handleLogin}>Login</button>
                            <button className="mobile-nav-item primary" onClick={handleRegister}>Sign Up</button>
                        </div>
                    </div>
                )}
                
                {/* Mobile Overlay */}
                {mobileMenuOpen && <div className="mobile-overlay" onClick={toggleMobileMenu}></div>}
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="floating-balls-bg">
                    {/* Floating blue circles */}
                    <motion.div
                    className="ball ball1"
                    animate={{ x: [0, 40, -40, 0], y: [0, -20, 20, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                    className="ball ball2"
                    animate={{ x: [0, -30, 30, 0], y: [0, 20, -20, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                    className="ball ball3"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Large circle that settles into background */}
                    <motion.div
                    className="ball main-ball"
                    // initial={{ y: -200, opacity: 0 }}
                    animate={{ x:[0, 50, -50, -25, -5, 0], y: [0, 50, -50, -25, -5, 0], opacity: 1 }}
                    transition={{ duration: 32, repeat: Infinity, repeatType: "reverse",ease: "easeInOut" }}
                    />
                </div>

                <div className="hero-content">
                    <h1>Master Your Exams with Confidence</h1>
                    <p>
                    Track your readiness, get AI-powered feedback, and practice smarter
                    with ExamNation — your all-in-one academic companion.
                    </p>
                    <div className="cta-buttons">
                    <button className="primary" onClick={handleGetStarted}>Get Started</button>
                    <button className="secondary">Watch Demo</button>
                    </div>
                </div>

                <div className="hero-image">
                    <img src={mainPreview} alt="Dashboard preview" />
                </div>
            </section>

            {/* Features Section - Add id for scrolling */}
            <section id="features" className="features">
                <h2>Why Students Love ExamNation</h2>
                <div className="feature-grid">
                    <div className="feature-card">
                        <h3>Personalized Insights</h3>
                        <p>
                            Get detailed analytics on your strengths, weaknesses, and
                            readiness per topic.
                        </p>
                    </div>
                    <div className="feature-card">
                        <h3>AI-Driven Assistance</h3>
                        <p>
                            Your personal Teaching Assistant helps you understand every step
                            of your progress.
                        </p>
                    </div>
                    <div className="feature-card">
                        <h3>Practice that Adapts</h3>
                        <p>
                            Smart question sets evolve with your learning curve to ensure
                            mastery of all exam topics.
                        </p>
                    </div>
                </div>
            </section>
            <section className="practice-preview">
                <div className="practice-content">
                    <h2>Smart Practice Engine</h2>
                    <div className="practice-features">
                        <div className="practice-feature">
                            <div className="feature-icon">📚</div>
                            <h3>Adaptive Questions</h3>
                            <p>AI selects questions based on your current skill level and learning progress.</p>
                        </div>
                        <div className="practice-feature">
                            <div className="feature-icon">🎯</div>
                            <h3>Instant Feedback</h3>
                            <p>Get detailed explanations and step-by-step solutions immediately after each answer.</p>
                        </div>
                        <div className="practice-feature">
                            <div className="feature-icon">📊</div>
                            <h3>Progress Analytics</h3>
                            <p>Track your improvement with detailed statistics and performance insights.</p>
                        </div>
                    </div>
                    <div className="practice-cta">
                        <button className="primary" onClick={handleGetStarted}>Start Practicing Now</button>
                    </div>
                </div>
            </section>

            <section className="insights-preview">
                <div className="dashboard-subsection-L">
                    <h2>Insights Dashboard Preview</h2>
                    <h3>Understand your strengths <br />and weaknesses instantly <br />with our AI-driven analytics.</h3>
                    <ul>
                        <li>Track class-wide performance.</li>
                        <li>Identify at-risk students early.</li>
                        <li>Personalize learning experiences.</li>
                        <li>Make data-driven decisions.</li>
                        <li>Get detailed analytics reports.</li>
                    </ul>
                </div>
                <div className="dashboard-subsection-R">
                    <img src={teacherDashboardPreview} alt="Teacher Insights Dashboard Preview" />
                    {/* <img src={dashboardPreview} alt="Insights Dashboard Preview" /> */}
                    <button className="primary" onClick={handleExploreInsights}>Explore Insights</button>
                </div>
            </section>

            {/* Testimonials - Add id for about section */}
            <section id="about" className="testimonials">
                <h2>Trusted by Students & Schools Across The Caribbean</h2>
                <div className="testimonial-grid">
                    <div className="testimonial">
                        <div className="testimonial-content">
                            <p>
                                "ExamNation helped me boost my Math grade from a C to an A in
                                under 2 months! The adaptive questions really targeted my weak areas."
                            </p>
                        </div>
                        <div className="testimonial-author">
                            <div className="author-avatar">👨‍🎓</div>
                            <div className="author-info">
                                <span className="author-name">Marcus Johnson</span>
                                <span className="author-role">BGCSE Student, Nassau</span>
                            </div>
                        </div>
                    </div>
                    <div className="testimonial">
                        <div className="testimonial-content">
                            <p>
                                "As a teacher, I love how easy it is to track student readiness by
                                topic. The insights help me focus my lessons where they're needed most."
                            </p>
                        </div>
                        <div className="testimonial-author">
                            <div className="author-avatar">👩‍🏫</div>
                            <div className="author-info">
                                <span className="author-name">Mrs. Thompson</span>
                                <span className="author-role">Math Teacher, Freeport High</span>
                            </div>
                        </div>
                    </div>
                    <div className="testimonial">
                        <div className="testimonial-content">
                            <p>
                                "The step-by-step explanations are incredible. My daughter finally
                                understands algebra concepts that confused her for months!"
                            </p>
                        </div>
                        <div className="testimonial-author">
                            <div className="author-avatar">👩‍💼</div>
                            <div className="author-info">
                                <span className="author-name">Sarah Williams</span>
                                <span className="author-role">Parent, Grand Bahama</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer - Add id for contact section */}
            <footer id="contact" className="cta-footer">
                <h2>Join the Next Generation of Learners</h2>
                <button className="primary" onClick={handleRegister}>Sign Up Free</button>
            </footer>
        </div>
    );
}


// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Navbar from './Navbar';
// import '../Styling/Landing.css';


// const LandingPage = () => {
//     const [isLoggedIn, setIsLoggedIn] = useState(false);
//     const navigate = useNavigate();

//     const handleLogin = () => {
//         // Simulate login (replace with real auth logic)
//         setIsLoggedIn(true);
//         navigate('/login');
//     };

//     const handleRegister = () => {
//         navigate('/login', { state: { isLogin: false } });
//     };

//     return (
//         <div className="landing-bg">
//             <main className="landing-main">
//                 <section className="landing-hero">
//                     <h1>Welcome to the Number One Examination Preparation Portal</h1>
//                     <p>
//                         Your one-stop solution for online examinations covering questions from all subjects.
//                     </p>
//                     {!isLoggedIn ? (
//                         <div>
//                             <button className="hero-btn" onClick={handleLogin}>Login</button>
//                             <button className="hero-btn" onClick={handleRegister}>Sign Up</button>
//                         </div>
//                     ) : (
//                         <p>You are logged in!</p>
//                     )}
//                 </section>
//                 <section className="landing-features">
//                     <div className="feature-card" onClick={() => navigate('/exampage')} style={{ cursor: 'pointer' }}>
//                         <h3>Practice Questions</h3>
//                         <p>Access a wide range of CXC, BGCSE and BJC practice questions and detailed answer breakdowns in our library.</p>
//                     </div>
//                     <div className="feature-card" onClick={() => navigate('/progress')} style={{ cursor: 'pointer' }}>
//                         <h3>Progress Tracking</h3>
//                         <p>Monitor your strengths and areas for improvement with smart analytics.</p>
//                     </div>
//                     <div className="feature-card" onClick={() => navigate('/community')} style={{ cursor: 'pointer' }}>
//                         <h3>Community Support</h3>
//                         <p>Connect with educators, parents, and fellow students for guidance and motivation.</p>
//                     </div>
//                 </section>
//                 <section className="landing-HIW">
//                     <div className="HIW-card">
//                         <h2>How It Works</h2>
//                         <ol>
//                             <li>Sign Up: Create an account to get started.</li>
//                             <li>Choose a Subject: Select the subject you want to practice.</li>
//                             <li>Start Practicing: Access a variety of questions and resources.</li>
//                         </ol>
//                     </div>
//                     <div className="HIW-card">
                        
//                     </div>
//                     <div className="HIW-card">
                        
//                     </div>
//                     <div className="HIW-card">
                        
//                     </div>
    
//                 </section>
//             </main>
//             {/* <footer className="landing-footer">
//                 &copy; {new Date().getFullYear()} Medichrona. All rights reserved.
//             </footer> */}
//         </div>
//     );
// };

// export default LandingPage;
