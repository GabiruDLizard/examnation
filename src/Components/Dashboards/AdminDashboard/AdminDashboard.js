import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getUsers, createAccount, resetPassword } from './AdminService';
import { removeToken, getRoleFromToken } from '../../../utils/tokenUtils';
import { useNavigate } from 'react-router-dom';
import { BiGroup, BiLogOut } from 'react-icons/bi';
import './AdminDashboard.css';

const ROLE_LABEL   = { student: 'Student', educator: 'Teacher', admin: 'Admin', superadmin: 'Super Admin' };
const ROLE_OPTIONS_BASE    = [
    { value: 'student',  label: 'Student' },
    { value: 'educator', label: 'Teacher' },
];
const ROLE_OPTIONS_SUPER = [
    ...ROLE_OPTIONS_BASE,
    { value: 'admin', label: 'School Admin' },
];

function RolePill({ role }) {
    return <span className={`ad-role-pill ad-role-${role}`}>{ROLE_LABEL[role] ?? role}</span>;
}

// ── Create Account Modal ───────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated, isSuperAdmin }) {
    const roleOptions = isSuperAdmin ? ROLE_OPTIONS_SUPER : ROLE_OPTIONS_BASE;
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', username: '', password: '', role: 'student',
    });
    const [showPw, setShowPw] = useState(false);
    const [busy,   setBusy]   = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) { toast.warn('Password must be at least 6 characters'); return; }
        setBusy(true);
        try {
            await createAccount(form);
            toast.success(`Account created for ${form.firstName} ${form.lastName}`);
            onCreated();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="ad-overlay" onClick={onClose}>
            <div className="ad-modal" onClick={e => e.stopPropagation()}>
                <div className="ad-modal-header">
                    <span className="ad-modal-title">Create Account</span>
                    <button className="ad-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="ad-modal-row">
                        <div className="ad-field">
                            <label>First Name</label>
                            <input value={form.firstName} onChange={e => set('firstName', e.target.value)} required placeholder="Jane" />
                        </div>
                        <div className="ad-field">
                            <label>Last Name</label>
                            <input value={form.lastName} onChange={e => set('lastName', e.target.value)} required placeholder="Doe" />
                        </div>
                    </div>
                    <div className="ad-field">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="jane@school.edu" />
                    </div>
                    <div className="ad-field">
                        <label>Username</label>
                        <input value={form.username} onChange={e => set('username', e.target.value)} required placeholder="janedoe" />
                    </div>
                    <div className="ad-field">
                        <label>Password</label>
                        <div className="ad-pw-wrap">
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => set('password', e.target.value)}
                                required
                                placeholder="Min. 6 characters"
                            />
                            <button type="button" className="ad-pw-toggle" onClick={() => setShowPw(v => !v)}>
                                {showPw ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                    <div className="ad-field">
                        <label>Role</label>
                        <div className="ad-role-buttons">
                            {roleOptions.map(r => (
                                <button
                                    key={r.value}
                                    type="button"
                                    className={`ad-role-btn${form.role === r.value ? ' selected' : ''}`}
                                    onClick={() => set('role', r.value)}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="ad-modal-actions">
                        <button type="button" className="ad-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="ad-btn-confirm" disabled={busy}>
                            {busy ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Reset Password Modal ───────────────────────────────────────────────────────
function ResetModal({ user, onClose }) {
    const [password, setPassword] = useState('');
    const [confirm,  setConfirm]  = useState('');
    const [showPw,   setShowPw]   = useState(false);
    const [busy,     setBusy]     = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) { toast.warn('Password must be at least 6 characters'); return; }
        if (password !== confirm)  { toast.warn('Passwords do not match'); return; }
        setBusy(true);
        try {
            await resetPassword(user.id, password);
            toast.success(`Password reset for ${user.firstName || user.username}`);
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="ad-overlay" onClick={onClose}>
            <div className="ad-modal" onClick={e => e.stopPropagation()}>
                <div className="ad-modal-header">
                    <span className="ad-modal-title">Reset Password</span>
                    <button className="ad-modal-close" onClick={onClose}>✕</button>
                </div>
                <p className="ad-modal-sub">
                    Setting a new password for <strong>{user.firstName} {user.lastName}</strong>
                    {' '}<RolePill role={user.role} />
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="ad-field">
                        <label>New Password</label>
                        <div className="ad-pw-wrap">
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="Min. 6 characters"
                            />
                            <button type="button" className="ad-pw-toggle" onClick={() => setShowPw(v => !v)}>
                                {showPw ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                    <div className="ad-field">
                        <label>Confirm Password</label>
                        <input
                            type={showPw ? 'text' : 'password'}
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            placeholder="Repeat password"
                        />
                    </div>
                    <div className="ad-modal-actions">
                        <button type="button" className="ad-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="ad-btn-confirm" disabled={busy}>
                            {busy ? 'Saving...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const navigate = useNavigate();
    const isSuperAdmin = getRoleFromToken()?.toLowerCase() === 'superadmin';
    const [users,       setUsers]       = useState([]);
    const [search,      setSearch]      = useState('');
    const [loading,     setLoading]     = useState(true);
    const [createOpen,  setCreateOpen]  = useState(false);
    const [resetTarget, setResetTarget] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getUsers(search);
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { load(); }, [load]);

    const counts = users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="ad-root">
            {/* Sidebar */}
            <div className="ad-sidebar">
                <div>
                    <div className="ad-brand">Examnation</div>
                    <div className="ad-brand-sub">Admin</div>
                </div>
                <nav className="ad-nav">
                    <button className="ad-nav-item active">
                        <BiGroup size={16} /> Users
                    </button>
                </nav>
                <div className="ad-sidebar-bottom">
                    <button className="ad-nav-item" onClick={() => { removeToken(); navigate('/login'); }}>
                        <BiLogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="ad-main">
            {/* Header */}
            <div className="ad-header">
                <div>
                    <h1 className="ad-title">Users</h1>
                    <p className="ad-subtitle">Manage accounts and passwords</p>
                </div>
                <div className="ad-header-actions">
                    <button className="ad-create-btn" onClick={() => setCreateOpen(true)}>
                        + Create Account
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="ad-stats-row">
                {[
                    { label: 'Total',    value: users.length,         color: '#6366f1' },
                    { label: 'Students', value: counts.student  || 0, color: '#10b981' },
                    { label: 'Teachers', value: counts.educator || 0, color: '#f59e0b' },
                    { label: 'Admins',   value: counts.admin    || 0, color: '#ef4444' },
                ].map(s => (
                    <div key={s.label} className="ad-stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                        <div className="ad-stat-num" style={{ color: s.color }}>{s.value}</div>
                        <div className="ad-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="ad-table-card">
                <div className="ad-table-toolbar">
                    <input
                        className="ad-search"
                        placeholder="Search by name, email or username..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <span className="ad-count">{users.length} account{users.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                    <div className="ad-loading">Loading...</div>
                ) : users.length === 0 ? (
                    <div className="ad-empty">
                        No accounts found{search ? ` for "${search}"` : ''}.
                    </div>
                ) : (
                    <table className="ad-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="ad-td-name">{u.firstName || ''} {u.lastName || ''}</td>
                                    <td className="ad-td-muted">{u.username}</td>
                                    <td className="ad-td-muted">{u.email}</td>
                                    <td><RolePill role={u.role} /></td>
                                    <td className="ad-td-muted">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td>
                                        <button className="ad-reset-btn" onClick={() => setResetTarget(u)}>
                                            Reset Password
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {createOpen  && <CreateModal onClose={() => setCreateOpen(false)} onCreated={load} isSuperAdmin={isSuperAdmin} />}
            {resetTarget && <ResetModal  user={resetTarget} onClose={() => setResetTarget(null)} />}
            </div>{/* ad-main */}
        </div>
    );
}
