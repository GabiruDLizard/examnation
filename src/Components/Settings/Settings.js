import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/api';
import { getUserIdFromToken } from '../../utils/tokenUtils';
import './Settings.css';

const Settings = () => {
    const userId = getUserIdFromToken();


    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
    });
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await authFetch(`/user/${userId}`);
                if (!res.ok) throw new Error('Failed to load user');
                const data = await res.json();
                setForm({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    username: data.username || '',
                });
            } catch (err) {
                setErrorMsg('Could not load your details. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setSuccessMsg('');
        setErrorMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');

        if (newPassword && newPassword.length < 6) {
            setErrorMsg('New password must be at least 6 characters.');
            return;
        }
        if (newPassword && newPassword !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                FirstName: form.firstName,
                LastName: form.lastName,
                Email: form.email,
                Username: form.username,
                ...(newPassword ? { PasswordHash: newPassword } : {}),
            };
            const res = await authFetch(`/user/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Update failed');
            }
            setSuccessMsg('Your details have been updated.');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setErrorMsg(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-topbar">
                <span className="settings-brand">Examnation</span>
                <span />
            </div>

            <div className="settings-container">
                <h2 className="settings-title">Account Settings</h2>

                {loading ? (
                    <p className="settings-loading">Loading...</p>
                ) : (
                    <form className="settings-form" onSubmit={handleSubmit}>

                        <div className="settings-section">
                            <h3>Personal Information</h3>
                            <div className="settings-row">
                                <div className="settings-field">
                                    <label>First Name</label>
                                    <input
                                        name="firstName"
                                        type="text"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="settings-field">
                                    <label>Last Name</label>
                                    <input
                                        name="lastName"
                                        type="text"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="settings-field">
                                <label>Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="settings-field">
                                <label>Username</label>
                                <input
                                    name="username"
                                    type="text"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="settings-section">
                            <h3>Change Password <span className="settings-optional">(optional)</span></h3>
                            <div className="settings-field">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep current password"
                                    value={newPassword}
                                    onChange={e => { setNewPassword(e.target.value); setErrorMsg(''); setSuccessMsg(''); }}
                                />
                            </div>
                            <div className="settings-field">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    placeholder="Repeat new password"
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setErrorMsg(''); setSuccessMsg(''); }}
                                />
                            </div>
                        </div>

                        {errorMsg && <div className="settings-error">{errorMsg}</div>}
                        {successMsg && <div className="settings-success">{successMsg}</div>}

                        <button type="submit" className="settings-save-btn" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Settings;
