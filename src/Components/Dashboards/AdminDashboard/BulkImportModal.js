import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { authFetch } from '../../../utils/api';
import { toast } from 'react-toastify';

// ── Template definitions ──────────────────────────────────────────────────────
const STUDENT_COLUMNS = ['FirstName', 'LastName', 'Email', 'Username', 'Password'];
const TEACHER_COLUMNS = ['FirstName', 'LastName', 'Email', 'Username', 'Password'];
const CLASS_COLUMNS   = ['Name', 'Subject', 'GradeLevel', 'TeacherUsername'];

const STUDENT_EXAMPLE = [
    { FirstName: 'Jane', LastName: 'Doe', Email: 'jane.doe@school.edu', Username: 'janedoe', Password: 'password123' },
    { FirstName: 'John', LastName: 'Smith', Email: 'john.smith@school.edu', Username: 'johnsmith', Password: 'password123' },
];
const TEACHER_EXAMPLE = [
    { FirstName: 'Mary', LastName: 'Johnson', Email: 'mary.johnson@school.edu', Username: 'maryjohnson', Password: 'password123' },
    { FirstName: 'Robert', LastName: 'Brown', Email: 'robert.brown@school.edu', Username: 'robertbrown', Password: 'password123' },
];
const CLASS_EXAMPLE = [
    { Name: 'Algebra II', Subject: 'Mathematics', GradeLevel: 'Grade 10', TeacherUsername: 'maryjohnson' },
    { Name: 'Biology Honors', Subject: 'Biology', GradeLevel: 'Grade 11', TeacherUsername: 'robertbrown' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function downloadTemplate(type) {
    const cols    = type === 'student' ? STUDENT_COLUMNS : type === 'teacher' ? TEACHER_COLUMNS : CLASS_COLUMNS;
    const example = type === 'student' ? STUDENT_EXAMPLE : type === 'teacher' ? TEACHER_EXAMPLE : CLASS_EXAMPLE;
    const ws = XLSX.utils.json_to_sheet(example, { header: cols });
    const wb = XLSX.utils.book_new();
    const sheetName = type === 'student' ? 'Students' : type === 'teacher' ? 'Teachers' : 'Classes';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${type}_import_template.xlsx`);
}

function validateUserRow(row, type, index) {
    const errors = [];
    if (!row.FirstName?.trim()) errors.push('Missing first name');
    if (!row.LastName?.trim())  errors.push('Missing last name');
    if (!row.Email?.trim())     errors.push('Missing email');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.Email.trim())) errors.push('Invalid email');
    if (!row.Username?.trim())  errors.push('Missing username');
    if (!row.Password?.trim())  errors.push('Missing password');
    else if (row.Password.trim().length < 6) errors.push('Password too short (min 6 chars)');
    return {
        row: index + 1,
        firstName: row.FirstName?.trim() || '',
        lastName:  row.LastName?.trim()  || '',
        email:     row.Email?.trim()     || '',
        username:  row.Username?.trim()  || '',
        password:  row.Password?.trim()  || '',
        role:      type === 'student' ? 'student' : 'educator',
        errors,
        valid: errors.length === 0,
    };
}

function validateClassRow(row, index) {
    const errors = [];
    if (!row.Name?.trim())            errors.push('Missing name');
    if (!row.Subject?.trim())         errors.push('Missing subject');
    if (!row.GradeLevel?.trim())      errors.push('Missing grade level');
    if (!row.TeacherUsername?.trim()) errors.push('Missing teacher username');
    return {
        row: index + 1,
        name:            row.Name?.trim()            || '',
        subject:         row.Subject?.trim()         || '',
        gradeLevel:      row.GradeLevel?.trim()      || '',
        teacherUsername: row.TeacherUsername?.trim() || '',
        errors,
        valid: errors.length === 0,
    };
}

function parseFile(file, type, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const wb   = XLSX.read(e.target.result, { type: 'array' });
            const ws   = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
            const parsed = type === 'class'
                ? rows.map((row, i) => validateClassRow(row, i))
                : rows.map((row, i) => validateUserRow(row, type, i));
            callback(null, parsed);
        } catch (err) {
            callback('Could not parse file. Make sure it is a valid Excel file (.xlsx or .xls).');
        }
    };
    reader.readAsArrayBuffer(file);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BulkImportModal({ onClose, onComplete, initialType = 'student' }) {
    const [type, setType]             = useState(initialType);
    const [step, setStep]             = useState(1);
    const [rows, setRows]             = useState([]);
    const [parseError, setParseError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults]       = useState(null);
    const fileRef = useRef(null);

    // ── Teacher / class dropdowns (student import only) ───────────────────────
    const [teachers,        setTeachers]        = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [classes,         setClasses]         = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [loadingClasses,  setLoadingClasses]  = useState(false);

    useEffect(() => {
        if (type !== 'student') return;
        setLoadingTeachers(true);
        authFetch('/admin/users')
            .then(r => r.json())
            .then(data => setTeachers(Array.isArray(data) ? data.filter(u => u.role === 'educator') : []))
            .catch(() => {})
            .finally(() => setLoadingTeachers(false));
    }, [type]);

    useEffect(() => {
        if (!selectedTeacher) { setClasses([]); setSelectedClassId(''); return; }
        setLoadingClasses(true);
        authFetch(`/class/teacher/${selectedTeacher}`)
            .then(r => r.json())
            .then(data => { setClasses(Array.isArray(data) ? data : []); setSelectedClassId(''); })
            .catch(() => {})
            .finally(() => setLoadingClasses(false));
    }, [selectedTeacher]);

    useEffect(() => {
        if (type !== 'student') { setSelectedTeacher(''); setSelectedClassId(''); setClasses([]); }
    }, [type]);

    const validRows   = rows.filter(r => r.valid);
    const invalidRows = rows.filter(r => !r.valid);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setParseError(null);
        parseFile(file, type, (err, parsed) => {
            if (err) { setParseError(err); return; }
            if (parsed.length === 0) { setParseError('The file appears to be empty.'); return; }
            setRows(parsed);
            setStep(2);
        });
        e.target.value = '';
    };

    const handleSubmit = async () => {
        if (validRows.length === 0) return;
        setSubmitting(true);
        try {
            let res, data;
            if (type === 'class') {
                const payload = validRows.map(r => ({
                    name:            r.name,
                    subject:         r.subject,
                    gradeLevel:      r.gradeLevel,
                    teacherUsername: r.teacherUsername,
                }));
                res  = await authFetch('/admin/classes/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Bulk import failed');
            } else {
                const payload = validRows.map(r => ({
                    firstName: r.firstName,
                    lastName:  r.lastName,
                    email:     r.email,
                    username:  r.username,
                    password:  r.password,
                    role:      r.role,
                    classId:   type === 'student' && selectedClassId ? parseInt(selectedClassId, 10) : null,
                }));
                res  = await authFetch('/admin/users/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Bulk import failed');
            }
            setResults(data);
            setStep(3);
            if (data.totalCreated > 0) onComplete?.();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const reset = () => { setStep(1); setRows([]); setParseError(null); setResults(null); };

    const selectedClass      = classes.find(c => String(c.id) === selectedClassId);
    const selectedTeacherObj = teachers.find(t => String(t.id) === selectedTeacher);
    const columns            = type === 'student' ? STUDENT_COLUMNS : type === 'teacher' ? TEACHER_COLUMNS : CLASS_COLUMNS;

    const typeLabel = (t) => t === 'student' ? 'Students' : t === 'teacher' ? 'Teachers' : 'Classes';
    const rowLabel  = type === 'class' ? 'Class' : type === 'student' ? 'Student' : 'Teacher';

    return (
        <div className="adm-overlay" onClick={onClose}>
            <div className="adm-modal" style={{ maxWidth: 720, width: '95vw' }} onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <span className="adm-modal-title">Bulk Import</span>
                    <button className="adm-modal-close" onClick={onClose}>✕</button>
                </div>

                {/* ── Step 1 ── */}
                {step === 1 && (
                    <div style={{ padding: '20px 0' }}>
                        <p style={{ fontSize: 14, color: '#475569', marginBottom: 20 }}>
                            Download the template, fill it in, then upload it here.
                        </p>

                        {/* Type toggle */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                            {['student', 'teacher', 'class'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setType(t); setRows([]); setParseError(null); }}
                                    style={{
                                        flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                                        fontSize: 14, fontWeight: 600,
                                        border: type === t ? '2px solid #6366f1' : '2px solid #e2e8f0',
                                        background: type === t ? '#eef2ff' : '#fff',
                                        color: type === t ? '#4f46e5' : '#64748b',
                                    }}
                                >{typeLabel(t)}</button>
                            ))}
                        </div>

                        {/* Teacher + Class dropdowns (student only) */}
                        {type === 'student' && (
                            <div style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                                        Teacher <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                                    </div>
                                    <select
                                        className="adm-select"
                                        value={selectedTeacher}
                                        onChange={e => setSelectedTeacher(e.target.value)}
                                        disabled={loadingTeachers}
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                                    >
                                        <option value="">{loadingTeachers ? 'Loading...' : '— No class enrollment —'}</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Class</div>
                                    <select
                                        className="adm-select"
                                        value={selectedClassId}
                                        onChange={e => setSelectedClassId(e.target.value)}
                                        disabled={!selectedTeacher || loadingClasses}
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, opacity: !selectedTeacher ? 0.5 : 1 }}
                                    >
                                        <option value="">
                                            {!selectedTeacher ? '— Select teacher first —' : loadingClasses ? 'Loading...' : classes.length === 0 ? 'No classes found' : '— Select class —'}
                                        </option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Template columns preview */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Template columns:</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {columns.map(col => (
                                    <span key={col} style={{ padding: '2px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 12, color: '#334155' }}>
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => downloadTemplate(type)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, border: '1px solid #e2e8f0', background: '#fff', color: '#334155' }}>
                                ↓ Download Template
                            </button>
                            <button onClick={() => fileRef.current?.click()} style={{ flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, border: 'none', background: '#6366f1', color: '#fff' }}>
                                Upload Excel File
                            </button>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                            Only .xlsx or .xls files are accepted
                        </div>
                        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFile} />
                        {parseError && (
                            <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', fontSize: 13 }}>
                                {parseError}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 2: Preview ── */}
                {step === 2 && (
                    <div style={{ padding: '20px 0' }}>
                        {/* Class enrollment banner (student only) */}
                        {type === 'student' && (
                            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13, background: selectedClassId ? '#eef2ff' : '#f8fafc', border: `1px solid ${selectedClassId ? '#a5b4fc' : '#e2e8f0'}`, color: selectedClassId ? '#4f46e5' : '#64748b' }}>
                                {selectedClassId
                                    ? <>Enrolling into <strong>{selectedClass?.name}</strong> &nbsp;·&nbsp; {selectedTeacherObj?.firstName} {selectedTeacherObj?.lastName}</>
                                    : 'No class selected — students will be created without class enrollment'}
                            </div>
                        )}

                        {/* Summary bar */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                            <div style={{ flex: 1, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13 }}>
                                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 18 }}>{validRows.length}</span>
                                <span style={{ color: '#15803d', marginLeft: 6 }}>ready to import</span>
                            </div>
                            {invalidRows.length > 0 && (
                                <div style={{ flex: 1, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13 }}>
                                    <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 18 }}>{invalidRows.length}</span>
                                    <span style={{ color: '#b91c1c', marginLeft: 6 }}>will be skipped</span>
                                </div>
                            )}
                        </div>

                        {/* Preview table */}
                        <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={th}>#</th>
                                        {type === 'class' ? (<>
                                            <th style={th}>Name</th>
                                            <th style={th}>Subject</th>
                                            <th style={th}>Grade</th>
                                            <th style={th}>Teacher</th>
                                        </>) : (<>
                                            <th style={th}>Name</th>
                                            <th style={th}>Email</th>
                                            <th style={th}>Username</th>
                                        </>)}
                                        <th style={th}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: r.valid ? '#fff' : '#fff8f8' }}>
                                            <td style={td}>{r.row}</td>
                                            {type === 'class' ? (<>
                                                <td style={td}>{r.name}</td>
                                                <td style={td}>{r.subject}</td>
                                                <td style={td}>{r.gradeLevel}</td>
                                                <td style={td}>{r.teacherUsername}</td>
                                            </>) : (<>
                                                <td style={td}>{r.firstName} {r.lastName}</td>
                                                <td style={td}>{r.email}</td>
                                                <td style={td}>{r.username}</td>
                                            </>)}
                                            <td style={td}>
                                                {r.valid
                                                    ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Valid</span>
                                                    : <span style={{ color: '#dc2626', fontSize: 11 }}>{r.errors.join(', ')}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="adm-modal-actions" style={{ marginTop: 16 }}>
                            <button className="adm-btn-cancel" onClick={reset}>← Back</button>
                            <button className="adm-btn-confirm" onClick={handleSubmit} disabled={submitting || validRows.length === 0}>
                                {submitting ? 'Importing...' : `Import ${validRows.length} ${rowLabel}${validRows.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Results ── */}
                {step === 3 && results && (
                    <div style={{ padding: '20px 0' }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                            <div style={{ flex: 1, padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{results.totalCreated}</div>
                                <div style={{ fontSize: 13, color: '#15803d' }}>{type === 'class' ? 'Classes' : 'Accounts'} Created</div>
                            </div>
                            {results.totalFailed > 0 && (
                                <div style={{ flex: 1, padding: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, textAlign: 'center' }}>
                                    <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>{results.totalFailed}</div>
                                    <div style={{ fontSize: 13, color: '#b91c1c' }}>Failed</div>
                                </div>
                            )}
                        </div>

                        {results.failed?.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Failed rows:</div>
                                {results.failed.map((f, i) => (
                                    <div key={i} style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, color: '#b91c1c', marginBottom: 4 }}>
                                        <strong>{f.email || f.name}</strong> — {f.reason}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="adm-modal-actions">
                            <button className="adm-btn-cancel" onClick={reset}>Import More</button>
                            <button className="adm-btn-confirm" onClick={onClose}>Done</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const th = { padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' };
const td = { padding: '8px 12px', color: '#334155' };
