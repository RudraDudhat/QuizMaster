import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- `motion` is used as <motion.div> in JSX
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, LayoutDashboard, FileText, HelpCircle,
    Users, GraduationCap, BarChart3, Hourglass,
    ChevronLeft, ChevronRight, LogOut, User, Settings as SettingsIcon,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import NotificationBell from '../common/NotificationBell';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import Badge from '../common/Badge';

const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/quizzes', label: 'Quizzes', icon: FileText },
    { path: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
    { path: '/admin/grading', label: 'Grading', icon: Hourglass },
    { path: '/admin/groups', label: 'Groups', icon: Users },
    { path: '/admin/students', label: 'Students', icon: GraduationCap },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

function SidebarContent({ collapsed, user, location: loc, onNavigate }) {
    return (
        <>
            {!collapsed && (
                <div className="px-4 py-5 border-b-2 border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <Avatar name={user?.fullName} size="sm" />
                        <div className="min-w-0">
                            <p className="text-sm font-extrabold text-[var(--color-text-primary)] truncate">{user?.fullName}</p>
                            <Badge variant="info" size="sm">{user?.role}</Badge>
                        </div>
                    </div>
                </div>
            )}
            <nav className="flex-1 px-3 py-3 space-y-1" aria-label="Admin navigation">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = loc.pathname === item.path || loc.pathname.startsWith(item.path + '/');
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 ${isActive
                                    ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] border-2 border-[var(--color-border)] shadow-[3px_3px_0_var(--color-border)]'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-text-primary)]'
                                } ${collapsed ? 'justify-center' : ''}`}
                            title={collapsed ? item.label : undefined}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon size={20} className="flex-shrink-0" aria-hidden="true" />
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    );
                })}
            </nav>
        </>
    );
}

export default function AdminLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, clearAuth } = useAuthStore();


    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    // Lock body scroll when the mobile drawer is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.classList.add('modal-open');
            return () => document.body.classList.remove('modal-open');
        }
    }, [mobileOpen]);

    const closeMobile = () => setMobileOpen(false);

    const currentSection = navItems.find(
        (item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );

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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (window.innerWidth < 768) setMobileOpen(true);
                            else setCollapsed((c) => !c);
                        }}
                        className="p-2 rounded-full border-2 border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-[var(--color-primary)] rounded-xl border-2 border-[var(--color-border)] flex items-center justify-center shadow-[2px_2px_0_var(--color-border)]">
                            <span className="text-[var(--color-text-inverse)] text-sm font-extrabold">Q</span>
                        </div>
                        <span className="text-lg font-extrabold text-[var(--color-text-primary)] hidden sm:block">
                            QuizMaster <span className="text-[var(--color-primary)]">Pro</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <Dropdown
                        trigger={
                            <div className="flex items-center gap-2 p-1.5 rounded-full border-2 border-[var(--color-border)] hover:bg-[var(--color-primary-soft)] transition-colors">
                                <Avatar name={user?.fullName} size="sm" />
                            </div>
                        }
                        items={[
                            { label: 'My Profile', icon: <User size={16} />, onClick: () => navigate('/admin/profile') },
                            { divider: true },
                            { label: 'Logout', icon: <LogOut size={16} />, onClick: handleLogout, danger: true },
                        ]}
                    />
                </div>
            </header>

            {/* Desktop Sidebar */}
            <aside
                className={`fixed top-16 left-0 bottom-0 bg-[var(--color-bg-card)] border-r-2 border-[var(--color-border)] z-40 hidden md:flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-[68px]' : 'w-60'
                    }`}
            >
                <SidebarContent collapsed={collapsed} user={user} location={location} onNavigate={closeMobile} />
                <div className="px-3 pt-2 pb-3 border-t-2 border-[var(--color-border)] flex flex-col gap-2">
                    <NavLink
                        to="/admin/settings"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 ${isActive
                                ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] border-2 border-[var(--color-border)] shadow-[3px_3px_0_var(--color-border)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-text-primary)]'
                            } ${collapsed ? 'justify-center' : ''}`
                        }
                        title={collapsed ? 'Settings' : undefined}
                    >
                        <SettingsIcon size={20} className="flex-shrink-0" />
                        {!collapsed && <span>Settings</span>}
                    </NavLink>
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        className="w-full flex items-center justify-center p-2 rounded-full border-2 border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-[color:var(--color-overlay)] z-50 md:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -260 }}
                            animate={{ x: 0 }}
                            exit={{ x: -260 }}
                            transition={{ type: 'tween', duration: 0.25 }}
                            className="fixed top-0 left-0 bottom-0 w-60 bg-[var(--color-bg-card)] z-50 md:hidden flex flex-col shadow-[6px_6px_0_var(--color-border)] border-r-2 border-[var(--color-border)]"
                        >
                            <div className="h-16 flex items-center justify-between px-4 border-b-2 border-[var(--color-border)]">
                                <span className="text-lg font-extrabold text-[var(--color-text-primary)]">Menu</span>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="p-2 rounded-full border-2 border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-soft)]"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <SidebarContent collapsed={false} user={user} location={location} onNavigate={closeMobile} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main
                id="main-content"
                tabIndex={-1}
                className={`transition-all duration-300 ease-in-out pt-16 outline-none ${collapsed ? 'md:ml-[68px]' : 'md:ml-60'
                    }`}
            >
                {/* Breadcrumb */}
                {currentSection && (
                    <div className="bg-[var(--color-bg-card)] border-b-2 border-[var(--color-border)] px-6 py-3">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            <span className="text-[var(--color-text-muted)]">Admin</span>
                            <span className="mx-2 text-[color:var(--color-text-muted)]/70">/</span>
                            <span className="font-semibold text-[var(--color-text-primary)]">{currentSection.label}</span>
                        </p>
                    </div>
                )}
                <div className="max-w-7xl mx-auto p-6">
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
