import React from 'react';
import { useNavigate } from 'react-router-dom';
import './userPopUp.css';

const UserPopUp = ({ user, onLogout, onClose }) => {
    const navigate = useNavigate();

    const goToDashboard = () => {
        if (user?.role === 'Teacher') {
            navigate('/teacherdashboard');
        } else {
            navigate('/studentdashboard');
        }
        onClose();
    };

    return (
        <div className="user-popup">
            <button className="user-popup-close" onClick={onClose}>X</button>
            <div className="user-popup-content">
                <p>{`Logged in as: ${user?.firstName}`}</p>
                <p>{`Email: ${user?.email}`}</p>
                <p>{`Role: ${user?.role}`}</p>
            </div>
            <button className="user-popup-logout" onClick={goToDashboard}>My Dashboard</button>
            <button className="user-popup-logout" onClick={() => { navigate('/settings'); onClose(); }}>Settings</button>
            <button className="user-popup-logout" onClick={onLogout}>Logout</button>
        </div>
    );
};

export default UserPopUp;
