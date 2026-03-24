import React, { useEffect, useState } from 'react';
import './Auth.css';
import logo from '../../Resources/PHold-logo.png';
import { useNavigate } from 'react-router-dom';
import { login } from './AuthService';
import { FaUserCircle } from 'react-icons/fa';
import { getToken, setToken, removeToken, getUserIdFromToken, getRoleFromToken } from '../../utils/tokenUtils';
import { authFetch } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const Auth = () => {
    const { refreshAuth } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const token = getToken();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!username.trim()) { setErrorMessage('Username or email is required.'); return; }
        if (!password)         { setErrorMessage('Password is required.'); return; }

        setIsLoading(true);
        try {
            const data = await login(username, password);
            if (data.token) {
                setToken(data.token);
                refreshAuth();
                const role = getRoleFromToken()?.toLowerCase();
                if (role === 'admin' || role === 'superadmin') {
                    navigate('/admindashboard');
                } else if (role === 'educator' || role === 'teacher') {
                    navigate('/teacherdashboard');
                } else {
                    navigate('/studentdashboard');
                }
            } else {
                setErrorMessage(data.message || 'Login failed');
            }
        } catch {
            setErrorMessage('Error connecting to server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userId = getUserIdFromToken();
                const response = await authFetch(`/user/${userId}`);
                if (!response.ok) throw new Error('Failed to fetch user data');
                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error(error);
            }
        };
        if (token) fetchUserData();
    }, [token]);

    if (!token) {
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
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Username / Email"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            {errorMessage && (
                                <div className="auth-error-message" role="alert">
                                    {errorMessage}
                                </div>
                            )}

                            <button type="submit" disabled={isLoading} className="submit-btn">
                                {isLoading ? (
                                    <><div className="spinner"></div> Signing In…</>
                                ) : 'Login'}
                            </button>

                            <div className="bottomloginnav">
                                <p onClick={() => navigate('/passwordreset')}>Forgot Password?</p>
                            </div>
                        </form>
                    </div>
                </div>
            </>
        );
    }

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
                    <div className="logo"><img src={logo} alt="Logo" /></div>
                    <div className="already-logged-in">
                        <h2>You are already logged in as the user below</h2>
                        <FaUserCircle size={20} /> {user ? user.username : 'User'}
                        <button onClick={() => { removeToken(); window.location.href = '/login'; }}>Logout</button>
                        <button onClick={() => {
                            const role = (user?.role || getRoleFromToken())?.toLowerCase();
                            if (role === 'admin' || role === 'superadmin') window.location.href = '/admindashboard';
                            else if (role === 'educator' || role === 'teacher') window.location.href = '/teacherdashboard';
                            else window.location.href = '/studentdashboard';
                        }}>Go to Dashboard</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Auth;
