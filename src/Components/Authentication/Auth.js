import React, { useEffect, useState } from 'react';
import './Auth.css';
import logo from '../../Resources/PHold-logo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from './AuthService';
import { FaUserCircle } from 'react-icons/fa';
import { getToken, setToken, removeToken, getUserIdFromToken, getRoleFromToken } from '../../utils/tokenUtils';
import { authFetch } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const Auth = () => {
    const { refreshAuth } = useAuth();
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(location.state?.isLogin ?? true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordForgot, setForgotPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const token = getToken();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Form validation ---
        setErrorMessage('');

        if (!isLogin) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setErrorMessage('Please enter a valid email address.');
                return;
            }
            if (password.length < 6) {
                setErrorMessage('Password must be at least 6 characters.');
                return;
            }
            if (password !== confirmPassword) {
                setErrorMessage('Passwords do not match.');
                return;
            }
        } else {
            if (!username.trim()) {
                setErrorMessage('Username or email is required.');
                return;
            }
            if (!password) {
                setErrorMessage('Password is required.');
                return;
            }
        }
        // --- End validation ---

        setIsLoading(true);

        if (isLogin) {
            try {
                const data = await login(username, password);

                if (data.token) {
                    setToken(data.token);
                    refreshAuth();

                    const userRole = getRoleFromToken();
                    const normalizedRole = userRole?.toLowerCase();

                    if (normalizedRole === 'educator' || normalizedRole === 'teacher') {
                        navigate('/teacherdashboard');
                    } else {
                        navigate('/studentdashboard');
                    }
                } else {
                    setErrorMessage(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                setErrorMessage('Error connecting to server. Please try again.');
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
            navigate('/setup', { state: { email, username, firstName, lastName, password } });
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userId = getUserIdFromToken();
                const response = await authFetch(`/user/${userId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error(error);
            }
        };
        if (token) {
            fetchUserData();
        }
    }, [token]);

    if (!token) {
        return (
            <>
                {/* Floating Background */}
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

                {/* Content Area */}
                <div className="auth-content-area">
                    <div className="auth-container">
                        <div className="logo">
                            <img src={logo} alt="Logo" onClick={() => navigate('/')} />
                        </div>
                        <form onSubmit={handleSubmit}>
                            {!isLogin ? (
                                <>
                                    <input
                                        type="text"
                                        placeholder="FirstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="LastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Username / Email"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </>
                            )}

                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {!isLogin && (
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            )}

                            {errorMessage && (
                                <div className="auth-error-message" role="alert">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Submit Button with Spinner */}
                            <button type="submit" disabled={isLoading} className="submit-btn">
                                {isLoading ? (
                                    <>
                                        <div className="spinner"></div>
                                        {isLogin ? 'Signing In...' : 'Creating Account...'}
                                    </>
                                ) : (
                                    isLogin ? 'Login' : 'Register'
                                )}
                            </button>

                            <div className="bottomloginnav">
                                {isLogin ? (
                                    <>
                                        <p onClick={() => navigate('/passwordreset')}>Forgot Password?</p>
                                        <p onClick={() => {
                                            setIsLogin(false);
                                            setUsername('');
                                            setPassword('');
                                            setFirstName('');
                                            setLastName('');
                                            setEmail('');
                                            setConfirmPassword('');
                                            setErrorMessage('');
                                        }}>Sign Up</p>
                                    </>
                                ) : (
                                    <>
                                        <p onClick={() => {
                                            setIsLogin(true);
                                            setUsername('');
                                            setPassword('');
                                            setFirstName('');
                                            setLastName('');
                                            setEmail('');
                                            setConfirmPassword('');
                                            setErrorMessage('');
                                        }}>Already have an account?</p>
                                        <p onClick={() => navigate('/')}>Cancel</p>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </>
        );
    } else {
        return (
            <>
                {/* Floating Background */}
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

                {/* Content Area */}
                <div className="auth-content-area">
                    <div className="auth-container">
                        <div className="logo">
                            <img src={logo} alt="Logo" />
                        </div>
                        <div className="already-logged-in">
                            <h2>You are already logged in as the user below</h2>
                            <FaUserCircle size={20} /> {user ? user.username : 'User'}
                            <button onClick={() => { removeToken(); window.location.href = '/login'; }}>Logout</button>
                            <button onClick={() => {
                                let userRole = user?.role;
                                if (!userRole) {
                                    userRole = getRoleFromToken();
                                }

                                const normalizedRole = userRole?.toLowerCase();
                                if (normalizedRole === 'student') {
                                    window.location.href = '/studentdashboard';
                                } else if (normalizedRole === 'educator' || normalizedRole === 'teacher') {
                                    window.location.href = '/teacherdashboard';
                                } else {
                                    window.location.href = '/studentdashboard';
                                }
                            }}>Go to Dashboard</button>
                        </div>
                    </div>
                </div>
            </>
        );
    }
};

export default Auth;
