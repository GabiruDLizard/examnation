import { authFetch } from '../../../utils/api';

export const getUsers = async (search = '') => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await authFetch(`/admin/users${qs}`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
};

export const createAccount = async ({ firstName, lastName, email, username, password, role }) => {
    const res = await authFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, username, passwordHash: password, role }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create account');
    }
    return res.json();
};

export const resetPassword = async (userId, newPassword) => {
    const res = await authFetch(`/admin/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to reset password');
    }
    return res.json();
};
