import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    Users, BookOpen, PlayCircle, ClipboardList, TrendingUp,
    Plus, BarChart3, AlertCircle, ArrowRight,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useAuthStore from '../../store/authStore';
import { getAdminDashboard } from '../../api/analytics.api';
import {
    formatDate, formatDateTime, formatDuration,
    formatScore, formatPercentage, getStatusColor, truncateText,
} from '../../utils/formatters';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';

/* ─── skeleton block ─── */
function Skeleton({ className = '' }) {
    return <div className={`skeleton rounded-lg ${className}`} />;
}

/* ─── stat card ─── */
const iconBgs = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
};

function StatCard({ icon: Icon, label, value, trend, color = 'indigo' }) {
    return (
        <Card padding="md" className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgs[color]}`}>
                <Icon size={22} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{value?.toLocaleString?.() ?? value}</p>
                <p className="text-[11px] text-gray-400">{trend}</p>
            </div>
        </Card>
    );
}

/* ─── progress bar colors ─── */
function barColor(v) {
    if (v >= 70) return 'bg-emerald-500';
    if (v >= 50) return 'bg-amber-500';
    return 'bg-red-500';
}
function barTextColor(v) {
    if (v >= 70) return 'text-emerald-600';
    if (v >= 50) return 'text-amber-600';
    return 'text-red-600';
}

const COLORS = ['#10B981', '#EF4444'];

/* ─── page ─── */
export default function AdminDashboard() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    const { data: response, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: getAdminDashboard,
        staleTime: 60_000,
        onError: () => toast.error('Failed to load dashboard data'),
    });

    /* ─── error state ─── */
    if (isError) {
        return (
            <Card padding="lg" className="text-center py-20">
                <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load dashboard</h2>
                <p className="text-sm text-gray-500 mb-6">There was a problem fetching your dashboard data.</p>
                <Button onClick={() => refetch()}>Try Again</Button>
            </Card>
        );
    }

    if (!response?.data) return null;

    /* ─── top quizzes table cols ─── */
    const topQuizCols = [
        {
            key: 'title', label: 'Quiz Title', render: (r) => (
                <button onClick={() => navigate(`/admin/quizzes/${r.quizUuid}/edit`)} className="text-left text-primary hover:underline font-medium">
                    {truncateText(r.title, 30)}
                </button>
            )
        },
        { key: 'attemptCount', label: 'Attempts', align: 'center', render: (r) => <span className="font-semibold">{r.attemptCount}</span> },
        { key: 'avgScore', label: 'Avg Score', align: 'center', render: (r) => formatPercentage(r.avgScore) },
        { key: 'passRate', label: 'Pass Rate', align: 'center', render: (r) => formatPercentage(r.passRate) },
        { key: 'status', label: 'Status', align: 'center', render: (r) => <Badge variant={getStatusColor(r.status)}>{r.status}</Badge> },
    ];

    /* ─── recent attempts table cols ─── */
    const recentCols = [
        { key: 'quizTitle', label: 'Quiz', render: (r) => truncateText(r.quizTitle, 35) },
        { key: 'attemptNumber', label: 'Attempt #', align: 'center', render: (r) => `#${r.attemptNumber}` },
        { key: 'score', label: 'Score', align: 'center', render: (r) => formatScore(r.marksObtained, r.totalMarksPossible) },
        { key: 'percentage', label: '%', align: 'center', render: (r) => formatPercentage(r.percentage) },
        { key: 'status', label: 'Status', align: 'center', render: (r) => <Badge variant={getStatusColor(r.status)}>{r.status}</Badge> },
        { key: 'result', label: 'Result', align: 'center', render: (r) => <Badge variant={r.isPassed ? 'success' : 'danger'}>{r.isPassed ? 'Passed' : 'Failed'}</Badge> },
        { key: 'time', label: 'Time', align: 'center', render: (r) => formatDuration(r.timeTakenSeconds) },
        { key: 'submittedAt', label: 'Submitted', render: (r) => <span className="text-xs whitespace-nowrap">{formatDateTime(r.submittedAt)}</span> },
    ];

    /* ─── donut data ─── */
    const donutData = response.data
        ? [
            { name: 'Passed', value: response.data.platformPassRate },
            { name: 'Failed', value: +(100 - response.data.platformPassRate).toFixed(1) },
        ]
        : [];

    /* ─── overview rows ─── */
    const overviewRows = response.data
        ? [
            { icon: '🎯', label: 'Pass Rate', value: formatPercentage(response.data.platformPassRate) },
            { icon: '📋', label: 'Active Quizzes', value: `${response.data.activeQuizzes} / ${response.data.totalQuizzes}` },
            { icon: '👨‍🎓', label: 'Total Students', value: response.data.totalStudents?.toLocaleString() },
            { icon: '📅', label: 'Attempts Today', value: response.data.attemptsToday?.toLocaleString() },
        ]
        : [];

    return (
        <div className="space-y-6">
            {/* ─── SECTION 1: Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Welcome back, <span className="font-medium text-gray-700">{user?.fullName}</span>! Here's what's happening.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{formatDate(new Date())}</p>
                    <p className="text-xs text-gray-400">Last updated: just now</p>
                </div>
            </div>

            {/* ─── SECTION 2: Quick Actions ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Button size="sm" icon={<Plus size={16} />} onClick={() => navigate('/admin/quizzes/create')}>Create Quiz</Button>
                <Button size="sm" variant="outline" icon={<Plus size={16} />} onClick={() => navigate('/admin/questions')}>Add Question</Button>
                <Button size="sm" variant="outline" icon={<BarChart3 size={16} />} onClick={() => navigate('/admin/analytics')}>View Analytics</Button>
                <Button size="sm" variant="outline" icon={<Users size={16} />} onClick={() => navigate('/admin/students')}>Manage Students</Button>
            </div>

            {/* ─── SECTION 3: Stats Cards ─── */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} padding="md"><div className="flex gap-4 items-start"><Skeleton className="w-11 h-11" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-16" /><Skeleton className="h-2 w-28" /></div></div></Card>
                    ))}
                </div>
            ) : response.data && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    <StatCard icon={Users} label="Total Students" value={response.data.totalStudents} trend="Active learners on the platform" color="indigo" />
                    <StatCard icon={BookOpen} label="Total Quizzes" value={response.data.totalQuizzes} trend="All quizzes ever created" color="emerald" />
                    <StatCard icon={PlayCircle} label="Active Quizzes" value={response.data.activeQuizzes} trend="Currently published" color="amber" />
                    <StatCard icon={ClipboardList} label="Total Attempts" value={response.data.totalAttempts} trend="Across all quizzes" color="blue" />
                    <StatCard icon={TrendingUp} label="Attempts Today" value={response.data.attemptsToday} trend="Submissions today" color="rose" />
                </div>
            )}

            {/* ─── SECTION 4: Pass Rate Banner ─── */}
            {isLoading ? (
                <Card padding="md"><div className="flex flex-col sm:flex-row gap-6 items-center"><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-52" /></div><Skeleton className="h-4 w-full sm:w-60" /></div></Card>
            ) : response.data && (
                <Card padding="md">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 mb-1">Platform Pass Rate</p>
                            <p className={`text-3xl font-bold ${barTextColor(response.data.platformPassRate)}`}>
                                {response.data.platformPassRate}%
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Percentage of submitted attempts that passed</p>
                        </div>
                        <div className="w-full sm:w-64 flex-shrink-0">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-gray-500">Progress</span>
                                <span className={`text-xs font-semibold ${barTextColor(response.data.platformPassRate)}`}>
                                    {response.data.platformPassRate}%
                                </span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${barColor(response.data.platformPassRate)}`}
                                    style={{ width: `${Math.min(response.data.platformPassRate, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* ─── SECTION 5: Two Column ─── */}
            <div className="grid lg:grid-cols-[3fr_2fr] gap-6">
                {/* Top Quizzes */}
                <Card padding="sm">
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Top Quizzes</h2>
                            <p className="text-xs text-gray-400">By attempt count</p>
                        </div>
                    </div>
                    <Table
                        columns={topQuizCols}
                        data={response.data?.topQuizzes || []}
                        loading={isLoading}
                        emptyMessage="No quizzes yet"
                        emptyIcon={<BookOpen size={40} className="text-gray-300" />}
                    />
                </Card>

                {/* Platform Overview */}
                <Card padding="md">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Platform Overview</h2>

                    {isLoading ? (
                        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                    ) : response.data && (
                        <>
                            <div className="divide-y divide-gray-100">
                                {overviewRows.map((r) => (
                                    <div key={r.label} className="flex items-center justify-between py-3">
                                        <span className="flex items-center gap-2.5 text-sm text-gray-600">
                                            <span className="text-base">{r.icon}</span> {r.label}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">{r.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 relative">
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {donutData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(v) => `${v}%`}
                                            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={28}
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(v) => <span className="text-xs text-gray-600 ml-1">{v}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* center label */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: 28 }}>
                                    <span className="text-xl font-bold text-gray-900">{response.data.platformPassRate}%</span>
                                </div>
                            </div>
                        </>
                    )}
                </Card>
            </div>

            {/* ─── SECTION 6: Recent Attempts ─── */}
            <Card padding="sm">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Recent Attempts</h2>
                        <p className="text-xs text-gray-400">Latest 10 quiz submissions</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/analytics')}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                        View All <ArrowRight size={12} />
                    </button>
                </div>
                <Table
                    columns={recentCols}
                    data={response.data?.recentAttempts || []}
                    loading={isLoading}
                    emptyMessage="No attempts yet"
                    emptyIcon={<ClipboardList size={40} className="text-gray-300" />}
                />
            </Card>
        </div>
    );
}
