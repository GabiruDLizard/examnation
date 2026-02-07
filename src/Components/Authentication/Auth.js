import React, { useEffect, useState } from 'react';
import './Auth.css';
import logo from '../../Resources/PHold-logo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from './AuthService';
import { FaUserCircle } from 'react-icons/fa';

const Auth = () => {
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
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        if (isLogin) {
            try {
                const data = await login(username, password);
                console.log('Login response:', data); // Debug log
                
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    
                    // Decode the JWT token to get the role
                    try {
                        const payload = JSON.parse(atob(data.token.split('.')[1]));
                        console.log('Token payload:', payload); // Debug log
                        
                        // Check the role from token payload
                        const userRole = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
                        console.log('User role from token:', userRole);
                        
                        if (userRole === 'Educator' || userRole === 'educator' || userRole === 'Teacher' || userRole === 'teacher') {
                            console.log('Navigating to teacher dashboard');
                            navigate('/teacherdashboard');
                        } else {
                            console.log('Navigating to student dashboard');
                            navigate('/studentdashboard');
                        }
                    } catch (tokenError) {
                        console.error('Error decoding token:', tokenError);
                        // Default to student dashboard if token decode fails
                        navigate('/studentdashboard');
                    }
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Error connecting to server');
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
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.sub;
                const response = await fetch(`https://examnationwebapi.azurewebsites.net/api/user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const data = await response.json();
                console.log('User data:', data); // Debug log
                setUser(data);
            } catch (error) {
                console.error(error);
            }
        };
        if (token) {
            fetchUserData();
        }
    }, [token]);

    if(!token) {
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
                                    setIsLogin(false)
                                    setUsername('');
                                    setPassword('');
                                    setFirstName('');
                                    setLastName('');
                                    setEmail('');
                                    setConfirmPassword('');
                                }}>Sign Up</p>
                            </>
                        ) : (
                            <>
                                <p onClick={() => {
                                    setIsLogin(true)
                                    setUsername('');
                                    setPassword('');
                                    setFirstName('');
                                    setLastName('');
                                    setEmail('');
                                    setConfirmPassword('');
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
        return(
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
                            <img src={logo} alt="Logo"/>
                        </div>
                <div className="already-logged-in">
                    <h2>You are already logged in as the user below</h2>
                    <FaUserCircle size={20}/> {user ? user.username : 'User'}
                    <button onClick={() => {localStorage.clear(); window.location.href = '/login';}}>Logout</button>
                    <button onClick={() => {
                        console.log('User role from stored data:', user?.role); // Debug log
                        
                        // Also check token for role if user data doesn't have it
                        let userRole = user?.role;
                        if (!userRole) {
                            try {
                                const payload = JSON.parse(atob(token.split('.')[1]));
                                userRole = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
                            } catch (e) {
                                console.error('Error decoding token for role:', e);
                            }
                        }
                        
                        console.log('Final user role:', userRole);
                        
                        if(userRole === 'Student' || userRole === 'student'){
                            window.location.href = '/studentdashboard';
                        } else if(userRole === 'Educator' || userRole === 'educator' || userRole === 'Teacher' || userRole === 'teacher'){
                            window.location.href = '/teacherdashboard';
                        } else {
                            console.log('Unknown role, defaulting to student dashboard');
                            window.location.href = '/studentdashboard';
                        }
                    }}>Go to Dashboard</button>
                </div>
            </div>
        </div>
    </>
        );
    }
}

export default Auth;