import React, { useEffect, useState } from 'react';
import '../../Styling/Auth.css';
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
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLogin) {
            try {
                // Pass username as UsernameorEmail
                const data = await login(username, password);
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    navigate('/studentdashboard');
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                alert('Error connecting to server');
            }
        } else {
            // Registration logic
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
            <div className="auth-container">
            
                <div className="logo">
                    <img src={logo}/>
                </div>
                {/* <h2>{isLogin ? 'Login' : 'Register'}</h2> */}
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
                    <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
                    <div className = "bottomloginnav">
                        {isLogin ? (
                            <>
                                <p onClick={() => navigate('/passwordreset')}>Forgot Password?</p>
                                <p onClick={() => setIsLogin(false)}>Sign Up</p>
                            </>
                        ) : (
                            <>
                                <p onClick={() => setIsLogin(true)}>Already have an account?</p>
                                <p onClick={() => navigate('/')}>Cancel</p>
                            </>
                        )}
                        {/* <p id = "createAccount" onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? 'Create an account' : 'Already have an account? Login'}
                        </p> */}
                    </div>
                </form>
            </div>
        );
    } else {
        // useEffect(async() => {
        //         try {
        //             const payload = JSON.parse(atob(token.split('.')[1]));
        //             const userId = payload.sub;
        //             const response = await fetch(`https://examnationwebapi.azurewebsites.net/api/user/${userId}`, {
        //                 headers: {
        //                 'Authorization': `Bearer ${token}`,
        //                 'Content-Type': 'application/json'
        //             }
        //         });
        //         if (!response.ok) {
        //             throw new Error('Failed to fetch user data');
        //         }
        //         const data = await response.json();
        //         setUser(data);
        //     } catch (error) {
        //         console.error(error);
        //     }
        // }, [token]);
        return(
            <div className="auth-container">
                <div className="logo">
                    <img src={logo}/>
                </div>
                <div className="already-logged-in">
                    <h2>You are already logged in as the user below</h2>
                    <FaUserCircle size={20}/> {user ? user.username : 'User'}
                    <button onClick={() => {localStorage.clear(); window.location.href = '/login';}}>Logout</button>
                    <button onClick={() => {if(user.role == 'student'){window.location.href = '/studentdashboard'; }}}>Go to Dashboard</button>
                </div>
            </div>
        );
    }
}
export default Auth;