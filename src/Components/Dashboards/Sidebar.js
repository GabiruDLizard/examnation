import React from 'react';
import './Sidebar.css';

const Sidebar = () => (
    <nav className="sidebar">
        <ul>
            <li><a href="/studentdashboard">Home</a></li>
            <li><a href="/exampage">Practice Questions</a></li>
            <li><a href="/review">Review Answers</a></li>
            <li><a href="/profile">Profile</a></li>
            <li><a href="/progress">Progress</a></li>
            <li><a href="/logout">Logout</a></li>
        </ul>
    </nav>
);

export default Sidebar;