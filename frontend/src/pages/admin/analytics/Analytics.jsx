import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Users, BookOpen, PlayCircle, ClipboardList, TrendingUp,
    TrendingDown, RefreshCw, Search, HelpCircle, BarChart2,
    ChevronRight,
} from 'lucide-react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar,
    XAxis, YAxis,
    CartesianGrid, Tooltip,
    Legend, ResponsiveContainer,
} from 'recharts';

import { getAdminDashboard, getQuizAnalytics, getAllStudentsPerformance, getAttemptsForQuiz } from '../../../api/analytics.api';
import { getSelectableQuizzes } from '../../../api/quiz.api';
import {
    formatDateTime, formatDuration, formatScore,
    formatPercentage, getStatusColor, truncateText,
} from '../../../utils/formatters';

import Card from '../../../components/ui/Card';
import Tabs from '../../../components/ui/Tabs';
import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';

// ─── CSS variable helper ─────────────────────────────────
const getCSSVar = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// ─── Mini progress bar ───────────────────────────────────
function MiniBar({ value }) {
    const pct = Math.min(100, Math.max(0, value ?? 0));
    const color =
        pct >= 70 ? 'var(--color-success)' :
        pct >= 40 ? 'var(--color-warning)' :
                    'var(--color-danger)';
    return (
        <div style={{ width: '100%', height: 5, background: 'var(--color-border-soft)', borderRadius: 9999, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 0.6s ease' }} />
        </div>
    );
}

// ─── Animated pass-rate bar ──────────────────────────────
function PassRateBar({ value }) {
    const [width, setWidth] = useState(0);
    const pct = Math.min(100, Math.max(0, value ?? 0));
    const color =
        pct >= 70 ? 'var(--color-success)' :
        pct >= 50 ? 'var(--color-warning)' :
                    'var(--color-danger)';
    useEffect(() => {
        const t = setTimeout(() => setWidth(pct), 150);
        return () => clearTimeout(t);
    }, [pct]);
    return (
        <div style={{ width: '100%', height: 10, background: 'var(--color-border-soft)', borderRadius: 9999, overflow: 'hidden', marginTop: 12 }}>
            <div style={{ width: `${width}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 1s cubic-bezier(.4,0,.2,1)' }} />
        </div>
    );
}

// ─── Stat card ───────────────────────────────────────────
// eslint-disable-next-line no-unused-vars -- `Icon` is the destructured rename used as <Icon /> in JSX
function StatCard({ icon: Icon, label, value, iconBg, iconColor, loading, toneClass = '' }) {
    if (loading) {
        return (
            <Card padding="md" shadow="sm">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 12, width: '80%' }} />
                    </div>
                </div>
            </Card>
        );
    }
    return (
        <Card padding="md" shadow="sm" hover className={toneClass}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} style={{ color: iconColor }} />
                </div>
                <div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.1 }}>{value}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3, fontWeight: 500 }}>{label}</div>
                </div>
            </div>
        </Card>
    );
}

// ─── Donut center label ──────────────────────────────────
function DonutLabel({ viewBox, value }) {
    const { cx, cy } = viewBox ?? {};
    return (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
            <tspan x={cx} dy="-4" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--color-text-primary)' }}>{value}%</tspan>
            <tspan x={cx} dy={20} style={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}>pass rate</tspan>
        </text>
    );
}

// ─── Section heading ─────────────────────────────────────
function SectionHead({ title, subtitle, action }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{title}</h3>
                {subtitle && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3, margin: 0 }}>{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

// ─── Shimmer rows ─────────────────────────────────────────
function ShimmerRows({ cols, rows = 5 }) {
    return Array.from({ length: rows }).map((_, i) => (
        <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
            {Array.from({ length: cols }).map((__, j) => (
                <td key={j} style={{ padding: '12px 16px' }}>
                    <div className="skeleton" style={{ height: 14, width: `${55 + (j * 13) % 40}%`, borderRadius: 6 }} />
                </td>
            ))}
        </tr>
    ));
}

// ─── Table header ────────────────────────────────────────
const TH = ({ children }) => (
    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', background: 'var(--color-bg-muted)' }}>
        {children}
    </th>
);

// ─── Table row ────────────────────────────────────────────
const TR = ({ children }) => (
    <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        {children}
    </tr>
);

const TD = ({ children, style = {} }) => (
    <td style={{ padding: '12px 14px', color: 'var(--color-text-primary)', fontSize: 13, ...style }}>{children}</td>
);

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function Analytics() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab]             = useState('overview');
    const [selectedQuizUuid, setSelectedQuizUuid] = useState(null);
    const [attemptsPage, setAttemptsPage]        = useState(0);
    const [studentsPage, setStudentsPage]        = useState(0);
    const [quizSearch, setQuizSearch]            = useState('');

    const successColor = getCSSVar('--color-success');
    const dangerColor  = getCSSVar('--color-danger');
    const primaryColor = getCSSVar('--color-primary');
    const warningColor = getCSSVar('--color-warning');
    const infoColor    = getCSSVar('--color-info');

    // ── Queries ───────────────────────────────────────────
    const { data: overviewResponse, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
        queryKey: ['admin-analytics-overview'],
        queryFn: getAdminDashboard,
        staleTime: 60_000,
        onError: () => toast.error('Failed to load overview'),
    });
    const overview = overviewResponse?.data;

    const { data: quizzesResponse, refetch: refetchQuizzes } = useQuery({
        queryKey: ['selectable-quizzes'],
        queryFn: getSelectableQuizzes,
        staleTime: 60_000,
    });
    const quizList = quizzesResponse?.data ?? [];
    const filteredQuizList = quizList.filter(q =>
        q.title.toLowerCase().includes(quizSearch.toLowerCase())
    );

    const { data: quizAnalyticsResponse, isLoading: quizAnalyticsLoading, refetch: refetchQuizAnalytics } = useQuery({
        queryKey: ['quiz-analytics', selectedQuizUuid],
        queryFn: () => getQuizAnalytics(selectedQuizUuid),
        enabled: !!selectedQuizUuid,
        staleTime: 60_000,
        onError: () => toast.error('Failed to load quiz analytics'),
    });
    const quizAnalytics = quizAnalyticsResponse?.data;

    const { data: attemptsResponse, isLoading: attemptsLoading, refetch: refetchAttempts } = useQuery({
        queryKey: ['quiz-attempts', selectedQuizUuid, attemptsPage],
        queryFn: () => getAttemptsForQuiz(selectedQuizUuid, { page: attemptsPage, size: 20 }),
        enabled: !!selectedQuizUuid,
        staleTime: 30_000,
        keepPreviousData: true,
        onError: () => toast.error('Failed to load attempts'),
    });
    const attempts            = attemptsResponse?.data?.content ?? [];
    const attemptsTotalPages  = attemptsResponse?.data?.totalPages ?? 0;
    const attemptsTotalElements = attemptsResponse?.data?.totalElements ?? 0;

    const { data: studentsResponse, isLoading: studentsLoading, refetch: refetchStudents } = useQuery({
        queryKey: ['analytics-students', studentsPage],
        queryFn: () => getAllStudentsPerformance({ page: studentsPage, size: 20 }),
        enabled: activeTab === 'students',
        staleTime: 60_000,
        keepPreviousData: true,
        onError: () => toast.error('Failed to load student data'),
    });
    const students              = studentsResponse?.data?.content ?? [];
    const studentsTotalPages    = studentsResponse?.data?.totalPages ?? 0;
    const studentsTotalElements = studentsResponse?.data?.totalElements ?? 0;

    // ── Helpers ───────────────────────────────────────────
    const handleRefresh = () => {
        refetchOverview(); refetchQuizzes();
        if (selectedQuizUuid) { refetchQuizAnalytics(); refetchAttempts(); }
        if (activeTab === 'students') refetchStudents();
        toast.success('Data refreshed');
    };

    const passRatePct   = overview?.platformPassRate ?? 0;
    const passed        = Math.round((overview?.totalAttempts ?? 0) * passRatePct / 100);
    const failed        = (overview?.totalAttempts ?? 0) - passed;
    const pieData       = [
        { name: 'Passed', value: passRatePct },
        { name: 'Failed', value: Math.max(0, 100 - passRatePct) },
    ];

    const scoreDistributionData = Array.isArray(quizAnalytics?.scoreDistribution)
        ? quizAnalytics.scoreDistribution
        : Object.entries(quizAnalytics?.scoreDistribution ?? {}).map(([range, count]) => ({
            range,
            count: Number(count) || 0,
        }));

    const sortedQuestions = [...(quizAnalytics?.questionAccuracies ?? [])]
        .map((q) => {
            const total = Number(q.totalAnswers) || 0;
            const correct = Number(q.correctCount) || 0;
            const skipped = Number(q.skippedCount) || 0;
            const wrong = Math.max(0, total - correct - skipped);
            return {
                ...q,
                wrongCount: wrong,
                accuracyRate: Number(q.accuracyPct) || 0,
            };
        })
        .sort((a, b) => a.accuracyRate - b.accuracyRate);

    // ════════════════════════════════════════════════════
    return (
        <div style={{ padding: '24px 28px', minHeight: '100vh', background: 'var(--color-bg-page)' }}>

            {/* PAGE HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0 }}>Analytics</h1>
                    <div style={{ width: 56, height: 6, background: 'var(--color-primary)', borderRadius: 9999, marginTop: 6 }} />
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>Platform performance and insights</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Data refreshes every 60 seconds</span>
                    <Button variant="outline" size="sm" icon={<RefreshCw size={13} />} onClick={handleRefresh}>Refresh</Button>
                </div>
            </div>

            {/* TABS */}
            <div style={{ marginBottom: 28 }}>
                <Tabs
                    tabs={[
                        { key: 'overview',  label: '📊 Overview' },
                        { key: 'quizzes',   label: '📋 Quiz Analytics' },
                        { key: 'students',  label: '🎓 Student Performance' },
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    variant="underline"
                />
            </div>

            {/* ══════════════ TAB 1 — OVERVIEW ══════════════ */}
            {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                        <StatCard loading={overviewLoading} icon={Users}        label="Total Students"  value={overview?.totalStudents  ?? 0} iconBg="var(--color-primary-light)" iconColor={primaryColor} toneClass="bg-[var(--color-block-blue)]" />
                        <StatCard loading={overviewLoading} icon={BookOpen}     label="Total Quizzes"   value={overview?.totalQuizzes   ?? 0} iconBg="var(--color-success-soft)" iconColor={successColor} toneClass="bg-[var(--color-block-green)]" />
                        <StatCard loading={overviewLoading} icon={PlayCircle}   label="Active Quizzes"  value={overview?.activeQuizzes  ?? 0} iconBg="var(--color-warning-soft)" iconColor={warningColor} toneClass="bg-[var(--color-block-amber)]" />
                        <StatCard loading={overviewLoading} icon={ClipboardList} label="Total Attempts" value={overview?.totalAttempts  ?? 0} iconBg="var(--color-info-soft)" iconColor={infoColor} toneClass="bg-[var(--color-block-sky)]" />
                        <StatCard loading={overviewLoading} icon={TrendingUp}   label="Attempts Today"  value={overview?.attemptsToday  ?? 0} iconBg="var(--color-danger-soft)" iconColor={dangerColor} toneClass="bg-[var(--color-block-red)]" />
                    </div>

                    {/* Pass Rate */}
                    <Card padding="lg" shadow="sm" className="bg-[var(--color-block-cream)]">
                        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Left */}
                            <div style={{ flex: '1 1 55%', minWidth: 220 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                                    Platform Pass Rate
                                </p>
                                {overviewLoading
                                    ? <div className="skeleton" style={{ height: 52, width: 130, borderRadius: 8 }} />
                                    : <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, color: 'var(--color-text-primary)' }}>
                                        {passRatePct.toFixed(1)}<span style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text-secondary)' }}>%</span>
                                      </div>
                                }
                                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '8px 0 0' }}>
                                    Percentage of attempts that passed
                                </p>
                                <PassRateBar value={passRatePct} />
                                <div style={{ display: 'flex', gap: 28, marginTop: 18 }}>
                                    {[
                                        { label: 'Total',  val: overview?.totalAttempts ?? 0, color: 'var(--color-text-primary)' },
                                        { label: 'Passed', val: passed,  color: successColor },
                                        { label: 'Failed', val: failed,  color: dangerColor },
                                    ].map(({ label, val, color }) => (
                                        <div key={label}>
                                            <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2, fontWeight: 500 }}>{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Right — Donut */}
                            <div style={{ flex: '1 1 35%', minWidth: 200, display: 'flex', justifyContent: 'center' }}>
                                {overviewLoading
                                    ? <div className="skeleton" style={{ width: 180, height: 180, borderRadius: '50%' }} />
                                    : (
                                        <ResponsiveContainer width={210} height={210}>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" labelLine={false} label={<DonutLabel value={passRatePct.toFixed(1)} />}>
                                                    <Cell fill={successColor} />
                                                    <Cell fill={dangerColor} />
                                                </Pie>
                                                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v}</span>} />
                                                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`]} contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )
                                }
                            </div>
                        </div>
                    </Card>

                    {/* Top Quizzes */}
                    <Card padding="lg" shadow="sm" className="bg-[var(--color-block-sky)]">
                        <SectionHead title="Top Performing Quizzes" subtitle="By number of attempts" />
                        {overviewLoading ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody><ShimmerRows cols={6} rows={5} /></tbody></table>
                        ) : (overview?.topQuizzes ?? []).length === 0 ? (
                            <EmptyState icon={<BookOpen size={40} />} title="No quiz data yet" description="Data will appear once students start taking quizzes" />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['#','Quiz Title','Attempts','Avg Score','Pass Rate','Status'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                                    <tbody>
                                        {(overview?.topQuizzes ?? []).slice(0, 5).map((quiz, i) => (
                                            <TR key={quiz.quizUuid ?? i}>
                                                <TD style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{i + 1}</TD>
                                                <TD>
                                                    <button onClick={() => { setSelectedQuizUuid(quiz.quizUuid); setActiveTab('quizzes'); }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, padding: 0 }}>
                                                        {truncateText(quiz.title, 35)}
                                                    </button>
                                                </TD>
                                                <TD style={{ fontWeight: 700 }}>{quiz.attemptCount ?? 0}</TD>
                                                <TD>{formatPercentage(quiz.avgScore)}</TD>
                                                <TD style={{ minWidth: 130 }}>
                                                    <div>{formatPercentage(quiz.passRate)}</div>
                                                    <MiniBar value={quiz.passRate ?? 0} />
                                                </TD>
                                                <TD><Badge variant={getStatusColor(quiz.status)} size="sm">{quiz.status}</Badge></TD>
                                            </TR>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    {/* Recent Attempts */}
                    <Card padding="lg" shadow="sm" className="bg-[var(--color-block-mint)]">
                        <SectionHead
                            title="Recent Attempts"
                            subtitle="Latest 10 submissions across all quizzes"
                            action={
                                <button onClick={() => setActiveTab('quizzes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    View all <ChevronRight size={14} />
                                </button>
                            }
                        />
                        {overviewLoading ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody><ShimmerRows cols={7} rows={10} /></tbody></table>
                        ) : (overview?.recentAttempts ?? []).length === 0 ? (
                            <EmptyState icon={<ClipboardList size={36} />} title="No attempts yet" />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['Quiz','Attempt #','Score','Percentage','Result','Time Taken','Submitted'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                                    <tbody>
                                        {(overview?.recentAttempts ?? []).map((a, i) => (
                                            <TR key={a.attemptUuid ?? i}>
                                                <TD style={{ maxWidth: 200 }}>{truncateText(a.quizTitle, 35)}</TD>
                                                <TD style={{ color: 'var(--color-text-secondary)' }}>#{a.attemptNumber}</TD>
                                                <TD style={{ fontWeight: 600 }}>{formatScore(a.marksObtained, a.totalMarksPossible)}</TD>
                                                <TD>{formatPercentage(a.percentage)}</TD>
                                                <TD><Badge variant={a.isPassed ? 'success' : 'danger'} size="sm">{a.isPassed ? 'Passed' : 'Failed'}</Badge></TD>
                                                <TD style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDuration(a.timeTakenSeconds)}</TD>
                                                <TD style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{formatDateTime(a.submittedAt)}</TD>
                                            </TR>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* ══════════════ TAB 2 — QUIZ ANALYTICS ══════════════ */}
            {activeTab === 'quizzes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Quiz Selector */}
                    <Card padding="lg" shadow="sm" className="bg-[var(--color-block-blue)]">
                        <SectionHead title="Select a Quiz to Analyze" />
                        <div style={{ position: 'relative', marginBottom: 12 }}>
                            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search quizzes..."
                                value={quizSearch}
                                onChange={e => setQuizSearch(e.target.value)}
                                style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, outline: 'none', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', fontFamily: 'inherit' }}
                                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={e  => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </div>
                        <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 10, background: 'var(--color-bg-muted)' }}>
                            {filteredQuizList.length === 0 ? (
                                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>No quizzes found</div>
                            ) : filteredQuizList.map((quiz, i) => {
                                const isSel = selectedQuizUuid === quiz.quizUuid;
                                return (
                                    <div key={quiz.quizUuid}
                                        onClick={() => { setSelectedQuizUuid(quiz.quizUuid); setAttemptsPage(0); }}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', cursor: 'pointer', borderBottom: i < filteredQuizList.length - 1 ? '1px solid var(--color-border)' : 'none', background: isSel ? 'var(--color-primary-light)' : 'transparent', borderLeft: isSel ? '3px solid var(--color-primary)' : '3px solid transparent', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--color-bg-muted-2)'; }}
                                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: 13, color: isSel ? 'var(--color-primary)' : 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{quiz.title}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
                                            <Badge variant={getStatusColor(quiz.status)} size="sm">{quiz.status}</Badge>
                                            <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{isSel ? '✓ Selected' : 'Analyze →'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {!selectedQuizUuid && (
                            <p style={{ marginTop: 14, fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center' }}>← Select a quiz above to see its analytics</p>
                        )}
                    </Card>

                    {selectedQuizUuid && (
                        <>
                            {/* Quiz banner */}
                            {quizAnalytics && !quizAnalyticsLoading && (
                                <div style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-deep) 100%)', borderRadius: 12, padding: '16px 24px', color: 'var(--color-text-inverse)' }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.75 }}>Analyzing</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{quizAnalytics.quizTitle}</div>
                                </div>
                            )}

                            {/* A. Stats Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
                                <StatCard loading={quizAnalyticsLoading} icon={ClipboardList} label="Total Attempts" value={quizAnalytics?.totalAttempts ?? 0}                  iconBg="var(--color-info-soft)" iconColor={infoColor} toneClass="bg-[var(--color-block-sky)]" />
                                <StatCard loading={quizAnalyticsLoading} icon={TrendingUp}    label="Pass Rate"      value={formatPercentage(quizAnalytics?.passRate)}            iconBg="var(--color-success-soft)" iconColor={successColor} toneClass="bg-[var(--color-block-green)]" />
                                <StatCard loading={quizAnalyticsLoading} icon={BarChart2}     label="Average Score"  value={formatPercentage(quizAnalytics?.averageScore)}        iconBg="var(--color-primary-light)" iconColor={primaryColor} toneClass="bg-[var(--color-block-blue)]" />
                                <StatCard loading={quizAnalyticsLoading} icon={PlayCircle}    label="Avg Time"       value={formatDuration(quizAnalytics?.averageDurationSeconds)} iconBg="var(--color-warning-soft)" iconColor={warningColor} toneClass="bg-[var(--color-block-amber)]" />
                            </div>

                            {/* B. High / Low */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                {[
                                    { label: 'Highest Score', val: quizAnalytics?.highestScore, Icon: TrendingUp,   bg: 'var(--color-success-soft)', color: successColor },
                                    { label: 'Lowest Score',  val: quizAnalytics?.lowestScore,  Icon: TrendingDown, bg: 'var(--color-danger-soft)', color: dangerColor  },
                                    // eslint-disable-next-line no-unused-vars -- `Icon` is destructured-renamed; used as <Icon /> in JSX below
                                ].map(({ label, val, Icon, bg, color }) => (
                                    <Card key={label} padding="md" shadow="sm" className={label === 'Highest Score' ? 'bg-[var(--color-block-green)]' : 'bg-[var(--color-block-red)]'}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon size={18} style={{ color }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</div>
                                                {quizAnalyticsLoading
                                                    ? <div className="skeleton" style={{ height: 26, width: 70, marginTop: 4 }} />
                                                    : <div style={{ fontSize: 24, fontWeight: 700, color }}>{formatPercentage(val)}</div>
                                                }
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* C. Score Distribution */}
                            <Card padding="lg" shadow="sm" className="bg-[var(--color-block-cream)]">
                                <SectionHead title="Score Distribution" subtitle="How scores are spread across attempts" />
                                {quizAnalyticsLoading ? (
                                    <div className="skeleton" style={{ height: 280, borderRadius: 10 }} />
                                ) : scoreDistributionData.length === 0 ? (
                                    <EmptyState icon={<BarChart2 size={36} />} title="No distribution data yet" />
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={scoreDistributionData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                                            <XAxis dataKey="range" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                formatter={(val, _, p) => [`${val} attempts`, `Range: ${p.payload.range}`]}
                                                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }}
                                            />
                                            <Bar dataKey="count" fill={primaryColor} radius={[6, 6, 0, 0]} maxBarSize={52} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </Card>

                            {/* D. Question Accuracy */}
                            <Card padding="lg" shadow="sm" className="bg-[var(--color-block-mint)]">
                                <SectionHead title="Question-by-Question Accuracy" subtitle="Hardest questions first" />
                                {quizAnalyticsLoading ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody><ShimmerRows cols={6} rows={5} /></tbody></table>
                                ) : sortedQuestions.length === 0 ? (
                                    <EmptyState icon={<HelpCircle size={36} />} title="No question data yet" description="Data appears after students attempt this quiz" />
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                            <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['#','Question','Correct','Wrong','Skipped','Accuracy'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                                            <tbody>
                                                {sortedQuestions.map((q, i) => (
                                                    <TR key={q.questionUuid ?? i}>
                                                        <TD style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{i + 1}</TD>
                                                        <TD style={{ maxWidth: 280 }}>{truncateText(q.questionText, 50)}</TD>
                                                        <TD style={{ fontWeight: 700, color: successColor }}>{q.correctCount}</TD>
                                                        <TD style={{ fontWeight: 700, color: dangerColor }}>{q.wrongCount}</TD>
                                                        <TD style={{ fontWeight: 700, color: warningColor }}>{q.skippedCount}</TD>
                                                        <TD style={{ minWidth: 120 }}>
                                                            <div style={{ fontWeight: 600 }}>{formatPercentage(q.accuracyRate)}</div>
                                                            <MiniBar value={q.accuracyRate ?? 0} />
                                                        </TD>
                                                    </TR>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>

                            {/* E. Attempts */}
                            <Card padding="lg" shadow="sm" className="bg-[var(--color-block-sky)]">
                                <SectionHead title="All Attempts" subtitle={`${attemptsTotalElements} total`} />
                                {attemptsLoading ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody><ShimmerRows cols={8} rows={10} /></tbody></table>
                                ) : attempts.length === 0 ? (
                                    <EmptyState icon={<ClipboardList size={36} />} title="No attempts yet" />
                                ) : (
                                    <>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                                <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['Student','Attempt #','Score','%','Result','Time','Submitted','Flags'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                                                <tbody>
                                                    {attempts.map((a, i) => (
                                                        <TR key={a.attemptUuid ?? i}>
                                                            <TD>
                                                                <button onClick={() => navigate(`/admin/students/${a.studentUuid}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                                                                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 13 }}>{a.studentName}</div>
                                                                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{a.studentEmail}</div>
                                                                </button>
                                                            </TD>
                                                            <TD style={{ color: 'var(--color-text-secondary)' }}>#{a.attemptNumber}</TD>
                                                            <TD style={{ fontWeight: 600 }}>{formatScore(a.marksObtained, a.totalMarksPossible)}</TD>
                                                            <TD>{formatPercentage(a.percentage)}</TD>
                                                            <TD><Badge variant={a.isPassed ? 'success' : 'danger'} size="sm">{a.isPassed ? 'Passed' : 'Failed'}</Badge></TD>
                                                            <TD style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{formatDuration(a.timeTakenSeconds)}</TD>
                                                            <TD style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{formatDateTime(a.submittedAt)}</TD>
                                                            <TD>
                                                                {a.isFlaggedSuspicious && <Badge variant="danger" size="sm">⚠️ Flagged</Badge>}
                                                                {a.tabSwitchCount > 0 && (
                                                                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: a.isFlaggedSuspicious ? 4 : 0 }}>
                                                                        {a.tabSwitchCount} tab switch{a.tabSwitchCount !== 1 ? 'es' : ''}
                                                                    </div>
                                                                )}
                                                            </TD>
                                                        </TR>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ marginTop: 16 }}>
                                            <Pagination currentPage={attemptsPage} totalPages={attemptsTotalPages} onPageChange={p => setAttemptsPage(p)} />
                                        </div>
                                    </>
                                )}
                            </Card>
                        </>
                    )}
                </div>
            )}

            {/* ══════════════ TAB 3 — STUDENT PERFORMANCE ══════════════ */}
            {activeTab === 'students' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                        <StatCard loading={studentsLoading || overviewLoading} icon={Users}         label="Total Students"    value={studentsTotalElements}                       iconBg="var(--color-primary-light)" iconColor={primaryColor} toneClass="bg-[var(--color-block-blue)]" />
                        <StatCard loading={studentsLoading || overviewLoading} icon={TrendingUp}    label="Platform Pass Rate" value={formatPercentage(overview?.platformPassRate)} iconBg="var(--color-success-soft)" iconColor={successColor} toneClass="bg-[var(--color-block-green)]" />
                        <StatCard loading={studentsLoading || overviewLoading} icon={ClipboardList} label="Total Attempts"     value={overview?.totalAttempts ?? 0}                iconBg="var(--color-info-soft)" iconColor={infoColor} toneClass="bg-[var(--color-block-sky)]" />
                    </div>

                    {/* Table */}
                    <Card padding="lg" shadow="sm" className="bg-[var(--color-block-mint)]">
                        <SectionHead title="Student Performance" subtitle={`${studentsTotalElements} students total`} />
                        {studentsLoading ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody><ShimmerRows cols={8} rows={10} /></tbody></table>
                        ) : students.length === 0 ? (
                            <EmptyState icon={<Users size={36} />} title="No student data yet" description="Performance data appears once students start taking quizzes" />
                        ) : (
                            <>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['Student','Attempts','P / F','Avg Score','Best Score','Pass Rate','Last Attempt','Action'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                                        <tbody>
                                            {students.map((s, i) => (
                                                <TR key={s.studentUuid ?? i}>
                                                    <TD>
                                                        <button onClick={() => navigate(`/admin/students/${s.studentUuid}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
                                                            <Avatar name={s.fullName} size="sm" />
                                                            <div style={{ textAlign: 'left' }}>
                                                                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 13 }}>{s.fullName}</div>
                                                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.email}</div>
                                                            </div>
                                                        </button>
                                                    </TD>
                                                    <TD style={{ fontWeight: 700, textAlign: 'center' }}>{s.totalAttempts}</TD>
                                                    <TD>
                                                        <div style={{ display: 'flex', gap: 5 }}>
                                                            <Badge variant="success" size="sm">{s.passCount} P</Badge>
                                                            <Badge variant="danger"  size="sm">{s.failCount} F</Badge>
                                                        </div>
                                                    </TD>
                                                    <TD style={{ minWidth: 110 }}>
                                                        <div style={{ fontWeight: 600 }}>{formatPercentage(s.averageScore)}</div>
                                                        <MiniBar value={s.averageScore ?? 0} />
                                                    </TD>
                                                    <TD style={{ fontWeight: 600, color: successColor }}>{formatPercentage(s.bestScore)}</TD>
                                                    <TD style={{ minWidth: 110 }}>
                                                        <div style={{ fontWeight: 600 }}>{formatPercentage(s.passRate)}</div>
                                                        <MiniBar value={s.passRate ?? 0} />
                                                    </TD>
                                                    <TD style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                                                        {s.lastAttemptAt ? formatDateTime(s.lastAttemptAt) : <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>No attempts yet</span>}
                                                    </TD>
                                                    <TD>
                                                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/students/${s.studentUuid}`)}>View</Button>
                                                    </TD>
                                                </TR>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ marginTop: 16 }}>
                                    <Pagination currentPage={studentsPage} totalPages={studentsTotalPages} totalElements={studentsTotalElements} onPageChange={p => setStudentsPage(p)} />
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}