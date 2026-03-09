import React, { useState } from 'react';
import './ResetPassword.css';
import logo from '../Resources/PHold-logo.png';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setError('');
        setSubmitted(true);
    };

    return (
        <>
            <div className="auth-page-wrapper">
                <div className="auth-floating-bg">
                    <div className="auth-circle auth-circle1"></div>
                    <div className="auth-circle auth-circle2"></div>
                    <div className="auth-circle auth-circle3"></div>
                    <div className="auth-circle auth-circle4"></div>
                    <div className="auth-circle auth-circle5"></div>
                    <div className="auth-main-orb"></div>
                </div>
            </div>

            <div className="auth-content-area">
                <div className="auth-container">
                    <div className="logo">
                        <img src={logo} alt="Logo" onClick={() => navigate('/')} />
                    </div>

                    {!submitted ? (
                        <>
                            <h2 className="reset-title">Forgot your password?</h2>
                            <p className="reset-subtitle">Enter your email and we'll send you a reset link.</p>
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                {error && (
                                    <div className="auth-error-message" role="alert">{error}</div>
                                )}
                                <button type="submit" className="submit-btn">
                                    Send Reset Link
                                </button>
                                <div className="bottomloginnav">
                                    <p onClick={() => navigate('/login')}>Back to Login</p>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="reset-success">
                            <div className="reset-success-icon">✉️</div>
                            <h2>Check your inbox</h2>
                            <p>If <strong>{email}</strong> is registered, you'll receive a reset link shortly.</p>
                            <button className="submit-btn" onClick={() => navigate('/login')}>
                                Back to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ResetPassword;
