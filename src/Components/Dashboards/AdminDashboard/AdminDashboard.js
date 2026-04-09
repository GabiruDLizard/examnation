import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getUsers, createAccount, editUser, deleteUser, resetPassword, getOrganizations, createOrganization, getResetRequests, completeResetRequest, dismissResetRequest, getLibrary, createQuestion as createQuestionApi, editQuestion as editQuestionApi, deleteQuestion, getInquiries, updateInquiryStatus } from './AdminService';
import { removeToken, getRoleFromToken, getInstitutionIdFromToken } from '../../../utils/tokenUtils';
import { useNavigate } from 'react-router-dom';
import { BiGroup, BiLogOut, BiBuildings, BiKey, BiEdit, BiTrash, BiMessageRoundedDots, BiFile } from 'react-icons/bi';
import AdminReports from './AdminReports';
import Swal from 'sweetalert2';
import './AdminDashboard.css';
import '../TeacherDashboard/MathFieldEditor.css';
import '../Assignments.css';
import Breadcrumb from '../../Breadcrumb/Breadcrumb.js';
import MathFieldEditor from '../TeacherDashboard/MathFieldEditor';

const ROLE_LABEL = { student: 'Student', educator: 'Teacher', admin: 'Admin', superadmin: 'Super Admin' };

const BGCSE_SUBJECTS = [
    'Mathematics', 'English Language', 'English Literature',
    'Biology', 'Chemistry', 'Physics', 'Economics',
    'History', 'Geography', 'Religious Studies', 'Art & Design',
    'Information Technology', 'Physical Education', 'Spanish',
    'French', 'Business Studies', 'Accounting',
];
const ROLE_OPTIONS_BASE  = [{ value: 'student', label: 'Student' }, { value: 'educator', label: 'Teacher' }];
const ROLE_OPTIONS_SUPER = [...ROLE_OPTIONS_BASE, { value: 'admin', label: 'School Admin' }];

