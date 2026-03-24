import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Helper to build a structurally valid fake JWT
function makeToken(payload = {}) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify({
        sub: '42',
        role: 'student',
        institution_id: 1,
        exp: 9999999999,
        ...payload,
    }));
    return `${header}.${body}.fakesig`;
}

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('AuthContext', () => {
    it('starts with null userId and role when no token is present', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        // Wait for the useEffect to run
        await act(async () => {});
        expect(result.current.userId).toBeNull();
        expect(result.current.role).toBeNull();
        expect(result.current.authLoading).toBe(false);
    });

    it('populates userId and role from a valid token on mount', async () => {
        localStorage.setItem('token', makeToken({ sub: '99', role: 'educator' }));
        const { result } = renderHook(() => useAuth(), { wrapper });
        await act(async () => {});
        expect(result.current.userId).toBe('99');
        expect(result.current.role).toBe('educator');
        expect(result.current.authLoading).toBe(false);
    });

    it('logout() clears userId and role', async () => {
        localStorage.setItem('token', makeToken({ sub: '5', role: 'student' }));
        const { result } = renderHook(() => useAuth(), { wrapper });
        await act(async () => {});
        expect(result.current.userId).toBe('5');

        act(() => result.current.logout());
        expect(result.current.userId).toBeNull();
        expect(result.current.role).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('logout(navigate) calls navigate with /login', async () => {
        localStorage.setItem('token', makeToken());
        const { result } = renderHook(() => useAuth(), { wrapper });
        await act(async () => {});

        const navigate = jest.fn();
        act(() => result.current.logout(navigate));
        expect(navigate).toHaveBeenCalledWith('/login');
    });

    it('refreshAuth() picks up a newly written token', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await act(async () => {});
        expect(result.current.userId).toBeNull();

        // Write a token after mount (simulates post-login)
        localStorage.setItem('token', makeToken({ sub: '77', role: 'admin' }));
        act(() => result.current.refreshAuth());

        expect(result.current.userId).toBe('77');
        expect(result.current.role).toBe('admin');
    });
});
