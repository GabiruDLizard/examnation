import React, { useState, useEffect } from 'react';
import { BiSearch, BiChevronDown, BiChevronRight, BiPlus, BiX } from 'react-icons/bi';
import { getAssignmentsByTeacher, getAssignmentQuestionsById, getTeacherInfo } from './TeacherDashboardService';
import MathText from '../../Shared/MathText';
import './QuestionLibrary.css';

export default function QuestionLibrary({ onSelect, onClose, excludeAssignmentId }) {
    const [assignments, setAssignments]     = useState([]);
    const [search, setSearch]               = useState('');
    const [expanded, setExpanded]           = useState({});   // assignmentId → bool
    const [questions, setQuestions]         = useState({});   // assignmentId → []
    const [loadingQ, setLoadingQ]           = useState({});   // assignmentId → bool
    const [loading, setLoading]             = useState(true);

    useEffect(() => {
        (async () => {
            const teacher = await getTeacherInfo();
            if (!teacher?.id) return;
            const list = await getAssignmentsByTeacher(teacher.id);
            // Exclude the current assignment being edited
            setAssignments(list.filter(a => a.id !== excludeAssignmentId));
            setLoading(false);
        })();
    }, [excludeAssignmentId]);

    const toggleAssignment = async (assignmentId) => {
        const isOpen = expanded[assignmentId];
        setExpanded(prev => ({ ...prev, [assignmentId]: !isOpen }));

        // Fetch questions the first time this assignment is expanded
        if (!isOpen && !questions[assignmentId]) {
            setLoadingQ(prev => ({ ...prev, [assignmentId]: true }));
            const qs = await getAssignmentQuestionsById(assignmentId);
            setQuestions(prev => ({ ...prev, [assignmentId]: qs }));
            setLoadingQ(prev => ({ ...prev, [assignmentId]: false }));
        }
    };

    const filtered = assignments.filter(a =>
        a.title?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="ql-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="ql-modal">
                {/* Header */}
                <div className="ql-header">
                    <h3 className="ql-title">Question Library</h3>
                    <button className="ql-close" onClick={onClose}><BiX /></button>
                </div>

                {/* Search */}
                <div className="ql-search-wrap">
                    <BiSearch className="ql-search-icon" />
                    <input
                        className="ql-search"
                        placeholder="Search assignments…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Assignment list */}
                <div className="ql-list">
                    {loading && <p className="ql-empty">Loading…</p>}
                    {!loading && filtered.length === 0 && (
                        <p className="ql-empty">No assignments found.</p>
                    )}

                    {filtered.map(assignment => (
                        <div key={assignment.id} className="ql-assignment">
                            {/* Assignment row */}
                            <button
                                className="ql-assignment-row"
                                onClick={() => toggleAssignment(assignment.id)}
                            >
                                <span className="ql-chevron">
                                    {expanded[assignment.id] ? <BiChevronDown /> : <BiChevronRight />}
                                </span>
                                <span className="ql-assignment-title">{assignment.title}</span>
                                <span className="ql-assignment-meta">
                                    {assignment.subject && <span>{assignment.subject}</span>}
                                    {assignment.dueDate && (
                                        <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                    )}
                                </span>
                            </button>

                            {/* Questions for this assignment */}
                            {expanded[assignment.id] && (
                                <div className="ql-questions">
                                    {loadingQ[assignment.id] && (
                                        <p className="ql-empty">Loading questions…</p>
                                    )}
                                    {!loadingQ[assignment.id] && questions[assignment.id]?.length === 0 && (
                                        <p className="ql-empty">No questions in this assignment.</p>
                                    )}
                                    {questions[assignment.id]?.map(q => (
                                        <div key={q.id} className="ql-question-row">
                                            <div className="ql-question-info">
                                                <span className="ql-question-text">
                                                    <MathText>{q.questionText || q.text || '(no text)'}</MathText>
                                                </span>
                                                <div className="ql-question-tags">
                                                    {q.topic && <span className="ql-tag">{q.topic}</span>}
                                                    {q.difficultyLevel && (
                                                        <span className="ql-tag ql-tag-diff">
                                                            {q.difficultyLevel}
                                                        </span>
                                                    )}
                                                    {q.points && (
                                                        <span className="ql-tag">{q.points} pts</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                className="ql-add-btn"
                                                title="Add to current assignment"
                                                onClick={() => onSelect(q)}
                                            >
                                                <BiPlus /> Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
