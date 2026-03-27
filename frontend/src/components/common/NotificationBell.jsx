import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, BookOpen, Clock, CheckCircle, MessageSquare,
    Megaphone, RotateCcw, Timer, RefreshCw, X, Loader2,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotifications from '../../hooks/useNotifications';
import { truncateText, formatTimeAgo } from '../../utils/formatters';

/* ── Notification type → icon + colour mapping ── */
const NOTIFICATION_ICON_MAP = {
    QUIZ_ASSIGNED:        { icon: BookOpen,       color: 'var(--color-primary)' },
    QUIZ_EXPIRING:        { icon: Clock,          color: 'var(--color-warning)' },
    QUIZ_RESULT_READY:    { icon: CheckCircle,    color: 'var(--color-success)' },
    ADMIN_MESSAGE:        { icon: MessageSquare,   color: 'var(--color-info)' },
    ANNOUNCEMENT:         { icon: Megaphone,       color: 'var(--color-primary)' },
    ATTEMPT_RESET:        { icon: RotateCcw,       color: 'var(--color-warning)' },
    QUIZ_AUTO_SUBMITTED:  { icon: Timer,           color: 'var(--color-danger)' },
};

function getNotificationIcon(type) {
    return NOTIFICATION_ICON_MAP[type] ?? { icon: Bell, color: 'var(--color-text-secondary)' };
}

