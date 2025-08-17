import React, { useState } from 'react';
import '../Styling/Navbar.css'; 
import logo from '../Resources/PHold-logo.png';

const Navbar = () => {
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
                    <li><a href="/login">Login</a></li>
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;