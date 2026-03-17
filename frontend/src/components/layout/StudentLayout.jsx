import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Flame, Zap, LogOut, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotifications from '../../hooks/useNotifications';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';

export default function StudentLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, clearAuth } = useAuthStore();
    const { unreadCount } = useNotifications();

    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navbar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/student/dashboard')}>
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">Q</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 hidden sm:block">
                        QuizMaster <span className="text-primary">Pro</span>
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* XP Badge */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-semibold border border-amber-200">
                        <Flame size={16} className="text-amber-500" />
                        <span>{user?.xpPoints ?? 0} XP</span>
                    </div>

                    {/* Streak Badge */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-sm font-semibold border border-violet-200">
                        <Zap size={16} className="text-violet-500" />
                        <span>{user?.streakDays ?? 0} day{(user?.streakDays ?? 0) !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Notification Bell */}
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* User Dropdown */}
                    <Dropdown
                        trigger={
                            <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
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
            <main className="pt-16">
                <div className="max-w-5xl mx-auto p-6">
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
