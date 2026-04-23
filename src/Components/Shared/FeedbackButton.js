import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BiMessageSquareDetail, BiX, BiBug, BiCommentDetail } from 'react-icons/bi';
import { getRoleFromToken, getUserIdFromToken } from '../../utils/tokenUtils';
import { authFetch } from '../../utils/api';
import { toast } from 'react-toastify';
import './FeedbackButton.css';

const TYPES = [
    { id: 'bug',      label: 'Report a Bug',  icon: <BiBug />,                 placeholder: 'Describe the bug you encountered...' },
    { id: 'feedback', label: 'Request a Feature',  icon: <BiCommentDetail />,       placeholder: 'Describe the feature you would like...' },
    { id: 'other',    label: 'Other',          icon: <BiMessageSquareDetail />, placeholder: 'Describe your issue...' },
];

export default function FeedbackButton() {
    useLocation(); // re-renders on every navigation so role is always fresh
    const role = getRoleFromToken();
    const [isOpen, setIsOpen]           = useState(false);
    const [type, setType]               = useState('feedback');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting]   = useState(false);

    const r = role?.toLowerCase();
    if (r !== 'teacher' && r !== 'educator' && r !== 'admin' && r !== 'superadmin') return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) { toast.warn('Please enter a description.'); return; }
        setSubmitting(true);
        try {
            const res = await authFetch('/feedback', {
                method: 'POST',
                body: JSON.stringify({ type, description: description.trim(), userId: getUserIdFromToken(), role }),
            });
            if (!res.ok) throw new Error();
            toast.success('Feedback submitted — thank you!');
            setIsOpen(false);
            setDescription('');
            setType('feedback');
        } catch {
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const active = TYPES.find(t => t.id === type);

    return (
        <>
            <button className="feedback-fab" onClick={() => setIsOpen(true)} title="Send feedback">
                <BiMessageSquareDetail />
            </button>

            {isOpen && (
                <div className="feedback-overlay" onClick={() => setIsOpen(false)}>
                    <div className="feedback-modal" onClick={e => e.stopPropagation()}>
                        <div className="feedback-modal-header">
                            <h3>Send Feedback</h3>
                            <button className="feedback-close" onClick={() => setIsOpen(false)}><BiX /></button>
                        </div>

                        <div className="feedback-tabs">
                            {TYPES.map(t => (
                                <button key={t.id} className={`feedback-tab ${type === t.id ? 'active' : ''}`}
                                    onClick={() => setType(t.id)} type="button">
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit}>
                            <textarea className="feedback-textarea" placeholder={active.placeholder}
                                value={description} onChange={e => setDescription(e.target.value)}
                                rows={5} maxLength={2000} />
                            <div className="feedback-char-count">{description.length}/2000</div>
                            <div className="feedback-actions">
                                <button type="button" className="feedback-cancel" onClick={() => setIsOpen(false)}>Cancel</button>
                                <button type="submit" className="feedback-submit" disabled={submitting}>
                                    {submitting ? 'Sending…' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

