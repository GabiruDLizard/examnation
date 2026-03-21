import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken, removeToken, getRoleFromToken } from '../utils/tokenUtils';

const ProtectedRoute = ({ children, requiredRole }) => {
    const token = getToken();

    if (!token) return <Navigate to="/login" replace />;

    try {
        const userRole = getRoleFromToken()?.toLowerCase();
        const required  = requiredRole?.toLowerCase();

        // Admin / superadmin go to their own dashboard
        if (userRole === 'admin' || userRole === 'superadmin') {
            if (!required || required === 'admin') return children;
            return <Navigate to="/admindashboard" replace />;
        }

        if (required === 'teacher') {
            if (userRole === 'educator' || userRole === 'teacher') return children;
        } else if (required === 'student') {
            if (userRole === 'student' || userRole === 'learner') return children;
        } else if (!required) {
            return children; // no role restriction
        }

        // Wrong role — send to their own dashboard
        if (userRole === 'educator' || userRole === 'teacher') return <Navigate to="/teacherdashboard" replace />;
        if (userRole === 'student' || userRole === 'learner')  return <Navigate to="/studentdashboard" replace />;
        return <Navigate to="/login" replace />;

    } catch {
        removeToken();
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;
