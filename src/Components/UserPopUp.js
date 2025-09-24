import React from 'react';
import '../Styling/userPopUp.css';

const UserPopUp = ({ user, onLogout, onClose }) => {
    return (
        <div className="user-popup">
            <button className="user-popup-close" onClick={onClose}>X</button>
            <div className="user-popup-content">
                <p>{`Logged in as: ${user?.firstName}`}</p>
                <p>{`Email: ${user?.email}`}</p>
                <p>{`Role: ${user?.role}`}</p>
            </div>
            <button className="user-popup-logout" onClick={onLogout}>Logout</button>
        </div>
    );
};

export default UserPopUp;