function RolePill({ role }) {
    return <span className={`adm-role-pill adm-role-${role}`}>{ROLE_LABEL[role] ?? role}</span>;
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
        <div className="adm-overlay" onClick={onClose}>
            <div className="adm-modal" onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <span className="adm-modal-title">Create Account</span>
                    <button className="adm-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="adm-modal-row">
                        <div className="adm-field">
                            <label>First Name</label>
                            <input value={form.firstName} onChange={e => set('firstName', e.target.value)} required placeholder="Jane" />
                        </div>
                        <div className="adm-field">
                            <label>Last Name</label>
                            <input value={form.lastName} onChange={e => set('lastName', e.target.value)} required placeholder="Doe" />
                        </div>
                    </div>
                    <div className="adm-field">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="jane@school.edu" />
                    </div>
                    <div className="adm-field">
                        <label>Username</label>
                        <input value={form.username} onChange={e => set('username', e.target.value)} required placeholder="janedoe" />
                    </div>
                    <div className="adm-field">
                        <label>Password</label>
                        <div className="adm-pw-wrap">
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => set('password', e.target.value)}
                                required
                                placeholder="Min. 6 characters"
                            />
                            <button type="button" className="adm-pw-toggle" onClick={() => setShowPw(v => !v)}>
                                {showPw ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                    {isSuperAdmin && organizations.length > 0 && (
                        <div className="adm-field">
                            <label>School / Organization</label>
                            <select
                                className="adm-select"
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
                    <div className="adm-field">
                        <label>Role</label>
                        <div className="adm-role-buttons">
                            {roleOptions.map(r => (
                                <button
                                    key={r.value}
                                    type="button"
                                    className={`adm-role-btn${form.role === r.value ? ' selected' : ''}`}
                                    onClick={() => set('role', r.value)}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="adm-modal-actions">
                        <button type="button" className="adm-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="adm-btn-confirm" disabled={busy}>
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
        <div className="adm-overlay" onClick={onClose}>
            <div className="adm-modal" onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <span className="adm-modal-title">Reset Password</span>
                    <button className="adm-modal-close" onClick={onClose}>✕</button>
                </div>
                <p className="adm-modal-sub">
                    Setting a new password for <strong>{user.firstName} {user.lastName}</strong>
                    {' '}<RolePill role={user.role} />
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="adm-field">
                        <label>New Password</label>
                        <div className="adm-pw-wrap">
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="Min. 6 characters"
                            />
                            <button type="button" className="adm-pw-toggle" onClick={() => setShowPw(v => !v)}>
                                {showPw ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                    <div className="adm-field">
                        <label>Confirm Password</label>
                        <input
                            type={showPw ? 'text' : 'password'}
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            placeholder="Repeat password"
                        />
                    </div>
                    <div className="adm-modal-actions">
                        <button type="button" className="adm-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="adm-btn-confirm" disabled={busy}>
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
        <div className="adm-overlay" onClick={onClose}>
            <div className="adm-modal" onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <span className="adm-modal-title">Add Organization</span>
                    <button className="adm-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="adm-field">
                        <label>School / Organization Name</label>
                        <input value={form.institutionName} onChange={e => set('institutionName', e.target.value)} required placeholder="Doris Johnson Senior High" />
                    </div>
                    <div className="adm-modal-row">
                        <div className="adm-field">
                            <label>Country</label>
                            <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Bahamas" />
                        </div>
                        <div className="adm-field">
                            <label>Level</label>
                            <input value={form.institutionLevel} onChange={e => set('institutionLevel', e.target.value)} placeholder="Senior High" />
                        </div>
                    </div>
                    <div className="adm-modal-actions">
                        <button type="button" className="adm-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="adm-btn-confirm" disabled={busy}>
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
        <div className="adm-overlay" onClick={onClose}>
            <div className="adm-modal" onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <span className="adm-modal-title">Edit User</span>
                    <button className="adm-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="adm-modal-row">
                        <div className="adm-field">
                            <label>First Name</label>
                            <input value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
                        </div>
                        <div className="adm-field">
                            <label>Last Name</label>
                            <input value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
                        </div>
                    </div>
                    <div className="adm-field">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                    </div>
                    <div className="adm-field">
                        <label>Username</label>
                        <input value={form.username} onChange={e => set('username', e.target.value)} required />
                    </div>
                    {isSuperAdmin && organizations.length > 0 && (
                        <div className="adm-field">
                            <label>School / Organization</label>
                            <select className="adm-select" value={form.institutionId} onChange={e => set('institutionId', e.target.value)}>
                                <option value="">— None —</option>
                                {organizations.map(o => (
                                    <option key={o.institutionId} value={o.institutionId}>{o.institutionName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="adm-field">
                        <label>Role</label>
                        <div className="adm-role-buttons">
                            {roleOptions.map(r => (
                                <button key={r.value} type="button"
                                    className={`adm-role-btn${form.role === r.value ? ' selected' : ''}`}
                                    onClick={() => set('role', r.value)}>
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="adm-modal-actions">
                        <button type="button" className="adm-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="adm-btn-confirm" disabled={busy}>
                            {busy ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Inquiry View Modal ────────────────────────────────────────
function InquiryViewModal({ inquiry, onClose, onStatusChange }) {
    const [busy, setBusy] = useState(false);
    const handleStatusUpdate = async (newStatus) => {
        setBusy(true);
        try {
            await updateInquiryStatus(inquiry.id, newStatus);
            toast.success(`Inquiry marked as ${newStatus}`);
            if (onStatusChange) onStatusChange();
            onClose();
        } catch (err) { 
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="adm-overlay" onClick={onClose}>
            <div className="adm-modal" onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <span className="adm-modal-title">Inquiry Details</span>
                    <button className="adm-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="adm-modal-content">
                    <p><strong>From:</strong> {inquiry.firstName} {inquiry.lastName} ({inquiry.email})</p>
                    {inquiry.schoolName && <p><strong>School:</strong> {inquiry.schoolName}</p>}
                    <p><strong>Title:</strong> {inquiry.title || '—'}</p>
                    <p><strong>Message:</strong></p>
                    <div className="adm-inquiry-message">{inquiry.request || '—'}</div>
                </div>
                <div className="adm-modal-actions">
                    <button type="button" className="adm-btn-confirm" onClick={() => handleStatusUpdate('contacted')} disabled={busy}>
                        Mark as Contacted
                    </button>
                    <button type="button" className="adm-btn-cancel" onClick={() => handleStatusUpdate('dismissed')} disabled={busy}>
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}


// ── Question Form Modal (create + edit) ────────────────────────────────────────
function QuestionFormModal({ onClose, onSubmit, question }) {
    const isEdit = !!question;
    const [form, setForm] = useState({
        questionText:          question?.questionText        || '',
        answerType:            question?.answerType          || 'Short Answer',
        difficultyLevel:       question?.difficultyLevel     || 'Easy',
        bgcseSubject:          question?.bgcseSubject        || '',
        subject:               question?.subject             || '',
        paper:                 question?.paper               || '',
        points:                Math.min(10, question?.points || 1.0),
        multipleChoiceOptions: question?.options             || [],
        correctAnswer:         question?.correctAnswer       || '',
        answerBreakdown:       question?.answerBreakdown     || '',
        imageAssociated:       null,
        figureBlobUrl:         question?.figureBlobUrl       || '',
        figureDescription:     question?.figureDescription   || '',
        solutionSteps:         question?.solutionSteps       || '',
        subjectId:             question?.subjectId           || null,
    });
    const [busy, setBusy] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const addOption    = () => set('multipleChoiceOptions', [...form.multipleChoiceOptions, '']);
    const updateOption = (i, v) => { const opts = [...form.multipleChoiceOptions]; opts[i] = v; set('multipleChoiceOptions', opts); };
    const removeOption = (i)    => set('multipleChoiceOptions', form.multipleChoiceOptions.filter((_, idx) => idx !== i));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.questionText.trim()) { toast.warn('Question text is required'); return; }
        if (!form.correctAnswer.trim()) { toast.warn('Correct answer is required'); return; }
        setBusy(true);
        try {
            await onSubmit({ ...form, points: parseFloat(form.points) || 1.0 });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="adm-overlay" onClick={onClose}>
            <div className="adm-modal adm-modal--wide" onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <span className="adm-modal-title">{isEdit ? 'Edit Question' : 'Add Question'}</span>
                    <button className="adm-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Question Text *</label>
                        <MathFieldEditor
                            value={form.questionText}
                            onChange={v => set('questionText', v)}
                            placeholder="Enter the question text…"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Answer Type</label>
                            <select value={form.answerType} onChange={e => set('answerType', e.target.value)}>
                                <option value="Short Answer">Short Answer</option>
                                <option value="Multiple Choice">Multiple Choice</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Difficulty Level</label>
                            <select value={form.difficultyLevel} onChange={e => set('difficultyLevel', e.target.value)}>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                                <option value="Very Hard">Very Hard</option>
                            </select>
                            <small style={{ color: '#64748b', fontSize: '11px' }}>Used for readiness tracking</small>
                        </div>
                        <div className="form-group">
                            <label>Points</label>
                            <input type="number" step="0.5" min="0.5" max="10" value={form.points} onChange={e => set('points', Math.min(10, parseFloat(e.target.value) || 0.5))} />
                            <small style={{ color: '#64748b', fontSize: '11px' }}>Counts toward assignment grade (max 10)</small>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Subject</label>
                            <select value={form.bgcseSubject} onChange={e => set('bgcseSubject', e.target.value)}>
                                <option value="">— Select Subject —</option>
                                {BGCSE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Topic</label>
                            <input
                                type="text"
                                placeholder="e.g. Algebra, Probability, Photosynthesis"
                                value={form.subject}
                                onChange={e => set('subject', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Paper</label>
                            <select value={form.paper} onChange={e => set('paper', e.target.value)}>
                                <option value="">— Select Paper —</option>
                                <option value="Paper 1">Paper 1</option>
                                <option value="Paper 2">Paper 2</option>
                                <option value="Paper 3">Paper 3</option>
                                <option value="Paper 4">Paper 4</option>
                            </select>
                        </div>
                    </div>

                    {form.answerType === 'Multiple Choice' && (
                        <div className="form-group">
                            <label>Multiple Choice Options</label>
                            <div className="multiple-choice-options">
                                {form.multipleChoiceOptions.map((opt, i) => (
                                    <div key={i} className="option-input">
                                        <MathFieldEditor
                                            value={opt}
                                            onChange={v => updateOption(i, v)}
                                            placeholder={`Option ${i + 1}`}
                                        />
                                        <button type="button" onClick={() => removeOption(i)} className="remove-option-btn">✕</button>
                                    </div>
                                ))}
                                <button type="button" onClick={addOption} className="add-option-btn">+ Add Option</button>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Correct Answer *</label>
                        <MathFieldEditor
                            value={form.correctAnswer}
                            onChange={v => set('correctAnswer', v)}
                            placeholder="Enter the correct answer…"
                        />
                    </div>

                    <div className="form-group">
                        <label>Answer Breakdown <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
                        <MathFieldEditor
                            value={form.answerBreakdown}
                            onChange={v => set('answerBreakdown', v)}
                            placeholder="Provide a detailed explanation for the solution…"
                        />
                    </div>

                    <div className="form-group">
                        <label>Image (optional)</label>
                        <input type="file" accept="image/*" onChange={e => set('imageAssociated', e.target.files[0])} />
                        <small>Accepted formats: JPG, PNG, GIF. Max size: 5MB</small>
                    </div>

                    <div className="adm-modal-actions">
                        <button type="button" className="adm-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="adm-btn-confirm" disabled={busy}>
                            {busy ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Question'}
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
    const [questionModalOpen, setQuestionModalOpen] = useState(false);
    const [editQuestionTarget, setEditQuestionTarget] = useState(null);
    const [questionSearch, setQuestionSearch] = useState('');
    const [libPage, setLibPage] = useState(0);
    const LIB_PAGE_SIZE = 20;
    const [library,         setLibrary]       = useState([]);
    const [inquiries, setInquiries]           = useState([]);
    const [selectedInquiry, setSelectedInquiry] = useState(null);

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

    const loadLibrary = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getLibrary();
            setLibrary(Array.isArray(data) ? data.filter(q => q.source === 'admin') : []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDeleteQuestion = async (questionId) => {
        try {
            await deleteQuestion(questionId);
            setLibrary((prev) => prev.filter((q) => q.id !== questionId));
            toast.success('Question deleted successfully');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleCreateQuestion = async (questionData) => {
        try {
            const newQuestion = await createQuestionApi(questionData);
            setLibrary((prev) => [...prev, newQuestion]);
            toast.success('Question created successfully');
            setQuestionModalOpen(false);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleEditQuestion = async (questionData) => {
        try {
            const updated = await editQuestionApi(editQuestionTarget.id, questionData);
            setLibrary((prev) => prev.map(q => q.id === editQuestionTarget.id ? { ...q, ...updated } : q));
            toast.success('Question updated successfully');
            setEditQuestionTarget(null);
        } catch (err) {
            toast.error(err.message);
        }
    };

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

    const loadInquiries = useCallback(async () => {
        setLoading(true);
        try{
            const data = await getInquiries();
            setInquiries(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'users')          loadUsers();
        else if (view === 'orgs')      loadOrgs();
        else if (view === 'requests')  loadRequests();
        else if (view === 'lib-editor') loadLibrary();
        else if (view === 'inquiries') loadInquiries();
    }, [view, loadUsers, loadOrgs, loadRequests, loadLibrary, loadInquiries]);

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
            case 'reports':  return [root, { label: 'Reports' }];
            case 'users':    return [root, { label: 'Users' }];
            case 'requests': return [root, { label: 'Reset Requests' }];
            case 'orgs':     return [root, { label: 'Organizations' }];
            case 'lib-editor': return [root, { label: 'Library Editor'}];
            case 'inquiries': return [root, { label: 'Inquiries'}];
            default:         return [root];
        }
    };

    return (
        <div className="adm-root">
            {/* Sidebar */}
            <div className="adm-sidebar">
                <div>
                    <div className="adm-brand">Examnation</div>
                    <div className="adm-brand-sub">{isSuperAdmin ? 'Super Admin' : 'Admin'}</div>
                    {!isSuperAdmin && myInstitutionId && orgMap[myInstitutionId] && (
                        <div className="adm-brand-org">{orgMap[myInstitutionId]}</div>
                    )}
                </div>
                <nav className="adm-nav">
                    <button className={`adm-nav-item${view === 'users' ? ' active' : ''}`} onClick={() => setView('users')}>
                        <BiGroup size={16} /> Users
                    </button>
                    <button className={`adm-nav-item${view === 'reports' ? ' active' : ''}`} onClick={() => setView('reports')}>
                        <BiFile size={16} /> Reports
                    </button>
                    <button className={`adm-nav-item${view === 'requests' ? ' active' : ''}`} onClick={() => setView('requests')}>
                        <BiKey size={16} /> Reset Requests
                        {resetRequests.length > 0 && (
                            <span className="adm-badge">{resetRequests.length}</span>
                        )}
                    </button>
                    {isSuperAdmin && (
                        <>
                            <button className={`adm-nav-item${view === 'orgs' ? ' active' : ''}`} onClick={() => setView('orgs')}>
                                <BiBuildings size={16} /> Organizations
                            </button>
                            <button className={`adm-nav-item${view === 'lib-editor' ? ' active' : ''}`} onClick={() => setView('lib-editor')}>
                                <BiEdit size={16} /> Library Editor
                            </button>
                            <button className={`adm-nav-item${view === 'inquiries' ? ' active' : ''}`} onClick={() => setView('inquiries')}>
                                <BiMessageRoundedDots size={16} /> Inquiries
                            </button>
                        </>
                    )}
                </nav>
                <div className="adm-sidebar-bottom">
                    <button className="adm-nav-item" onClick={() => { removeToken(); navigate('/login'); }}>
                        <BiLogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="adm-main">
                <Breadcrumb crumbs={getBreadcrumbs()} />

                {/* ── Library Editor View ── */}
                {view === 'lib-editor' && isSuperAdmin && (<>
                    <div className="adm-header">
                        <div>
                            <h1 className="adm-title">Question Library</h1>
                            <p className="adm-subtitle">Add, Edit, or Delete Practice Questions</p>
                        </div>
                        <div className="adm-header-actions">
                            <button className="adm-create-btn" onClick={() => setQuestionModalOpen(true)}>
                                + Add Question
                            </button>
                        </div>
                    </div>
                    <div className="adm-table-card">
                        <input
                            className="adm-search"
                            placeholder="Search questions..."
                            value={questionSearch}
                            onChange={e => { setQuestionSearch(e.target.value); setLibPage(0); }}
                        />
                        <span className="adm-count">{library.length} question{library.length !== 1 ? 's' : ''}</span>
                        {loading ? (
                            <div className="adm-loading">Loading...</div>
                        ) : library.length === 0 ? (
                            <div className="adm-empty">No questions found{questionSearch ? ` for "${questionSearch}"` : ''}.</div>
                        ) : (
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Question</th>
                                        <th>Answer</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const filtered = library.filter(q => !questionSearch || q.questionText?.toLowerCase().includes(questionSearch.toLowerCase()) || q.subject?.toLowerCase().includes(questionSearch.toLowerCase()));
                                        const totalPages = Math.ceil(filtered.length / LIB_PAGE_SIZE);
                                        const page = Math.min(libPage, Math.max(0, totalPages - 1));
                                        const pageItems = filtered.slice(page * LIB_PAGE_SIZE, (page + 1) * LIB_PAGE_SIZE);
                                        return (<>
                                            {pageItems.map(q => (
                                                <tr key={q.id}>
                                                    <td>{q.questionText}</td>
                                                    <td>{q.correctAnswer}</td>
                                                    <td>
                                                        <div className="adm-row-actions">
                                                            <button className="adm-icon-btn" title="Edit" aria-label="Edit question"
                                                                onClick={() => setEditQuestionTarget(q)}>
                                                                <BiEdit size={15} />
                                                            </button>
                                                            <button className="adm-icon-btn adm-icon-btn--danger" title="Delete" aria-label="Delete question"
                                                                onClick={async () => {
                                                                    const result = await Swal.fire({
                                                                        title: 'Delete question?',
                                                                        text: 'This question will be permanently removed from the library.',
                                                                        icon: 'warning',
                                                                        showCancelButton: true,
                                                                        confirmButtonColor: '#ef4444',
                                                                        cancelButtonColor: '#e2e8f0',
                                                                        confirmButtonText: 'Yes, delete',
                                                                        cancelButtonText: 'Cancel',
                                                                    });
                                                                    if (!result.isConfirmed) return;
                                                                    handleDeleteQuestion(q.id);
                                                                }}>
                                                                <BiTrash size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {totalPages > 1 && (
                                                <tr>
                                                    <td colSpan={3}>
                                                        <div className="adm-pagination">
                                                            <button className="adm-page-btn" onClick={() => setLibPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
                                                            <span className="adm-page-info">Page {page + 1} of {totalPages}</span>
                                                            <button className="adm-page-btn" onClick={() => setLibPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next →</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>);
                                    })()}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>)}

                {/* ── Reports View ── */}
                {view === 'reports' && <AdminReports />}

                {/* ── Users View ── */}
                {view === 'users' && (<>
                    <div className="adm-header">
                        <div>
                            <h1 className="adm-title">Users</h1>
                            <p className="adm-subtitle">Manage accounts and passwords</p>
                        </div>
                        <div className="adm-header-actions">
                            <button className="adm-create-btn" onClick={() => setCreateOpen(true)}>
                                + Create Account
                            </button>
                        </div>
                        
                    </div>

                    <div className="adm-stats-row">
                        {[
                            { label: 'Total',    value: users.length,         color: '#6366f1' },
                            { label: 'Students', value: counts.student  || 0, color: '#10b981' },
                            { label: 'Teachers', value: counts.educator || 0, color: '#f59e0b' },
                            { label: 'Admins',   value: counts.admin    || 0, color: '#ef4444' },
                        ].map(s => (
                            <div key={s.label} className="adm-stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                                <div className="adm-stat-num" style={{ color: s.color }}>{s.value}</div>
                                <div className="adm-stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="adm-table-card">
                        <div className="adm-table-toolbar">
                            <input
                                className="adm-search"
                                placeholder="Search by name, email or username..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <span className="adm-count">{users.length} account{users.length !== 1 ? 's' : ''}</span>
                        </div>

                        {loading ? (
                            <div className="adm-loading">Loading...</div>
                        ) : users.length === 0 ? (
                            <div className="adm-empty">No accounts found{search ? ` for "${search}"` : ''}.</div>
                        ) : (
                            <table className="adm-table">
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
                                            <td className="adm-td-name">{u.firstName || ''} {u.lastName || ''}</td>
                                            <td className="adm-td-muted">{u.username}</td>
                                            <td className="adm-td-muted">{u.email}</td>
                                            <td><RolePill role={u.role} /></td>
                                            {isSuperAdmin && (
                                                <td className="adm-td-muted">
                                                    {u.institutionId ? (orgMap[u.institutionId] || `Org #${u.institutionId}`) : '—'}
                                                </td>
                                            )}
                                            <td className="adm-td-muted">
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <div className="adm-row-actions">
                                                    <button className="adm-icon-btn" title="Edit" aria-label="Edit user" onClick={() => setEditTarget(u)}>
                                                        <BiEdit size={15} />
                                                    </button>
                                                    <button className="adm-reset-btn" onClick={() => setResetTarget(u)}>
                                                        Reset Password
                                                    </button>
                                                    <button className="adm-icon-btn adm-icon-btn--danger" title="Delete" aria-label="Delete user"
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
                    <div className="adm-header">
                        <div>
                            <h1 className="adm-title">Organizations</h1>
                            <p className="adm-subtitle">Schools and institutions on the platform</p>
                        </div>
                        <div className="adm-header-actions">
                            <button className="adm-create-btn" onClick={() => setCreateOrg(true)}>
                                + Add Organization
                            </button>
                        </div>
                    </div>

                    <div className="adm-table-card">
                        <div className="adm-table-toolbar">
                            <span className="adm-count">{orgs.length} organization{orgs.length !== 1 ? 's' : ''}</span>
                        </div>
                        {loading ? (
                            <div className="adm-loading">Loading...</div>
                        ) : orgs.length === 0 ? (
                            <div className="adm-empty">No organizations yet.</div>
                        ) : (
                            <table className="adm-table">
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
                                            <td className="adm-td-name">{o.institutionName}</td>
                                            <td className="adm-td-muted">{o.country}</td>
                                            <td className="adm-td-muted">{o.institutionLevel || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>)}
                {/* ── Inquiries View ── */}
                {view === 'inquiries' && (<>
                    <div className="adm-header">
                        <div>
                            <h1 className="adm-title">Site Inquiries</h1>
                            <p className="adm-subtitle">Current and potential customers requesting a demo or asking questions.</p>
                        </div>
                    </div>
                    <div className="adm-table-card">
                        <div className="adm-table-toolbar">
                            <span className="adm-count">
                                {inquiries.length} inquir{inquiries.length !== 1 ? 'ies' : 'y'}
                            </span>
                        </div>
                        {loading ? (
                            <div className="adm-loading">Loading...</div>
                        ) : inquiries.length === 0 ? (
                            <div className="adm-empty">No existing inquiries at this time.</div>
                        ) : (
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>School</th>
                                        <th>Title</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inquiries.map(r => (
                                        <tr key={r.id} onClick={() => setSelectedInquiry(r)} style={{ cursor: 'pointer' }}>
                                            <td className="adm-td-name">{r.firstName || ''} {r.lastName || ''}</td>
                                            <td className="adm-td-muted">{r.email}</td>
                                            <td className="adm-td-muted">{r.schoolName || '—'}</td>
                                            <td className="adm-td-muted">{r.title || '—'}</td>
                                            <td>
                                                <span className={`adm-role-pill adm-inq-${r.status}`}>{r.status}</span>
                                            </td>
                                            <td className="adm-td-muted">
                                                {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="adm-req-actions" onClick={e => e.stopPropagation()}>
                                                <select
                                                    className="adm-select"
                                                    value={r.status}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;
                                                        try {
                                                            await updateInquiryStatus(r.id, newStatus);
                                                            setInquiries(prev => prev.map(x => x.id === r.id ? { ...x, status: newStatus } : x));
                                                            toast.success('Status updated');
                                                        } catch (err) { toast.error(err.message); }
                                                    }}
                                                    style={{ fontSize: '0.78rem' }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="contacted">Contacted</option>
                                                    <option value="converted">Converted</option>
                                                    <option value="dismissed">Dismissed</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                </>)}

                {/* ── Reset Requests View ── */}
                {view === 'requests' && (<>
                    <div className="adm-header">
                        <div>
                            <h1 className="adm-title">Reset Requests</h1>
                            <p className="adm-subtitle">Students and teachers who need their password reset</p>
                        </div>
                    </div>

                    <div className="adm-table-card">
                        <div className="adm-table-toolbar">
                            <span className="adm-count">
                                {resetRequests.length} pending request{resetRequests.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        {loading ? (
                            <div className="adm-loading">Loading...</div>
                        ) : resetRequests.length === 0 ? (
                            <div className="adm-empty">No pending reset requests.</div>
                        ) : (
                            <table className="adm-table">
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
                                            <td className="adm-td-name">{r.firstName || ''} {r.lastName || ''}</td>
                                            <td className="adm-td-muted">{r.username}</td>
                                            <td className="adm-td-muted">{r.email}</td>
                                            <td className="adm-td-muted">
                                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="adm-req-actions">
                                                <button
                                                    className="adm-create-btn"
                                                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                                                    onClick={() => {
                                                        setResetTarget({ id: r.userId, firstName: r.firstName, lastName: r.lastName, username: r.username, role: r.role });
                                                        setResetRequestId(r.id);
                                                    }}
                                                >
                                                    Reset Password
                                                </button>
                                                <button
                                                    className="adm-reset-btn"
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

            </div>{/* adm-main */}

            {questionModalOpen   && <QuestionFormModal onClose={() => setQuestionModalOpen(false)}    onSubmit={handleCreateQuestion} />}
            {editQuestionTarget && <QuestionFormModal onClose={() => setEditQuestionTarget(null)} onSubmit={handleEditQuestion}    question={editQuestionTarget} />}
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
            {selectedInquiry && (
                <InquiryViewModal
                    inquiry={selectedInquiry}
                    onClose={() => setSelectedInquiry(null)}
                    onStatusChange={() => {
                        loadInquiries();
                        setSelectedInquiry(null);
                    }}
                />
            )}
        </div>
    );
}
