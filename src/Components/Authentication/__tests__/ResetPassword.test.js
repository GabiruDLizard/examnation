import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPassword from '../../ResetPassword';

function renderResetPassword() {
    return render(
        <MemoryRouter initialEntries={['/passwordreset']}>
            <Routes>
                <Route path="/passwordreset" element={<ResetPassword />} />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true });
});
afterEach(() => jest.restoreAllMocks());

describe('ResetPassword component', () => {
    it('renders the initial form with heading and input', () => {
        renderResetPassword();
        expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Username or email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Request Password Reset' })).toBeInTheDocument();
    });

    it('shows validation error and makes no network call when input is empty', async () => {
        const user = userEvent.setup();
        renderResetPassword();
        await user.click(screen.getByRole('button', { name: 'Request Password Reset' }));
        expect(screen.getByRole('alert')).toHaveTextContent('Please enter your username or email.');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('switches to success screen after a successful POST', async () => {
        const user = userEvent.setup();
        renderResetPassword();
        await user.type(screen.getByPlaceholderText('Username or email'), 'testuser');
        await user.click(screen.getByRole('button', { name: 'Request Password Reset' }));
        expect(await screen.findByText('Request sent')).toBeInTheDocument();
    });

    it('success screen shows a Back to Login button', async () => {
        const user = userEvent.setup();
        renderResetPassword();
        await user.type(screen.getByPlaceholderText('Username or email'), 'testuser');
        await user.click(screen.getByRole('button', { name: 'Request Password Reset' }));
        await screen.findByText('Request sent');
        expect(screen.getByRole('button', { name: 'Back to Login' })).toBeInTheDocument();
    });

    it('navigates to /login when Back to Login is clicked on success screen', async () => {
        const user = userEvent.setup();
        renderResetPassword();
        await user.type(screen.getByPlaceholderText('Username or email'), 'testuser');
        await user.click(screen.getByRole('button', { name: 'Request Password Reset' }));
        await screen.findByText('Request sent');
        await user.click(screen.getByRole('button', { name: 'Back to Login' }));
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('shows network error message when fetch throws', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network down'));
        const user = userEvent.setup();
        renderResetPassword();
        await user.type(screen.getByPlaceholderText('Username or email'), 'testuser');
        await user.click(screen.getByRole('button', { name: 'Request Password Reset' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Could not connect to the server');
    });
});
