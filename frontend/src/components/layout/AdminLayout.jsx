import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, LayoutDashboard, FileText, HelpCircle,
    Users, GraduationCap, BarChart3,
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
    { path: '/admin/groups', label: 'Groups', icon: Users },
    { path: '/admin/students', label: 'Students', icon: GraduationCap },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

function SidebarContent({ collapsed, user, location: loc }) {
    return (
        <>
            {!collapsed && (
                <div className="px-4 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <Avatar name={user?.fullName} size="sm" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
                            <Badge variant="info" size="sm">{user?.role}</Badge>
                        </div>
                    </div>
                </div>
            )}
            <nav className="flex-1 px-3 py-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = loc.pathname === item.path || loc.pathname.startsWith(item.path + '/');
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                    ? 'bg-primary-light text-primary'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                } ${collapsed ? 'justify-center' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon size={20} className="flex-shrink-0" />
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

    const currentSection = navItems.find(
        (item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navbar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (window.innerWidth < 768) setMobileOpen(true);
                            else setCollapsed((c) => !c);
                        }}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">Q</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900 hidden sm:block">
                            QuizMaster <span className="text-primary">Pro</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell />
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

            {/* Desktop Sidebar */}
            <aside
                className={`fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 z-40 hidden md:flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-[68px]' : 'w-60'
                    }`}
            >
                <SidebarContent collapsed={collapsed} user={user} location={location} />
                <div className="px-3 pt-2 pb-3 border-t border-gray-100 flex flex-col gap-2">
                    <NavLink
                        to="/admin/settings"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                ? 'bg-primary-light text-primary'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            } ${collapsed ? 'justify-center' : ''}`
                        }
                        title={collapsed ? 'Settings' : undefined}
                    >
                        <SettingsIcon size={20} className="flex-shrink-0" />
                        {!collapsed && <span>Settings</span>}
                    </NavLink>
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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
                            className="fixed inset-0 bg-black/40 z-50 md:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -260 }}
                            animate={{ x: 0 }}
                            exit={{ x: -260 }}
                            transition={{ type: 'tween', duration: 0.25 }}
                            className="fixed top-0 left-0 bottom-0 w-60 bg-white z-50 md:hidden flex flex-col shadow-xl"
                        >
                            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                                <span className="text-lg font-bold text-gray-900">Menu</span>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <SidebarContent collapsed={false} user={user} location={location} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main
                className={`transition-all duration-300 ease-in-out pt-16 ${collapsed ? 'md:ml-[68px]' : 'md:ml-60'
                    }`}
            >
                {/* Breadcrumb */}
                {currentSection && (
                    <div className="bg-white border-b border-gray-200 px-6 py-3">
                        <p className="text-sm text-gray-500">
                            <span className="text-gray-400">Admin</span>
                            <span className="mx-2 text-gray-300">/</span>
                            <span className="font-medium text-gray-700">{currentSection.label}</span>
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
