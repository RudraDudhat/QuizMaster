import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Spinner from '../components/common/Spinner';
import AdminLayout from '../components/layout/AdminLayout';
import StudentLayout from '../components/layout/StudentLayout';
import { ROLES } from '../utils/constants';

// Pages — Public
import Landing from '../pages/Landing';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import NotFound from '../pages/NotFound';

// Pages — Admin
import AdminDashboard from '../pages/admin/Dashboard';
import QuizList from '../pages/admin/quizzes/QuizList';
import CreateQuiz from '../pages/admin/quizzes/CreateQuiz';
import EditQuiz from '../pages/admin/quizzes/EditQuiz';
import QuizQuestionManager from '../pages/admin/quizzes/QuizQuestionManager';
import QuestionBank from '../pages/admin/questions/QuestionBank';
import GroupManagement from '../pages/admin/groups/GroupManagement';
import StudentList from '../pages/admin/students/StudentList';
import StudentDetail from '../pages/admin/students/StudentDetail';
import Analytics from '../pages/admin/analytics/Analytics';

// Pages — Student
import StudentDashboard from '../pages/student/Dashboard';
import QuizBrowse from '../pages/student/quizzes/QuizBrowse';
import QuizDetail from '../pages/student/quizzes/QuizDetail';
import QuizTaking from '../pages/student/quiz-taking/QuizTaking';
import AttemptResult from '../pages/student/results/AttemptResult';
import AttemptReview from '../pages/student/results/AttemptReview';
import AttemptHistory from '../pages/student/results/AttemptHistory';

// ─── Route Guards ────────────────────────────────────────

function PublicRoute({ children }) {
    const { isAuthenticated, user } = useAuthStore();
    if (isAuthenticated) {
        const role = user?.role;
        if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (role === ROLES.STUDENT) {
            return <Navigate to="/student/dashboard" replace />;
        }
    }
    return children;
}

function AdminRoute() {
    const { isAuthenticated, user } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role === ROLES.STUDENT) return <Navigate to="/student/dashboard" replace />;
    return (
        <AdminLayout>
            <Outlet />
        </AdminLayout>
    );
}

function StudentRoute() {
    const { isAuthenticated, user } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
        return <Navigate to="/admin/dashboard" replace />;
    }
    return (
        <StudentLayout>
            <Outlet />
        </StudentLayout>
    );
}

// ─── AppRouter ───────────────────────────────────────────

export default function AppRouter() {
    const { isLoading, initFromStorage } = useAuthStore();

    useEffect(() => {
        initFromStorage();
    }, [initFromStorage]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
            }}>
                <Spinner />
            </div>
        );
    }

    return (
        <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

            {/* ── Admin ── */}
            <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/quizzes" element={<QuizList />} />
                <Route path="/admin/quizzes/create" element={<CreateQuiz />} />
                <Route path="/admin/quizzes/:quizUuid/edit" element={<EditQuiz />} />
                <Route path="/admin/quizzes/:quizUuid/questions" element={<QuizQuestionManager />} />
                <Route path="/admin/questions" element={<QuestionBank />} />
                <Route path="/admin/groups" element={<GroupManagement />} />
                <Route path="/admin/students" element={<StudentList />} />
                <Route path="/admin/students/:userUuid" element={<StudentDetail />} />
                <Route path="/admin/analytics" element={<Analytics />} />
            </Route>

            {/* ── Student ── */}
            <Route element={<StudentRoute />}>
                <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/quizzes" element={<QuizBrowse />} />
                <Route path="/student/quizzes/:quizUuid" element={<QuizDetail />} />
                <Route path="/student/quiz/:attemptUuid" element={<QuizTaking />} />
                <Route path="/student/results/:attemptUuid" element={<AttemptResult />} />
                <Route path="/student/results/:attemptUuid/review" element={<AttemptReview />} />
                <Route path="/student/history" element={<AttemptHistory />} />
            </Route>

            {/* ── Catch All ── */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
