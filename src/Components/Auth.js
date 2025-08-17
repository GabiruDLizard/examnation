import React, { useState } from 'react';
import '../Styling/Auth.css';
import logo from '../Resources/PHold-logo.png';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');	
    const [passwordForgot, setForgotPassword] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle authentication logic here
        console.log(isLogin ? 'Logging in' : 'Registering', { email, password });
        if(!isLogin){
            navigate('/setup');
        }
    };

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
}
export default Auth;