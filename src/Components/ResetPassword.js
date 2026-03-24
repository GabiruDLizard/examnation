import React, { useState } from 'react';
import './ResetPassword.css';
import logo from '../Resources/PHold-logo.png';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

const ResetPassword = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [submitted, setSubmitted]             = useState(false);
    const [loading,   setLoading]               = useState(false);
    const [error,     setError]                 = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usernameOrEmail.trim()) {
            setError('Please enter your username or email.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await fetch(`${API_BASE_URL}/PasswordResetRequest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernameOrEmail: usernameOrEmail.trim() }),
            });
            setSubmitted(true);
        } catch {
            setError('Could not connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
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
                            <p className="reset-subtitle">Enter your username or email and your school admin will be notified to reset it for you.</p>
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="text"
                                    placeholder="Username or email"
                                    value={usernameOrEmail}
                                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                                    required
                                />
                                {error && (
                                    <div className="auth-error-message" role="alert">{error}</div>
                                )}
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? 'Sending...' : 'Request Password Reset'}
                                </button>
                                <div className="bottomloginnav">
                                    <button className="link-btn" onClick={() => navigate('/login')}>Back to Login</button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="reset-success">
                            <div className="reset-success-icon">✅</div>
                            <h2>Request sent</h2>
                            <p>Your school admin has been notified. They will reset your password and let you know your new credentials.</p>
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
