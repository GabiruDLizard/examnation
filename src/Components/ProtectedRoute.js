import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (!token) {
        // No token, redirect to login
        return <Navigate to="/login" replace />;
    }

    try {
        // Decode the JWT token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        
        // Normalize role values for comparison
        const normalizedUserRole = userRole?.toLowerCase();
        const normalizedRequiredRole = requiredRole?.toLowerCase();

        // Check if user has the required role
        if (normalizedRequiredRole === 'teacher') {
            if (normalizedUserRole === 'educator' || normalizedUserRole === 'teacher') {
                return children;
            }
        } else if (normalizedRequiredRole === 'student') {
            if (normalizedUserRole === 'student' || normalizedUserRole === 'learner') {
                return children;
            }
        }

        // Role mismatch - redirect based on actual role
        if (normalizedUserRole === 'educator' || normalizedUserRole === 'teacher') {
            return <Navigate to="/teacherdashboard" replace />;
        } else {
            return <Navigate to="/studentdashboard" replace />;
        }

    } catch (error) {
        console.error('Error decoding token:', error);
        // Invalid token, redirect to login
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;