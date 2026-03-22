import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

function makeToken(payload = {}) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify({
        sub: '1',
        role: 'student',
        exp: 9999999999,
        ...payload,
    }));
    return `${header}.${body}.fakesig`;
}

const Child = () => <div>Protected Content</div>;

function renderRoute(token, requiredRole, initialPath = '/protected') {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/login" element={<div>Login Page</div>} />
                <Route path="/studentdashboard" element={<div>Student Dashboard</div>} />
                <Route path="/teacherdashboard" element={<div>Teacher Dashboard</div>} />
                <Route path="/admindashboard" element={<div>Admin Dashboard</div>} />
                <Route
                    path="/protected"
                    element={
                        <ProtectedRoute requiredRole={requiredRole}>
                            <Child />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('ProtectedRoute', () => {
    it('redirects to /login when no token is present', () => {
        renderRoute(null, 'student');
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders children when student token matches requiredRole="student"', () => {
        renderRoute(makeToken({ role: 'student' }), 'student');
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('learner role alias grants access to requiredRole="student" routes', () => {
        renderRoute(makeToken({ role: 'learner' }), 'student');
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('educator role alias grants access to requiredRole="teacher" routes', () => {
        renderRoute(makeToken({ role: 'educator' }), 'teacher');
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('student token accessing a teacher route redirects to /studentdashboard', () => {
        renderRoute(makeToken({ role: 'student' }), 'teacher');
        expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
    });

    it('teacher token accessing a student route redirects to /teacherdashboard', () => {
        renderRoute(makeToken({ role: 'educator' }), 'student');
        expect(screen.getByText('Teacher Dashboard')).toBeInTheDocument();
    });

    it('admin token accessing any non-admin route redirects to /admindashboard', () => {
        renderRoute(makeToken({ role: 'admin' }), 'student');
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('admin token accessing requiredRole="admin" renders children', () => {
        renderRoute(makeToken({ role: 'admin' }), 'admin');
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('malformed token redirects to /login', () => {
        renderRoute('not.a.valid.token.at.all', 'student');
        // decodeToken will fail and catch redirects to /login
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('route with no requiredRole renders children for any authenticated user', () => {
        renderRoute(makeToken({ role: 'student' }), undefined);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
});
