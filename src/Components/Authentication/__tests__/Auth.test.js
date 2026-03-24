import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Auth from '../Auth';
import { AuthProvider } from '../../../contexts/AuthContext';
import * as AuthService from '../AuthService';

function makeToken(payload = {}) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify({ sub: '1', role: 'student', exp: 9999999999, ...payload }));
    return `${header}.${body}.fakesig`;
}

function renderAuth(initialToken = null) {
    if (initialToken) localStorage.setItem('token', initialToken);
    else localStorage.removeItem('token');

    return render(
        <MemoryRouter initialEntries={['/login']}>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Auth />} />
                    <Route path="/studentdashboard" element={<div>Student Dashboard</div>} />
                    <Route path="/teacherdashboard" element={<div>Teacher Dashboard</div>} />
                    <Route path="/admindashboard" element={<div>Admin Dashboard</div>} />
                </Routes>
            </AuthProvider>
        </MemoryRouter>
    );
}

beforeEach(() => {
    localStorage.clear();
    jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({}),
    });
});
afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
});

describe('Auth component', () => {
    it('renders the login form when no token is present', () => {
        renderAuth();
        expect(screen.getByPlaceholderText('Username / Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });

    it('shows validation error when submitting with empty username', async () => {
        const user = userEvent.setup();
        renderAuth();
        await user.click(screen.getByRole('button', { name: 'Login' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Username or email is required.');
    });

    it('shows validation error when username provided but password is empty', async () => {
        const user = userEvent.setup();
        renderAuth();
        await user.type(screen.getByPlaceholderText('Username / Email'), 'testuser');
        await user.click(screen.getByRole('button', { name: 'Login' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Password is required.');
    });

    it('navigates to /studentdashboard after successful student login', async () => {
        const user = userEvent.setup();
        jest.spyOn(AuthService, 'login').mockResolvedValueOnce({
            token: makeToken({ role: 'student', sub: '1' }),
        });
        renderAuth();
        await user.type(screen.getByPlaceholderText('Username / Email'), 'student@test.com');
        await user.type(screen.getByPlaceholderText('Password'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Login' }));
        expect(await screen.findByText('Student Dashboard')).toBeInTheDocument();
    });

    it('navigates to /teacherdashboard after successful educator login', async () => {
        const user = userEvent.setup();
        jest.spyOn(AuthService, 'login').mockResolvedValueOnce({
            token: makeToken({ role: 'educator', sub: '2' }),
        });
        renderAuth();
        await user.type(screen.getByPlaceholderText('Username / Email'), 'teacher@test.com');
        await user.type(screen.getByPlaceholderText('Password'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Login' }));
        expect(await screen.findByText('Teacher Dashboard')).toBeInTheDocument();
    });

    it('navigates to /admindashboard after successful admin login', async () => {
        const user = userEvent.setup();
        jest.spyOn(AuthService, 'login').mockResolvedValueOnce({
            token: makeToken({ role: 'admin', sub: '3' }),
        });
        renderAuth();
        await user.type(screen.getByPlaceholderText('Username / Email'), 'admin@test.com');
        await user.type(screen.getByPlaceholderText('Password'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Login' }));
        expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('shows server error message when login returns no token', async () => {
        const user = userEvent.setup();
        jest.spyOn(AuthService, 'login').mockResolvedValueOnce({
            message: 'Invalid credentials',
        });
        renderAuth();
        await user.type(screen.getByPlaceholderText('Username / Email'), 'bad@test.com');
        await user.type(screen.getByPlaceholderText('Password'), 'wrongpass');
        await user.click(screen.getByRole('button', { name: 'Login' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    });

    it('shows connection error when login throws a network error', async () => {
        const user = userEvent.setup();
        jest.spyOn(AuthService, 'login').mockRejectedValueOnce(new Error('Network failure'));
        renderAuth();
        await user.type(screen.getByPlaceholderText('Username / Email'), 'user@test.com');
        await user.type(screen.getByPlaceholderText('Password'), 'pass');
        await user.click(screen.getByRole('button', { name: 'Login' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Error connecting to server');
    });

    it('renders the already-logged-in view when a token exists', async () => {
        renderAuth(makeToken({ role: 'student' }));
        expect(await screen.findByText('You are already logged in as the user below')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument();
    });
});
