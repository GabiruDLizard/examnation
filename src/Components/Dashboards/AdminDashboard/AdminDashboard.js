import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getUsers, createAccount, editUser, deleteUser, resetPassword, getOrganizations, createOrganization, getResetRequests, completeResetRequest, dismissResetRequest } from './AdminService';
import { removeToken, getRoleFromToken, getInstitutionIdFromToken } from '../../../utils/tokenUtils';
import { useNavigate } from 'react-router-dom';
import { BiGroup, BiLogOut, BiBuildings, BiKey, BiEdit, BiTrash } from 'react-icons/bi';
import Swal from 'sweetalert2';
import './AdminDashboard.css';
import Breadcrumb from '../../Breadcrumb/Breadcrumb.js';

const ROLE_LABEL = { student: 'Student', educator: 'Teacher', admin: 'Admin', superadmin: 'Super Admin' };
const ROLE_OPTIONS_BASE  = [{ value: 'student', label: 'Student' }, { value: 'educator', label: 'Teacher' }];
const ROLE_OPTIONS_SUPER = [...ROLE_OPTIONS_BASE, { value: 'admin', label: 'School Admin' }];

function RolePill({ role }) {
    return <span className={`ad-role-pill ad-role-${role}`}>{ROLE_LABEL[role] ?? role}</span>;
}

