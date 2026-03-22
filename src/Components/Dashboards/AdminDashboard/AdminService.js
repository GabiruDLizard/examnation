import { authFetch } from '../../../utils/api';

export const getUsers = async (search = '') => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await authFetch(`/admin/users${qs}`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
};

export const createAccount = async ({ firstName, lastName, email, username, password, role, institutionId }) => {
    const res = await authFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
            firstName, lastName, email, username,
            passwordHash: password, role,
            institutionId: institutionId ?? null,
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create account');
    }
    return res.json();
};

export const editUser = async (userId, { firstName, lastName, email, username, role, institutionId }) => {
    const res = await authFetch(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ firstName, lastName, email, username, role,
            institutionId: institutionId ?? null, passwordHash: '' }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update user');
    }
    return res.json();
};

export const deleteUser = async (userId) => {
    const res = await authFetch(`/admin/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete user');
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

export const getResetRequests = async () => {
    const res = await authFetch('/passwordresetrequest/pending');
    if (!res.ok) throw new Error('Failed to fetch reset requests');
    return res.json();
};

export const completeResetRequest = async (requestId) => {
    const res = await authFetch(`/passwordresetrequest/${requestId}/complete`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to complete request');
    return res.json();
};

export const dismissResetRequest = async (requestId) => {
    const res = await authFetch(`/passwordresetrequest/${requestId}/dismiss`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to dismiss request');
    return res.json();
};

export const getOrganizations = async () => {
    const res = await authFetch('/organization');
    if (!res.ok) throw new Error('Failed to fetch organizations');
    return res.json();
};

export const createOrganization = async ({ institutionName, country = 'Bahamas', address, institutionLevel }) => {
    const res = await authFetch('/organization', {
        method: 'POST',
        body: JSON.stringify({ institutionName, country, address, institutionLevel }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create organization');
    }
    return res.json();
};
