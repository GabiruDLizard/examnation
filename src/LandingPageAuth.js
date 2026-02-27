import React, { useState, useEffect } from 'react';
import LandingPage from './Components/Landing';
import { getToken, removeToken, getUserIdFromToken } from './utils/tokenUtils';
import { authFetch } from './utils/api';

const LandingPageAuth = () => {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      const token = getToken();
      if (token) {
        try {
          const userId = getUserIdFromToken();
          const response = await authFetch(`/user/${userId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          const data = await response.json();

          if (data?.role === 'Student') {
            window.location.href = '/studentdashboard';
            return;
          } else if (data?.role === 'Educator') {
            window.location.href = '/teacherdashboard';
            return;
          }
        } catch (error) {
          console.error(error);
          removeToken();
        }
      }
      setIsChecking(false);
    };

    checkAndRedirect();
  }, []);

  if (isChecking) {
    return <div>Loading...</div>;
  }

  return <LandingPage />;
};

export default LandingPageAuth;