// ── Create Account Modal ────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated, isSuperAdmin, organizations }) {
    const roleOptions = isSuperAdmin ? ROLE_OPTIONS_SUPER : ROLE_OPTIONS_BASE;
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', username: '', password: '',
        role: 'student', institutionId: '',
    });
    const [showPw, setShowPw] = useState(false);
    const [busy,   setBusy]   = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) { toast.warn('Password must be at least 6 characters'); return; }
        setBusy(true);
        try {
            await createAccount({
                ...form,
                institutionId: form.institutionId ? parseInt(form.institutionId, 10) : null,
            });
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
                    {isSuperAdmin && organizations.length > 0 && (
                        <div className="ad-field">
                            <label>School / Organization</label>
                            <select
                                className="ad-select"
                                value={form.institutionId}
                                onChange={e => set('institutionId', e.target.value)}
                            >
                                <option value="">— None —</option>
                                {organizations.map(o => (
                                    <option key={o.institutionId} value={o.institutionId}>
                                        {o.institutionName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
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

// ── Reset Password Modal ────────────────────────────────────────────────────────
function ResetModal({ user, onClose, requestId, onComplete }) {
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
            if (requestId) await completeResetRequest(requestId).catch(() => {});
            toast.success(`Password reset for ${user.firstName || user.username}`);
            if (onComplete) onComplete();
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

// ── Create Organization Modal ───────────────────────────────────────────────────
function CreateOrgModal({ onClose, onCreated }) {
    const [form, setForm] = useState({ institutionName: '', country: 'Bahamas', institutionLevel: '' });
    const [busy, setBusy] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await createOrganization(form);
            toast.success(`Organization "${form.institutionName}" created`);
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
                    <span className="ad-modal-title">Add Organization</span>
                    <button className="ad-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="ad-field">
                        <label>School / Organization Name</label>
                        <input value={form.institutionName} onChange={e => set('institutionName', e.target.value)} required placeholder="Doris Johnson Senior High" />
                    </div>
                    <div className="ad-modal-row">
                        <div className="ad-field">
                            <label>Country</label>
                            <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Bahamas" />
                        </div>
                        <div className="ad-field">
                            <label>Level</label>
                            <input value={form.institutionLevel} onChange={e => set('institutionLevel', e.target.value)} placeholder="Senior High" />
                        </div>
                    </div>
                    <div className="ad-modal-actions">
                        <button type="button" className="ad-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="ad-btn-confirm" disabled={busy}>
                            {busy ? 'Creating...' : 'Add Organization'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Edit User Modal ─────────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSaved, isSuperAdmin, organizations }) {
    const roleOptions = isSuperAdmin ? ROLE_OPTIONS_SUPER : ROLE_OPTIONS_BASE;
    const [form, setForm] = useState({
        firstName:     user.firstName   || '',
        lastName:      user.lastName    || '',
        email:         user.email       || '',
        username:      user.username    || '',
        role:          user.role        || 'student',
        institutionId: user.institutionId ? String(user.institutionId) : '',
    });
    const [busy, setBusy] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await editUser(user.id, {
                ...form,
                institutionId: form.institutionId ? parseInt(form.institutionId, 10) : null,
            });
            toast.success(`${form.firstName} ${form.lastName} updated`);
            onSaved();
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
                    <span className="ad-modal-title">Edit User</span>
                    <button className="ad-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="ad-modal-row">
                        <div className="ad-field">
                            <label>First Name</label>
                            <input value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
                        </div>
                        <div className="ad-field">
                            <label>Last Name</label>
                            <input value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
                        </div>
                    </div>
                    <div className="ad-field">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                    </div>
                    <div className="ad-field">
                        <label>Username</label>
                        <input value={form.username} onChange={e => set('username', e.target.value)} required />
                    </div>
                    {isSuperAdmin && organizations.length > 0 && (
                        <div className="ad-field">
                            <label>School / Organization</label>
                            <select className="ad-select" value={form.institutionId} onChange={e => set('institutionId', e.target.value)}>
                                <option value="">— None —</option>
                                {organizations.map(o => (
                                    <option key={o.institutionId} value={o.institutionId}>{o.institutionName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="ad-field">
                        <label>Role</label>
                        <div className="ad-role-buttons">
                            {roleOptions.map(r => (
                                <button key={r.value} type="button"
                                    className={`ad-role-btn${form.role === r.value ? ' selected' : ''}`}
                                    onClick={() => set('role', r.value)}>
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="ad-modal-actions">
                        <button type="button" className="ad-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="ad-btn-confirm" disabled={busy}>
                            {busy ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const navigate = useNavigate();
    const isSuperAdmin    = getRoleFromToken()?.toLowerCase() === 'superadmin';
    const myInstitutionId = getInstitutionIdFromToken();

    const [view,           setView]           = useState('users');   // 'users' | 'orgs' | 'requests'
    const [users,          setUsers]          = useState([]);
    const [orgs,           setOrgs]           = useState([]);
    const [resetRequests,  setResetRequests]  = useState([]);
    const [search,         setSearch]         = useState('');
    const [loading,        setLoading]        = useState(true);
    const [createOpen,     setCreateOpen]     = useState(false);
    const [createOrg,      setCreateOrg]      = useState(false);
    const [resetTarget,    setResetTarget]    = useState(null);
    const [resetRequestId, setResetRequestId] = useState(null);
    const [editTarget,     setEditTarget]     = useState(null);

    const loadUsers = useCallback(async () => {
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

    const loadOrgs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getOrganizations();
            setOrgs(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadRequests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getResetRequests();
            setResetRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'users')    loadUsers();
        else if (view === 'orgs') loadOrgs();
        else if (view === 'requests') loadRequests();
    }, [view, loadUsers, loadOrgs, loadRequests]);

    // Load orgs + request count in background on mount
    useEffect(() => { if (isSuperAdmin) loadOrgs(); }, [isSuperAdmin, loadOrgs]);
    useEffect(() => { loadRequests(); }, [loadRequests]);

    const counts = users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
    }, {});

    // Map institutionId → name for display
    const orgMap = Object.fromEntries(orgs.map(o => [o.institutionId, o.institutionName]));

    const getBreadcrumbs = () => {
        const root = { label: 'Admin' };
        switch (view) {
            case 'users':    return [root, { label: 'Users' }];
            case 'requests': return [root, { label: 'Reset Requests' }];
            case 'orgs':     return [root, { label: 'Organizations' }];
            default:         return [root];
        }
    };

    return (
        <div className="ad-root">
            {/* Sidebar */}
            <div className="ad-sidebar">
                <div>
                    <div className="ad-brand">Examnation</div>
                    <div className="ad-brand-sub">{isSuperAdmin ? 'Super Admin' : 'Admin'}</div>
                    {!isSuperAdmin && myInstitutionId && orgMap[myInstitutionId] && (
                        <div className="ad-brand-org">{orgMap[myInstitutionId]}</div>
                    )}
                </div>
                <nav className="ad-nav">
                    <button className={`ad-nav-item${view === 'users' ? ' active' : ''}`} onClick={() => setView('users')}>
                        <BiGroup size={16} /> Users
                    </button>
                    <button className={`ad-nav-item${view === 'requests' ? ' active' : ''}`} onClick={() => setView('requests')}>
                        <BiKey size={16} /> Reset Requests
                        {resetRequests.length > 0 && (
                            <span className="ad-badge">{resetRequests.length}</span>
                        )}
                    </button>
                    {isSuperAdmin && (
                        <button className={`ad-nav-item${view === 'orgs' ? ' active' : ''}`} onClick={() => setView('orgs')}>
                            <BiBuildings size={16} /> Organizations
                        </button>
                    )}
                </nav>
                <div className="ad-sidebar-bottom">
                    <button className="ad-nav-item" onClick={() => { removeToken(); navigate('/login'); }}>
                        <BiLogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="ad-main">
                <Breadcrumb crumbs={getBreadcrumbs()} />

                {/* ── Users View ── */}
                {view === 'users' && (<>
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
                            <div className="ad-empty">No accounts found{search ? ` for "${search}"` : ''}.</div>
                        ) : (
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        {isSuperAdmin && <th>School</th>}
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
                                            {isSuperAdmin && (
                                                <td className="ad-td-muted">
                                                    {u.institutionId ? (orgMap[u.institutionId] || `Org #${u.institutionId}`) : '—'}
                                                </td>
                                            )}
                                            <td className="ad-td-muted">
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <div className="ad-row-actions">
                                                    <button className="ad-icon-btn" title="Edit" aria-label="Edit user" onClick={() => setEditTarget(u)}>
                                                        <BiEdit size={15} />
                                                    </button>
                                                    <button className="ad-reset-btn" onClick={() => setResetTarget(u)}>
                                                        Reset Password
                                                    </button>
                                                    <button className="ad-icon-btn ad-icon-btn--danger" title="Delete" aria-label="Delete user"
                                                        onClick={async () => {
                                                            const result = await Swal.fire({
                                                                title: 'Delete user?',
                                                                text: `${u.firstName || u.username}'s account will be permanently removed.`,
                                                                icon: 'warning',
                                                                showCancelButton: true,
                                                                confirmButtonColor: '#ef4444',
                                                                cancelButtonColor: '#e2e8f0',
                                                                confirmButtonText: 'Yes, delete',
                                                                cancelButtonText: 'Cancel',
                                                            });
                                                            if (!result.isConfirmed) return;
                                                            try {
                                                                await deleteUser(u.id);
                                                                toast.success(`${u.firstName || u.username} deleted`);
                                                                loadUsers();
                                                            } catch (err) { toast.error(err.message); }
                                                        }}>
                                                        <BiTrash size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>)}

                {/* ── Organizations View (superadmin only) ── */}
                {view === 'orgs' && (<>
                    <div className="ad-header">
                        <div>
                            <h1 className="ad-title">Organizations</h1>
                            <p className="ad-subtitle">Schools and institutions on the platform</p>
                        </div>
                        <div className="ad-header-actions">
                            <button className="ad-create-btn" onClick={() => setCreateOrg(true)}>
                                + Add Organization
                            </button>
                        </div>
                    </div>

                    <div className="ad-table-card">
                        <div className="ad-table-toolbar">
                            <span className="ad-count">{orgs.length} organization{orgs.length !== 1 ? 's' : ''}</span>
                        </div>
                        {loading ? (
                            <div className="ad-loading">Loading...</div>
                        ) : orgs.length === 0 ? (
                            <div className="ad-empty">No organizations yet.</div>
                        ) : (
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Country</th>
                                        <th>Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orgs.map(o => (
                                        <tr key={o.institutionId}>
                                            <td className="ad-td-name">{o.institutionName}</td>
                                            <td className="ad-td-muted">{o.country}</td>
                                            <td className="ad-td-muted">{o.institutionLevel || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>)}

                {/* ── Reset Requests View ── */}
                {view === 'requests' && (<>
                    <div className="ad-header">
                        <div>
                            <h1 className="ad-title">Reset Requests</h1>
                            <p className="ad-subtitle">Students and teachers who need their password reset</p>
                        </div>
                    </div>

                    <div className="ad-table-card">
                        <div className="ad-table-toolbar">
                            <span className="ad-count">
                                {resetRequests.length} pending request{resetRequests.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        {loading ? (
                            <div className="ad-loading">Loading...</div>
                        ) : resetRequests.length === 0 ? (
                            <div className="ad-empty">No pending reset requests.</div>
                        ) : (
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Requested</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resetRequests.map(r => (
                                        <tr key={r.id}>
                                            <td className="ad-td-name">{r.firstName || ''} {r.lastName || ''}</td>
                                            <td className="ad-td-muted">{r.username}</td>
                                            <td className="ad-td-muted">{r.email}</td>
                                            <td className="ad-td-muted">
                                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="ad-req-actions">
                                                <button
                                                    className="ad-create-btn"
                                                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                                                    onClick={() => {
                                                        setResetTarget({ id: r.userId, firstName: r.firstName, lastName: r.lastName, username: r.username, role: r.role });
                                                        setResetRequestId(r.id);
                                                    }}
                                                >
                                                    Reset Password
                                                </button>
                                                <button
                                                    className="ad-reset-btn"
                                                    onClick={async () => {
                                                        const result = await Swal.fire({
                                                            title: 'Dismiss request?',
                                                            text: `${r.firstName || r.username}'s reset request will be removed without resetting their password.`,
                                                            icon: 'question',
                                                            showCancelButton: true,
                                                            confirmButtonColor: '#ef4444',
                                                            cancelButtonColor: '#e2e8f0',
                                                            confirmButtonText: 'Yes, dismiss',
                                                            cancelButtonText: 'Cancel',
                                                        });
                                                        if (!result.isConfirmed) return;
                                                        try {
                                                            await dismissResetRequest(r.id);
                                                            setResetRequests(prev => prev.filter(x => x.id !== r.id));
                                                        } catch (err) { toast.error(err.message); }
                                                    }}
                                                >
                                                    Dismiss
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>)}

            </div>{/* ad-main */}

            {createOpen  && <CreateModal onClose={() => setCreateOpen(false)} onCreated={loadUsers} isSuperAdmin={isSuperAdmin} organizations={orgs} />}
            {editTarget  && <EditModal user={editTarget} onClose={() => setEditTarget(null)} onSaved={loadUsers} isSuperAdmin={isSuperAdmin} organizations={orgs} />}
            {createOrg   && <CreateOrgModal onClose={() => setCreateOrg(false)} onCreated={loadOrgs} />}
            {resetTarget && (
                <ResetModal
                    user={resetTarget}
                    onClose={() => { setResetTarget(null); setResetRequestId(null); }}
                    requestId={resetRequestId}
                    onComplete={() => setResetRequests(prev => prev.filter(r => r.id !== resetRequestId))}
                />
            )}
        </div>
    );
}
