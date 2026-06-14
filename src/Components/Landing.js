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
import { FaInstagram, FaTwitter, FaTiktok, FaLinkedin } from 'react-icons/fa';
import BentoFeatures from './BentoFeatures';
import VideoModal from "./Dashboards/VideoModal";

export default function ExamNationLanding() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        title: '',
        schoolName: '',
        request: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

    //video modal
    const [demoVideoUrl, setDemoVideoUrl] = useState("");
    
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                schoolName: formData.schoolName,
                title: formData.title,
                request: formData.request,
                submittedAt: new Date().toISOString(),
            };
            const response = await fetch(`${process.env.REACT_APP_API_URL}/demo-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Request failed');
            setSubmitStatus('success');
            setFormData({ email: '', firstName: '', lastName: '', title: '', schoolName: '', request: '' });
        } catch (error) {
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
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
                        <span className="brand-tagline">Where Schools and Students Prepare to Win</span>
                    </div>
                    
                    {/* Desktop Navigation */}
                    <div className="navbar-links desktop-nav">
                        <button className="navbar-signup" onClick={() => scrollToSection('features')}>Features</button>
                        <button className="navbar-signup" onClick={() => scrollToSection('about')}>About</button>
                        <button className="navbar-signup" onClick={() => scrollToSection('contact')}>Contact</button>
                        <button className="navbar-signup" onClick={handleLogin}>Login</button>
                        <button className="navbar-pilot-btn" onClick={() => navigate('/pilot')}>Join Pilot →</button>
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
                            <button className="mobile-nav-item primary" onClick={() => navigate('/pilot')}>Join Pilot →</button>
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
                    <h1>One bad exam season doesn't have to define a student.</h1>
                    <p>
                    ExamNation gives students the tools to practice smarter, teachers the insight to intervene early, and parents the visibility to stay involved — all in one platform built for the Caribbean.
                    </p>
                    <div className="cta-buttons">
                    <button className="primary" onClick={handleGetStarted}>Get Started</button>
                    <button className="secondary" onClick={() => setDemoVideoUrl("/Examnation-Demo-Video.mov")}>Watch Demo</button>
                    </div>
                </div>

                <div className="hero-image">
                    <img src={mainPreview} alt="Dashboard preview" />
                </div>
            </section>

            {/* Features Section */}
            <BentoFeatures />
            <section className="practice-preview">
                <div className="practice-content">
                    <h2>Practice That Actually Prepares You</h2>
                    <div className="practice-features">
                        <div className="practice-feature">
                            <div className="feature-icon">📚</div>
                            <h3>BGCSE-Aligned Questions</h3>
                            <p>Every question is built around the curriculum you're actually being tested on. No filler, no guessing what's relevant.</p>
                        </div>
                        <div className="practice-feature">
                            <div className="feature-icon">🎯</div>
                            <h3>Instant, Detailed Feedback</h3>
                            <p>Don't just see the right answer — understand why. Step-by-step breakdowns help you learn from every mistake.</p>
                        </div>
                        <div className="practice-feature">
                            <div className="feature-icon">📊</div>
                            <h3>Know Where You Stand</h3>
                            <p>Your readiness score updates as you practice. You'll always know which topics need more work before exam day.</p>
                        </div>
                    </div>
                    <div className="practice-cta">
                        <button className="primary" onClick={() => navigate('/exampage')}>Start Practicing Now</button>
                    </div>
                </div>
            </section>

            <section className="insights-preview">
                <div className="dashboard-subsection-L">
                    <h2>Know Who Needs Help Before It's Too Late</h2>
                    <h3>Real-time readiness data <br />across every student, <br />every topic, every week.</h3>
                    <ul>
                        <li>See class-wide readiness at a glance.</li>
                        <li>Spot struggling students before exam season.</li>
                        <li>Assign targeted practice by topic.</li>
                        <li>Make data-driven decisions with confidence.</li>
                        <li>Built around the BGCSE curriculum.</li>
                    </ul>
                </div>
                <div className="dashboard-subsection-R">
                    <img src={teacherDashboardPreview} alt="Teacher Insights Dashboard Preview" />
                    {/* <img src={dashboardPreview} alt="Insights Dashboard Preview" /> */}
                    <button className="primary" onClick={handleExploreInsights}>Explore Insights</button>
                </div>
            </section>

            {/* ── Pilot Program Section ── */}
            <section id="about" className="pilot-section">
                <div className="pilot-inner">
                    <div className="pilot-badge">🚀 Limited Spots Available</div>
                    <h2>Be One of the First Schools to Try Examnation</h2>
                    <p>
                        We're opening up a free pilot program for a small number of schools in The Bahamas.
                        Get full platform access, hands-on onboarding, and a direct line to our team —
                        at no cost.
                    </p>
                    <div className="pilot-perks">
                        <div className="pilot-perk">
                            <span className="perk-icon">✓</span>
                            <div>
                                <strong>Free during the pilot</strong>
                                <span>Full access for your teachers and students, no credit card needed.</span>
                            </div>
                        </div>
                        <div className="pilot-perk">
                            <span className="perk-icon">✓</span>
                            <div>
                                <strong>Dedicated onboarding</strong>
                                <span>We'll set up your school, train your staff, and be available throughout.</span>
                            </div>
                        </div>
                        <div className="pilot-perk">
                            <span className="perk-icon">✓</span>
                            <div>
                                <strong>Early adopter pricing — locked in forever</strong>
                                <span>Pilot schools keep a special rate when we go to paid plans.</span>
                            </div>
                        </div>
                    </div>
                    <button className="pilot-apply-btn" onClick={() => navigate('/pilot')}>
                        Apply for the Pilot →
                    </button>
                    <p className="pilot-note">Takes less than 2 minutes. We'll reach out within 24 hours.</p>
                </div>
            </section>

            {/* CTA Footer - Add id for contact section */}
            <footer id="contact" className="cta-footer">
                <div className="cta-content">
                    <div className="cta-header">
                        <h2>Exam season is coming. Is your school ready?</h2>
                        <p>Join schools across the Caribbean using ExamNation to give every student a real shot at success. Request a demo and we'll reach out within 24 hours.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="demo-form">
                        <div className="form-row">
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        
                        <input 
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                        
                        <div className="form-row">
                            <input
                                type="text"
                                name="schoolName"
                                placeholder="School Name"
                                value={formData.schoolName}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                type="text"
                                name="title"
                                placeholder="Job Title (optional)"
                                value={formData.title}
                                onChange={handleInputChange}
                            />
                        </div>
                        
                        <textarea
                            name="request"
                            placeholder="Tell us about your needs (optional)"
                            value={formData.request}
                            onChange={handleInputChange}
                            rows="3"
                        />
                        
                        <button 
                            type="submit" 
                            className="submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Sending...' : 'Request Demo'}
                        </button>
                        
                        {submitStatus === 'success' && (
                            <div className="success-message">
                                ✓ Request sent! We'll contact you within 24 hours.
                            </div>
                        )}
                        
                        {submitStatus === 'error' && (
                            <div className="error-message">
                                ⚠ Something went wrong. Please try again.
                            </div>
                        )}
                    </form>
                    
                    <div className="alt-option">
                        <span>or</span>
                        <button className="login-btn" onClick={handleLogin}>Login to Explore</button>
                    </div>
                </div>
                <div className="footer-bottom">
                    <div className="social-icons">
                        <a href="https://www.instagram.com/tryexamnation/" target="_blank" rel="noopener noreferrer"><FaInstagram size={30} /></a>
                        {/* <a href="https://www.facebook.com/examnationapp" target="_blank" rel="noopener noreferrer"><FaFacebook size={30} /></a> */}
                        <a href="https://www.linkedin.com/products/loftier-goals-software-examnation/" target="_blank" rel="noopener noreferrer"><FaLinkedin size={30} /></a>
                    </div>
                    <p className="footer-copyright">
                        &copy; {new Date().getFullYear()} Lofty Goals Software. All rights reserved.
                        Examnation is a product of Lofty Goals Software.
                    </p>
                    <p className="footer-contact">
                        Contact us: <a href="mailto:contactloftygoals@gmail.com">contactloftygoals@gmail.com</a>
                    </p>
                </div>
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
