import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Authentication/Auth.css';
import logo from '../Resources/ExamNationIcon.svg';

const PilotRegister = () => {
    const [firstName,  setFirstName]  = useState('');
    const [lastName,   setLastName]   = useState('');
    const [email,      setEmail]      = useState('');
    const [phone,      setPhone]      = useState('');
    const [school,     setSchool]     = useState('');
    const [students,   setStudents]   = useState('');
    const [role,       setRole]       = useState('');
    const [painPoints, setPainPoints] = useState('');
    const [solution,   setSolution]   = useState('');
    const [isLoading,  setIsLoading]  = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbw4UUCHy3T7q0BcA_cjz_qOwlhIeQRWhWdwT5w6OU6zsMtI-SbTp45jAZ-an3ajJ3V60Q/exec';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');
        setSubmitStatus(null);

        try {
            const payload = {
                firstName,
                lastName,
                email,
                phone,
                schoolName: school,
                numberOfStudents: students,
                role,
                painPoints,
                currentSolution: solution,
            };

            await fetch(SHEET_URL, {
                method: 'POST',
                mode:  'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            setSubmitStatus('success');
            setFirstName(''); setLastName(''); setEmail(''); setPhone('');
            setSchool(''); setStudents(''); setRole(''); setPainPoints(''); setSolution('');
        } catch {
            setSubmitStatus('error');
            setErrorMessage('Something went wrong. Please try again or email us directly at contactloftygoals@gmail.com.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-split pilot-layout">

            {/* ── Left branding panel ── */}
            <div className="auth-panel-left">
                <div className="auth-brand" onClick={() => navigate('/')}>
                    <img src={logo} alt="ExamNation" />
                    <span className="auth-brand-name">ExamNation</span>
                </div>

                <div className="auth-panel-copy">
                    <h2>Be part of something <em>early.</em></h2>
                    <p>
                        Join the Examnation pilot and help shape the future of exam prep
                        across the Caribbean. Early schools get free access and a direct
                        line to our team.
                    </p>

                    <div className="auth-stats">
                        <div className="auth-stat">
                            <div className="pilot-check-icon"></div>
                            <div className="auth-stat-text">
                                <span className="auth-stat-value">Founding School Pricing</span>
                                <span className="auth-stat-label">Special rates for early partners</span>
                            </div>
                        </div>
                        <div className="auth-stat">
                            <div className="pilot-check-icon"></div>
                            <div className="auth-stat-text">
                                <span className="auth-stat-value">Shape the Product</span>
                                <span className="auth-stat-label">Your feedback drives what we build</span>
                            </div>
                        </div>
                        <div className="auth-stat">
                            <div className="pilot-check-icon"></div>
                            <div className="auth-stat-text">
                                <span className="auth-stat-value">BGCSE & CXC Aligned</span>
                                <span className="auth-stat-label">Curriculum-matched question banks</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="auth-panel-footer">
                    © {new Date().getFullYear()} Lofty Goals Software · ExamNation
                </p>
            </div>

            {/* ── Right form panel ── */}
            <div className="auth-panel-right auth-panel-right--pilot" >
                <div className="auth-form-wrap">

                    {submitStatus === 'success' ? (
                        <div className="pilot-success">
                            <div className="pilot-success-icon">✓</div>
                            <h2>You're on the list!</h2>
                            <p>Thanks for signing up. We'll be in touch within 48 hours.</p>
                            <button className="submit-btn" onClick={() => navigate('/')}>
                                Back to Home
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="auth-form-header">
                                <h1>Join the Pilot</h1>
                                <p>Tell us about yourself and your school. We'll reach out within 48 hours.</p>
                            </div>

                            <form onSubmit={handleSubmit}>

                                <p className="pilot-section-label">Your Info</p>

                                {/* Name row */}
                                <div className="auth-field-row">
                                    <div className="auth-field">
                                        <label htmlFor="pilot-firstname">First Name</label>
                                        <input
                                            id="pilot-firstname"
                                            type="text"
                                            placeholder="First Name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="auth-field">
                                        <label htmlFor="pilot-lastname">Last Name</label>
                                        <input
                                            id="pilot-lastname"
                                            type="text"
                                            placeholder="Last Name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="auth-field-row">
                                    <div className="auth-field">
                                        <label htmlFor="pilot-email">Email</label>
                                        <input
                                            id="pilot-email"
                                            type="email"
                                            placeholder="you@school.edu"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="auth-field">
                                        <label htmlFor="pilot-phone">Phone</label>
                                        <input
                                            id="pilot-phone"
                                            type="tel"
                                            placeholder="+1 (242) 000-0000"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <p className="pilot-section-label">Your School</p>

                                {/* School row */}
                                <div className="auth-field-row">
                                    <div className="auth-field">
                                        <label htmlFor="pilot-school">School Name</label>
                                        <input
                                            id="pilot-school"
                                            type="text"
                                            placeholder="School Name"
                                            value={school}
                                            onChange={(e) => setSchool(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="auth-field">
                                        <label htmlFor="pilot-students">No. of Students</label>
                                        <input
                                            id="pilot-students"
                                            type="number"
                                            placeholder="e.g. 500"
                                            value={students}
                                            onChange={(e) => setStudents(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="auth-field">
                                    <label htmlFor="pilot-role">Your Role</label>
                                    <select
                                        id="pilot-role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select your role</option>
                                        <option value="Teacher">Teacher</option>
                                        <option value="School Administrator">School Administrator</option>
                                        <option value="Principal">Principal</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <p className="pilot-section-label">Quick Questions</p>

                                <div className="auth-field">
                                    <label htmlFor="pilot-challenge">Biggest challenge you face in this role?</label>
                                    <textarea
                                        id="pilot-challenge"
                                        placeholder="e.g. Students struggle to stay engaged, hard to track individual progress..."
                                        value={painPoints}
                                        onChange={(e) => setPainPoints(e.target.value)}
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="auth-field">
                                    <label htmlFor="pilot-solution">How do you handle it now?</label>
                                    <textarea
                                        id="pilot-solution"
                                        placeholder="e.g. Past papers, extra tutoring sessions..."
                                        value={solution}
                                        onChange={(e) => setSolution(e.target.value)}
                                        rows={3}
                                        required
                                    />
                                </div>

                                {errorMessage && (
                                    <div className="auth-error-message" role="alert">
                                        {errorMessage}
                                    </div>
                                )}

                                <button type="submit" disabled={isLoading} className="submit-btn">
                                    {isLoading
                                        ? <><div className="spinner"></div> Submitting…</>
                                        : 'Apply for Pilot'
                                    }
                                </button>

                                <p className="pilot-signin-link">
                                    Already have an account?{' '}
                                    <span onClick={() => navigate('/login')}>Sign in</span>
                                </p>

                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PilotRegister;
