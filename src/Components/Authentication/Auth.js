import React, { useEffect, useState } from 'react';
import './Auth.css';
import logo from '../../Resources/ExamNationIcon.svg';
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
                if (data.isFirstLogin) {
                    localStorage.setItem('examnation_first_login', '1');
                } else {
                    localStorage.removeItem('examnation_first_login');
                }
                refreshAuth();
                const role = getRoleFromToken()?.toLowerCase();
                if (role === 'admin' || role === 'superadmin') {
                    import('../../Components/Dashboards/AdminDashboard/AdminDashboard');
                    navigate('/admindashboard');
                } else if (role === 'educator' || role === 'teacher') {
                    import('../../Components/Dashboards/TeacherDashboard/TeacherDashboard');
                    import('../../Components/Dashboards/TAPage/TAPageTeacher');
                    navigate('/teacherdashboard');
                } else {
                    import('../../Components/Dashboards/StudentDashboard/StudentDashboard');
                    import('../../Components/Dashboards/TAPage/TAPageStudent');
                    import('../../Components/Quizzes/AdaptiveTest');
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
            } catch { /* ignore */ }
        };
        if (token) fetchUserData();
    }, [token]);

    if (!token) {
        return (
            <div className="auth-split">
                {/* ── Left branding panel ── */}
                <div className="auth-panel-left">
                    <div className="auth-brand" onClick={() => navigate('/')}>
                        <img src={logo} alt="ExamNation" />
                        <span className="auth-brand-name">ExamNation</span>
                    </div>

                    <div className="auth-panel-copy">
                        <h2>Your academic journey starts <em>here</em></h2>
                        <p>
                            ExamNation supports students, teachers, and schools across the Caribbean —
                            from adaptive practice to real-time class insights.
                        </p>

                        <div className="auth-stats">
                            <div className="auth-stat">
                                <div className="auth-stat-text">
                                    <span className="auth-stat-value">School-Ready Platform</span>
                                    <span className="auth-stat-label">Class management & teacher tools</span>
                                </div>
                            </div>
                            <div className="auth-stat">
                                <div className="auth-stat-text">
                                    <span className="auth-stat-value">Real-Time Analytics</span>
                                    <span className="auth-stat-label">Track every student's progress</span>
                                </div>
                            </div>
                            <div className="auth-stat">
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
                <div className="auth-panel-right">
                    <div className="auth-form-wrap">
                        <div className="auth-form-header">
                            <h1>Sign in</h1>
                            <p>Welcome back. Enter your details to continue.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="auth-field">
                                <label htmlFor="auth-username">Username or Email</label>
                                <input
                                    id="auth-username"
                                    type="text"
                                    placeholder="you@school.edu"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <label htmlFor="auth-password">Password</label>
                                <input
                                    id="auth-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {errorMessage && (
                                <div className="auth-error-message" role="alert">
                                    {errorMessage}
                                </div>
                            )}

                            <button type="submit" disabled={isLoading} className="submit-btn">
                                {isLoading ? (
                                    <><div className="spinner"></div> Signing in…</>
                                ) : 'Sign In'}
                            </button>

                            <div className="bottomloginnav">
                                <p onClick={() => navigate('/passwordreset')}>Forgot password?</p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-split">
            <div className="auth-panel-left">
                <div className="auth-brand" onClick={() => navigate('/')}>
                    <img src={logo} alt="ExamNation" />
                    <span className="auth-brand-name">ExamNation</span>
                </div>
                <div className="auth-panel-copy">
                    <h2>Built for the educators shaping the <em>Caribbean's future</em></h2>
                    <p>A complete academic platform for schools, teachers, and parents.</p>
                </div>
                <p className="auth-panel-footer">© {new Date().getFullYear()} Lofty Goals Software · ExamNation</p>
            </div>
            <div className="auth-panel-right">
                <div className="auth-form-wrap">
                    <div className="auth-form-header">
                        <h1>Already signed in</h1>
                        <p>You are logged in as <strong>{user ? user.username : 'User'}</strong></p>
                    </div>
                    <div className="already-logged-in">
                        <button onClick={() => {
                            const role = (user?.role || getRoleFromToken())?.toLowerCase();
                            if (role === 'admin' || role === 'superadmin') window.location.href = '/admindashboard';
                            else if (role === 'educator' || role === 'teacher') window.location.href = '/teacherdashboard';
                            else window.location.href = '/studentdashboard';
                        }} className="submit-btn">Go to Dashboard</button>
                        <button onClick={() => { removeToken(); window.location.href = '/login'; }}
                            style={{ background: 'none', border: '1.5px solid #e2e8f0', color: '#64748b', marginTop: '0.5rem', width: '100%', padding: '0.875rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}
                        >Sign out</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
