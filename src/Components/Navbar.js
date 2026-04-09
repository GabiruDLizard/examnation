import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { FaUserCircle } from 'react-icons/fa';
import UserPopUp from './UserPopUp';
import { getToken, removeToken, getUserIdFromToken } from '../utils/tokenUtils';
import { authFetch } from '../utils/api';

const Navbar = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [user, setUser] = useState(null);
    const token = getToken();
    const isLoggedIn = !!token;

    const handleLogout = () => {
        removeToken();
        window.location.href = '/login';
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (token) {
                try {
                    const userId = getUserIdFromToken();
                    const response = await authFetch(`/user/${userId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch user data');
                    }
                    const data = await response.json();
                    setUser(data);
                } catch {
                }
            }
        };
        fetchUserData();
    }, [token]);

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <a className="logo" href="/">
                    Examnation
                </a>
            </div>
            <div className="navbar-center">
                <form>

                </form>
            </div>
            <div className="navbar-Right">
                <ul className="nav-links">
                    <li><a href="/">Home</a></li>
                    {isLoggedIn ? (
                        <li style={{ position: 'relative' }}>
                            <FaUserCircle
                                size={28}
                                style={{ cursor: 'pointer' }}
                                onClick={() => setShowMenu(!showMenu)}
                            />
                            {showMenu && (
                                <UserPopUp
                                    user={user}
                                    onLogout={handleLogout}
                                    onClose={() => setShowMenu(false)}
                                />
                            )}
                        </li>
                    ) : (
                        <li>
                            <a href="/login">Login</a>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
