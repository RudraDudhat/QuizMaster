import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Spinner from '../components/common/Spinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import AdminLayout from '../components/layout/AdminLayout';
import StudentLayout from '../components/layout/StudentLayout';
import { ROLES } from '../utils/constants';

// Pages — Public
const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Pages — Admin
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const QuizList = lazy(() => import('../pages/admin/quizzes/QuizList'));
const CreateQuiz = lazy(() => import('../pages/admin/quizzes/CreateQuiz'));
const EditQuiz = lazy(() => import('../pages/admin/quizzes/EditQuiz'));
const QuizQuestionManager = lazy(() => import('../pages/admin/quizzes/QuizQuestionManager'));
const QuestionBank = lazy(() => import('../pages/admin/questions/QuestionBank'));
const GroupManagement = lazy(() => import('../pages/admin/groups/GroupManagement'));
const StudentList = lazy(() => import('../pages/admin/students/StudentList'));
const StudentDetail = lazy(() => import('../pages/admin/students/StudentDetail'));
const Analytics = lazy(() => import('../pages/admin/analytics/Analytics'));
const Settings = lazy(() => import('../pages/admin/settings/Settings'));

// Pages — Student
const StudentDashboard = lazy(() => import('../pages/student/Dashboard'));
const QuizBrowse = lazy(() => import('../pages/student/quizzes/QuizBrowse'));
const QuizDetail = lazy(() => import('../pages/student/quizzes/QuizDetail'));
const QuizTaking = lazy(() => import('../pages/student/quiz-taking/QuizTaking'));
const AttemptResult = lazy(() => import('../pages/student/results/AttemptResult'));
const AttemptReview = lazy(() => import('../pages/student/results/AttemptReview'));
const AttemptHistory = lazy(() => import('../pages/student/results/AttemptHistory'));

// ─── Loading Fallback ────────────────────────────────────

function FullscreenSpinner() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Spinner />
        </div>
    );
}

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
            <ErrorBoundary>
                <Outlet />
            </ErrorBoundary>
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
            <ErrorBoundary>
                <Outlet />
            </ErrorBoundary>
        </StudentLayout>
    );
}

// Auth-only guard — no layout wrapper (full-screen quiz taking)
function QuizRoute() {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return (
        <ErrorBoundary>
            <Outlet />
        </ErrorBoundary>
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
        <ErrorBoundary>
            <Suspense fallback={<FullscreenSpinner />}>
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
                        <Route path="/admin/settings" element={<Settings />} />
                    </Route>

                    {/* ── Student ── */}
                    <Route element={<StudentRoute />}>
                        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
                        <Route path="/student/dashboard" element={<StudentDashboard />} />
                        <Route path="/student/quizzes" element={<QuizBrowse />} />
                        <Route path="/student/quizzes/:quizUuid" element={<QuizDetail />} />
                        <Route path="/student/results/:attemptUuid" element={<AttemptResult />} />
                        <Route path="/student/results/:attemptUuid/review" element={<AttemptReview />} />
                        <Route path="/student/history" element={<AttemptHistory />} />
                    </Route>

                    {/* ── Quiz Taking — full screen, no StudentLayout ── */}
                    <Route element={<QuizRoute />}>
                        <Route path="/student/quiz/:attemptUuid" element={<QuizTaking />} />
                    </Route>

                    {/* ── Catch All ── */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}
