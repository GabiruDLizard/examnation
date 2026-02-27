import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken, removeToken, getRoleFromToken } from '../utils/tokenUtils';

const ProtectedRoute = ({ children, requiredRole }) => {
    const token = getToken();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const userRole = getRoleFromToken();

        const normalizedUserRole = userRole?.toLowerCase();
        const normalizedRequiredRole = requiredRole?.toLowerCase();

        if (normalizedRequiredRole === 'teacher') {
            if (normalizedUserRole === 'educator' || normalizedUserRole === 'teacher') {
                return children;
            }
        } else if (normalizedRequiredRole === 'student') {
            if (normalizedUserRole === 'student' || normalizedUserRole === 'learner') {
                return children;
            }
        }

        if (normalizedUserRole === 'educator' || normalizedUserRole === 'teacher') {
            return <Navigate to="/teacherdashboard" replace />;
        } else {
            return <Navigate to="/studentdashboard" replace />;
        }

    } catch (error) {
        console.error('Error decoding token:', error);
        removeToken();
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;
