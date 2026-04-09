import React, { useState, useEffect } from 'react';
import { BiArrowBack, BiSearch, BiUser } from 'react-icons/bi';
import { authFetch } from '../../../utils/api';
import TeacherReports from '../TeacherDashboard/TeacherReports';

// ── Teacher picker grid ───────────────────────────────────────────

function TeacherCard({ teacher, onClick }) {
    const initials = [teacher.firstName, teacher.lastName]
        .filter(Boolean).map(n => n[0].toUpperCase()).join('') || '?';

    return (
        <div className="ar-teacher-card" onClick={() => onClick(teacher)}>
            <div className="ar-teacher-avatar" style={{ background: stringToColor(teacher.id) }}>
                {initials}
            </div>
            <div className="ar-teacher-info">
                <span className="ar-teacher-name">
                    {[teacher.firstName, teacher.lastName].filter(Boolean).join(' ') || teacher.username}
                </span>
                <span className="ar-teacher-email">{teacher.email}</span>
                {teacher.institutionName && (
                    <span className="ar-teacher-school">{teacher.institutionName}</span>
                )}
            </div>
            <span className="ar-teacher-cta">View Report →</span>
        </div>
    );
}

function stringToColor(id) {
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
    return colors[id % colors.length];
}

// ── Main component ────────────────────────────────────────────────

export default function AdminReports() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await authFetch('/admin/users');
                if (!res.ok) throw new Error();
                const all = await res.json();
                setTeachers(all.filter(u => u.role === 'educator'));
            } catch {
                setTeachers([]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filtered = teachers.filter(t => {
        const q = search.toLowerCase();
        return (
            (t.firstName + ' ' + t.lastName).toLowerCase().includes(q) ||
            t.email?.toLowerCase().includes(q) ||
            t.username?.toLowerCase().includes(q)
        );
    });

    // ── Teacher selected — show their report ──────────────────────
    if (selectedTeacher) {
        return (
            <div>
                <div className="ar-back-bar">
                    <button className="ar-back-btn" onClick={() => setSelectedTeacher(null)}>
                        <BiArrowBack size={16} /> Back to Teachers
                    </button>
                    <span className="ar-back-label">
                        Report for{' '}
                        <strong>
                            {[selectedTeacher.firstName, selectedTeacher.lastName].filter(Boolean).join(' ') || selectedTeacher.username}
                        </strong>
                    </span>
                </div>
                {/* Render TeacherReports scoped to this teacher's ID */}
                <TeacherReports overrideTeacherId={selectedTeacher.id} />
            </div>
        );
    }

    // ── Teacher picker ────────────────────────────────────────────
    return (
        <div className="ar-root">
            <div className="ar-header">
                <h2>Reports</h2>
                <p>Select a teacher to view their class report.</p>
            </div>

            <div className="ar-search-bar">
                <BiSearch size={16} className="ar-search-icon" />
                <input
                    className="ar-search-input"
                    placeholder="Search teachers…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="ar-loading">
                    <div className="spinner" />
                    <p>Loading teachers…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="ar-empty">
                    <BiUser size={48} />
                    <h3>{search ? 'No teachers match your search' : 'No teachers found'}</h3>
                </div>
            ) : (
                <div className="ar-grid">
                    {filtered.map(t => (
                        <TeacherCard key={t.id} teacher={t} onClick={setSelectedTeacher} />
                    ))}
                </div>
            )}
        </div>
    );
}
