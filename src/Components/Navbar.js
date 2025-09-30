import React, { useEffect, useState } from 'react';
import '../Styling/Navbar.css'; 
import logo from '../Resources/PHold-logo.png';
import { FaUserCircle } from 'react-icons/fa';
import UserPopUp from './UserPopUp';

const Navbar = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [user, setUser] = useState(null);
    const isLoggedIn = !!localStorage.getItem('token');
    const token = localStorage.getItem('token');
    // const payload = JSON.parse(atob(token?.split('.')[1]));
    // const userId = payload.sub;
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if(token){
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
                    console.log(data);
                } catch (error) {
                    console.error(error);
                }
            }
        };
        fetchUserData();
    }, [token]);
    return (

        <nav className="navbar">
            <div className="navbar-left">
                <a className="logo" href="/">
                    <img src={logo}/>
                </a>
            </div>
            <div className="navbar-center">
                <form>
                    
                </form>
            </div>
            <div className="navbar-Right">
                <ul className="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/about">About</a></li>
                    <li><a href="/contact">Contact</a></li>
                    {isLoggedIn ? (
                        <li style = {{ position: 'relative' }}>
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
}

export default Navbar;
