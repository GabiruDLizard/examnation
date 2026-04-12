import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BiSolidBell } from 'react-icons/bi';
import { getUserIdFromToken } from '../../utils/tokenUtils';
import { authFetch } from '../../utils/api';
import './NotificationBell.css';

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_ICON = {
    assignment_created:   '📋',
    assignment_submitted: '✅',
    assignment_graded:    '🎯',
    quiz_assigned:        '📝',
    default:              '🔔',
};

export default function NotificationBell() {
    const userId = getUserIdFromToken();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const fetchCount = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await authFetch(`/notifications/${userId}/count`);
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count ?? 0);
            }
        } catch { /* ignore */ }
    }, [userId]);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await authFetch(`/notifications/${userId}`);
            if (res.ok) setNotifications(await res.json());
        } catch { /* ignore */ }
    }, [userId]);

    // Poll unread count every 60s
    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    // Load full list when dropdown opens
    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markRead = async (id) => {
        try {
            await authFetch(`/notifications/${id}/read`, { method: 'POST' });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* ignore */ }
    };

    const markAllRead = async () => {
        try {
            await authFetch(`/notifications/read-all/${userId}`, { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
    };

    return (
        <div className="nb-wrap" ref={dropdownRef}>
            <button className="nb-btn" onClick={() => setOpen(o => !o)}>
                <BiSolidBell size={20} />
                {unreadCount > 0 && (
                    <span className="nb-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className="nb-dropdown">
                    <div className="nb-header">
                        <span className="nb-title">Notifications</span>
                        {unreadCount > 0 && (
                            <button className="nb-mark-all" onClick={markAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="nb-empty">You're all caught up</div>
                    ) : (
                        <div className="nb-list">
                            {notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`nb-item ${n.isRead ? 'read' : 'unread'}`}
                                    onClick={() => !n.isRead && markRead(n.id)}
                                >
                                    <span className="nb-icon">
                                        {TYPE_ICON[n.type] ?? TYPE_ICON.default}
                                    </span>
                                    <div className="nb-content">
                                        <div className="nb-message">{n.message}</div>
                                        <div className="nb-time">{timeAgo(n.createdAt)}</div>
                                    </div>
                                    {!n.isRead && <span className="nb-dot" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
