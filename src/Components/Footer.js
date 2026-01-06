import React from 'react';
import './Footer.css';

const Footer = () => (
    <footer className="Footer">
        &copy; {new Date().getFullYear()} Examnation. All rights reserved. | Examnation is powered by Loftier Goals Software ltd., a registered company.
    </footer>
);

export default Footer;