/* ── Shimmer row for loading state ── */
function ShimmerRow() {
    return (
        <div style={styles.notifRow}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="skeleton" style={{ width: '60%', height: 14 }} />
                <div className="skeleton" style={{ width: '85%', height: 12 }} />
                <div className="skeleton" style={{ width: '30%', height: 10 }} />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════ */
/*  NotificationBell                               */
/* ═══════════════════════════════════════════════ */
export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    const {
        unreadCount,
        notifications,
        totalElements,
        hasMore,
        listLoading,
        markOneRead,
        markAllRead,
        markingAll,
        refresh,
    } = useNotifications();

    /* ── Responsive breakpoint ── */
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        const onChange = (e) => setIsMobile(e.matches);
        setIsMobile(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    /* ── Outside-click handler ── */
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const toggleOpen = () => {
        setOpen((prev) => {
            if (!prev) refresh();
            return !prev;
        });
    };

    const handleRowClick = (notif) => {
        if (!notif.isRead) markOneRead(notif.uuid);
        if (notif.actionUrl) {
            navigate(notif.actionUrl);
            setOpen(false);
        }
    };

    const viewAllPath = user?.role === 'ADMIN'
        ? '/admin/notifications'
        : '/student/notifications';

    const hasUnread = notifications.some((n) => !n.isRead);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* ── Bell Button ── */}
            <button
                onClick={toggleOpen}
                style={{
                    ...styles.bellBtn,
                    background: open ? 'var(--color-primary-light)' : 'transparent',
                }}
                aria-label="Notifications"
                id="notification-bell-btn"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span key={unreadCount} style={styles.badge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* ── Dropdown Panel ── */}
            {open && (
                <div
                    style={{
                        ...(isMobile ? styles.panelMobile : styles.panelDesktop),
                    }}
                    id="notification-dropdown"
                >
                    {/* Header */}
                    <div style={styles.header}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={styles.headerTitle}>Notifications</span>
                            {unreadCount > 0 && (
                                <span style={styles.unreadPill}>{unreadCount} unread</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {hasUnread && (
                                <button
                                    onClick={() => markAllRead()}
                                    disabled={markingAll}
                                    style={styles.ghostBtn}
                                >
                                    {markingAll
                                        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                        : 'Mark all read'}
                                </button>
                            )}
                            <button onClick={refresh} style={styles.iconBtn} aria-label="Refresh">
                                <RefreshCw size={16} />
                            </button>
                            {isMobile && (
                                <button onClick={() => setOpen(false)} style={styles.iconBtn} aria-label="Close">
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={styles.divider} />

                    {/* Notifications List */}
                    <div style={styles.listContainer}>
                        {listLoading ? (
                            <>
                                <ShimmerRow /><ShimmerRow /><ShimmerRow /><ShimmerRow /><ShimmerRow />
                            </>
                        ) : notifications.length === 0 ? (
                            /* Empty state */
                            <div style={styles.emptyState}>
                                <Bell size={48} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
                                <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 12, fontSize: 15 }}>
                                    You're all caught up!
                                </p>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, opacity: 0.7 }}>
                                    No notifications yet.
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const { icon: Icon, color } = getNotificationIcon(notif.type);
                                return (
                                    <div
                                        key={notif.uuid}
                                        onClick={() => handleRowClick(notif)}
                                        style={{
                                            ...styles.notifRow,
                                            background: notif.isRead ? 'transparent' : 'var(--color-primary-light)',
                                            cursor: notif.actionUrl ? 'pointer' : 'default',
                                        }}
                                        className="notif-row"
                                    >
                                        {/* Icon */}
                                        <div
                                            style={{
                                                ...styles.iconBox,
                                                background: notif.isRead
                                                    ? 'var(--color-border)'
                                                    : `${color}18`,
                                            }}
                                        >
                                            <Icon
                                                size={18}
                                                style={{
                                                    color: notif.isRead ? 'var(--color-text-secondary)' : color,
                                                }}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize: 13,
                                                fontWeight: notif.isRead ? 400 : 600,
                                                color: 'var(--color-text-primary)',
                                                lineHeight: 1.4,
                                                marginBottom: 2,
                                            }}>
                                                {truncateText(notif.title, 45)}
                                            </p>
                                            <p style={{
                                                fontSize: 12,
                                                color: 'var(--color-text-secondary)',
                                                lineHeight: 1.4,
                                                marginBottom: 4,
                                            }}>
                                                {truncateText(notif.message, 80)}
                                            </p>
                                            <p style={{
                                                fontSize: 11,
                                                color: 'var(--color-text-secondary)',
                                                opacity: 0.65,
                                            }}>
                                                {formatTimeAgo(notif.createdAt)}
                                            </p>
                                        </div>

                                        {/* Unread dot */}
                                        {!notif.isRead && (
                                            <div style={styles.unreadDot} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {!listLoading && notifications.length > 0 && (
                        <>
                            <div style={styles.divider} />
                            <div style={styles.footer}>
                                {hasMore ? (
                                    <button
                                        onClick={() => { navigate(viewAllPath); setOpen(false); }}
                                        style={styles.viewAllBtn}
                                    >
                                        View all {totalElements} notifications
                                    </button>
                                ) : (
                                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                                        You've seen all notifications
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Inline styles for animations */}
            <style>{`
                @keyframes badgePop {
                    0%   { transform: scale(1); }
                    50%  { transform: scale(1.3); }
                    100% { transform: scale(1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes panelSlideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes panelSlideDownMobile {
                    from { opacity: 0; transform: translateY(-100%); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .notif-row:hover {
                    background: var(--color-bg-page) !important;
                }
                #notification-dropdown::-webkit-scrollbar {
                    width: 4px;
                }
            `}</style>
        </div>
    );
}

/* ═══════════════════════════════════ */
/*  Inline style objects               */
/* ═══════════════════════════════════ */
const styles = {
    bellBtn: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'background var(--transition-fast), color var(--transition-fast)',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 18,
        height: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-danger)',
        color: 'var(--color-text-inverse)',
        fontSize: 10,
        fontWeight: 700,
        padding: '0 5px',
        lineHeight: 1,
        animation: 'badgePop 300ms ease',
    },

    /* ── Desktop panel ── */
    panelDesktop: {
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 380,
        maxHeight: 520,
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px -12px rgba(0,0,0,0.18), 0 0 0 1px var(--color-border)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'panelSlideDown 200ms ease',
    },

    /* ── Mobile panel ── */
    panelMobile: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100vw',
        maxHeight: '70vh',
        background: 'var(--color-bg-card)',
        borderRadius: '0 0 16px 16px',
        boxShadow: '0 20px 60px -12px rgba(0,0,0,0.25)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'panelSlideDownMobile 250ms ease',
    },

    /* ── Header ── */
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
    },
    headerTitle: {
        fontWeight: 700,
        fontSize: 15,
        color: 'var(--color-text-primary)',
    },
    unreadPill: {
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--color-primary)',
        background: 'var(--color-primary-light)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
    },

    /* ── Buttons ── */
    ghostBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--color-primary)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        padding: '4px 10px',
        borderRadius: 'var(--radius-sm)',
        transition: 'background var(--transition-fast)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        padding: 6,
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background var(--transition-fast), color var(--transition-fast)',
    },

    /* ── Divider ── */
    divider: {
        height: 1,
        background: 'var(--color-border)',
        flexShrink: 0,
    },

    /* ── List ── */
    listContainer: {
        flex: 1,
        overflowY: 'auto',
        maxHeight: 380,
    },

    /* ── Notification Row ── */
    notifRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        transition: 'background var(--transition-fast)',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-primary)',
        flexShrink: 0,
        marginTop: 6,
    },

    /* ── Empty state ── */
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
    },

    /* ── Footer ── */
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 16px',
    },
    viewAllBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--color-primary)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: 'var(--radius-sm)',
        transition: 'color var(--transition-fast)',
    },
};
