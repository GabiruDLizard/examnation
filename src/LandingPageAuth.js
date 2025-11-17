import React, { useState, useEffect } from 'react'; // Add useState and useEffect
import LandingPage from './Components/Landing'; // Add LandingPage import

const LandingPageAuth = () => {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      const token = localStorage.getItem('token');
      if (token) {
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
          
          // Redirect based on user role
          if (data?.role === 'Student') {
            window.location.href = '/studentdashboard';
            return;
          } else if (data?.role === 'Educator') {
            window.location.href = '/teacherdashboard';
            return;
          }
        } catch (error) {
          console.error(error);
          // If token is invalid, remove it
          localStorage.removeItem('token');
        }
      }
      // If no token or invalid token, show landing page
      setIsChecking(false);
    };

    checkAndRedirect();
  }, []);

  if (isChecking) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return <LandingPage />;
};

export default LandingPageAuth;