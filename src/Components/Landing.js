import React, { useState } from 'react';
import Register from './Register';
import Navbar from './Navbar';
import Auth from './Auth';


const LandingPage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    const handleLogin = () => {
        // Simulate a login action
        if (!isLoggedIn) {
            // Here you would typically handle authentication logic, e.g., API calls
            <Auth />;
            console.log("User logged in");
        }
        else{
            setIsLoggedIn(true);
        }
        
    };
    
    return (
        <div className="landing-page">
        <h1>Welcome to the number one Examination Portal</h1>
        <p>Your one-stop solution for online examinations covering questions from all </p>
        {!isLoggedIn ? (
            <button onClick={handleLogin}>Login</button>
        ) : (
            <p>You are logged in!</p>
        )}
        </div>
    );
}

export default LandingPage;