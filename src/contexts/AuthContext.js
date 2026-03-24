import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserIdFromToken, getRoleFromToken, removeToken } from '../utils/tokenUtils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [userId, setUserId] = useState(null);
    const [role, setRole] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const id = getUserIdFromToken();
        const userRole = getRoleFromToken();
        setUserId(id);
        setRole(userRole);
        setAuthLoading(false);
    }, []);

    const refreshAuth = () => {
        const id = getUserIdFromToken();
        const userRole = getRoleFromToken();
        setUserId(id);
        setRole(userRole);
    };

    const logout = (navigate) => {
        removeToken();
        setUserId(null);
        setRole(null);
        if (navigate) navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ userId, role, authLoading, logout, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
