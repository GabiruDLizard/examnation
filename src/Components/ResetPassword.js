import React, { useState } from 'react';
import '../Styling/ResetPassword.css';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle password reset logic here
        console.log('Resetting password for', { email });
    };

    return (
        <div className="Reset-Container">
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit">Send Reset Link</button>
            </form>
        </div>
    );  
}

export default ResetPassword;