import { useNavigate, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- `motion` is used as <motion.div> in JSX
import { motion } from 'framer-motion';
import { Flame, Zap, LogOut, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import NotificationBell from '../common/NotificationBell';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';

export default function StudentLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, clearAuth } = useAuthStore();


    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-page)]">
            {/* Skip-link for keyboard users */}
            <a
                href="#main-content"
                className="sr-only-not-focusable focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] focus:px-4 focus:py-2 focus:bg-[var(--color-primary)] focus:text-[var(--color-text-inverse)] focus:rounded-full focus:font-semibold focus:shadow-[3px_3px_0_var(--color-border)] focus:border-2 focus:border-[var(--color-border)]"
            >
                Skip to main content
            </a>
            {/* Top Navbar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-bg-card)] border-b-2 border-[var(--color-border)] z-50 flex items-center justify-between px-4 lg:px-6">
                <button
                    type="button"
                    onClick={() => navigate('/student/dashboard')}
                    aria-label="QuizMaster Pro — go to dashboard"
                    className="flex items-center gap-2 rounded-full p-1 -m-1 hover:opacity-90 transition-opacity"
                >
                    <div className="w-9 h-9 bg-[var(--color-primary)] rounded-xl border-2 border-[var(--color-border)] flex items-center justify-center shadow-[2px_2px_0_var(--color-border)]">
                        <span className="text-[var(--color-text-inverse)] text-sm font-extrabold">Q</span>
                    </div>
                    <span className="text-lg font-extrabold text-[var(--color-text-primary)] hidden sm:block">
                        QuizMaster <span className="text-[var(--color-primary)]">Pro</span>
                    </span>
                </button>

                <div className="flex items-center gap-3">
                    {/* XP Badge */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-warning-soft)] text-[var(--color-warning)] rounded-full text-sm font-semibold border-2 border-[var(--color-border)] shadow-[2px_2px_0_var(--color-border)]">
                        <Flame size={16} className="text-[var(--color-warning)]" />
                        <span>{user?.xpPoints ?? 0} XP</span>
                    </div>

                    {/* Streak Badge */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-card)] text-[var(--color-text-primary)] rounded-full text-sm font-semibold border-2 border-[var(--color-border)] shadow-[2px_2px_0_var(--color-border)]">
                        <Zap size={16} className="text-[var(--color-primary)]" />
                        <span>{user?.streakDays ?? 0} day{(user?.streakDays ?? 0) !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Notification Bell */}
                    <NotificationBell />

                    {/* User Dropdown */}
                    <Dropdown
                        trigger={
                            <div className="flex items-center gap-2 p-1.5 rounded-full border-2 border-[var(--color-border)] hover:bg-[var(--color-primary-soft)] transition-colors">
                                <Avatar name={user?.fullName} size="sm" />
                            </div>
                        }
                        items={[
                            { label: 'My Profile', icon: <User size={16} />, onClick: () => { } },
                            { divider: true },
                            { label: 'Logout', icon: <LogOut size={16} />, onClick: handleLogout, danger: true },
                        ]}
                    />
                </div>
            </header>

            {/* Main Content */}
            <main id="main-content" tabIndex={-1} className="pt-16 outline-none">
                <div className="max-w-5xl mx-auto p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
                            Hello, {user?.fullName?.split(' ')[0] || 'Student'}! 👋
                        </h1>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        key={location.pathname}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
