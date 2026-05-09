import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle, TrendingUp, Award, ChevronRight } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getStudentDashboard } from '../../api/attempt.api';
import { formatPercentage, formatDuration, formatDate, truncateText, getStatusColor } from '../../utils/formatters';
import Card from '../../components/ui/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

// ─── Greeting helper ─────────────────────────────────────
function getGreeting(name) {
    const h = new Date().getHours();
    if (h >= 6  && h < 12) return `Good morning, ${name}! ☀️`;
    if (h >= 12 && h < 18) return `Good afternoon, ${name}! 👋`;
    if (h >= 18)            return `Good evening, ${name}! 🌙`;
    return `Hey, ${name}! 🦉`;
}

// ─── Circular progress ring ───────────────────────────────
function RingChart({ value = 0 }) {
    const [current, setCurrent] = useState(0);
    const r = 45, cx = 60, cy = 60;
    const circ = 2 * Math.PI * r;
    const offset = circ - (current / 100) * circ;
    const color = value >= 70 ? 'var(--color-success)' : value >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';

    useEffect(() => {
        const t = setTimeout(() => setCurrent(Math.min(100, Math.max(0, value))), 150);
        return () => clearTimeout(t);
    }, [value]);

    return (
        <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border-muted)" strokeWidth="10" />
            <circle
                cx={cx} cy={cy} r={r} fill="none"
                stroke={color} strokeWidth="10"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
            />
            <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: 'var(--color-text-primary)' }}>{value?.toFixed(0)}%</text>
            <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}>pass rate</text>
        </svg>
    );
}

// ─── Stat card ────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars -- `Icon` is the destructured rename used as <Icon /> in JSX
function StatCard({ icon: Icon, label, value, iconBg, iconColor, sub, loading, toneClass = '' }) {
    if (loading) return (
        <Card padding="md" shadow="sm">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 24, width: '55%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: '70%' }} />
                </div>
            </div>
        </Card>
    );
    return (
        <Card padding="md" shadow="sm" hover className={toneClass}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={19} style={{ color: iconColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.1 }}>{value}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>{label}</div>
                    {sub}
                </div>
            </div>
        </Card>
    );
}

// ─── Mini progress bar ────────────────────────────────────
function MiniBar({ value }) {
    const pct = Math.min(100, Math.max(0, value ?? 0));
    const color = pct >= 70 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
    return (
        <div style={{ width: '100%', height: 4, background: 'var(--color-border-muted)', borderRadius: 9999, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 0.7s ease' }} />
        </div>
    );
}

// ─── Score color ──────────────────────────────────────────
const scoreColor = (v) => v >= 70 ? 'var(--color-success)' : v >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';

// ════════════════════════════════════════════════════════
export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: response, isLoading } = useQuery({
        queryKey: ['student-dashboard'],
        queryFn: getStudentDashboard,
        staleTime: 60_000,
    });
    const dashboard = response?.data;

    const streak = dashboard?.currentStreak ?? 0;
    const isOnFire = streak >= 7;

    // Capture "now" once per mount via a lazy state initialiser — Date.now()
    // in render (or in useMemo) violates the React purity rule.
    const [nowMs] = useState(() => Date.now());

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── WELCOME HEADER ── */}
            <Card padding="lg" shadow="sm" className="bg-[var(--color-primary)] text-[var(--color-text-inverse)]">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    {/* Left */}
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text-inverse)', margin: 0 }}>
                            {getGreeting(user?.fullName ?? 'there')}
                        </h1>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>
                            {isLoading
                                ? '...'
                                : (dashboard?.totalQuizzesTaken ?? 0) === 0
                                    ? "Welcome! Take your first quiz to get started."
                                    : `You've completed ${dashboard.totalQuizzesTaken} quizzes. Keep it up!`
                            }
                        </p>
                    </div>
                    {/* Right — XP & Streak */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
                        padding: '12px 18px', borderRadius: 14,
                        background: 'var(--color-bg-card)',
                        border: '2px solid var(--color-border)',
                        boxShadow: '3px 3px 0 var(--color-border)',
                        transition: 'all 0.3s',
                    }}>
                        {isLoading
                            ? <div className="skeleton" style={{ width: 80, height: 32 }} />
                            : <>
                                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                                    🔥 {dashboard?.xpPoints ?? 0} XP
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                    ⚡ {streak} day streak
                                </div>
                                {isOnFire && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.04em' }}>🏆 On fire!</div>}
                            </>
                        }
                    </div>
                </div>
            </Card>

            {/* ── STATS CARDS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                <StatCard loading={isLoading} icon={BookOpen}     label="Total attempts"   value={dashboard?.totalQuizzesTaken  ?? 0}  iconBg="var(--color-primary-light)" iconColor="var(--color-primary)" toneClass="bg-[var(--color-block-blue)]" />
                <StatCard loading={isLoading} icon={CheckCircle}  label="Passed quizzes"   value={dashboard?.totalQuizzesPassed ?? 0}  iconBg="var(--color-success-soft)" iconColor="var(--color-success)" toneClass="bg-[var(--color-block-green)]" />
                <StatCard loading={isLoading} icon={TrendingUp}   label="Avg score"
                    value={formatPercentage(dashboard?.averageScore)}
                    iconBg="var(--color-warning-soft)" iconColor="var(--color-warning)"
                    sub={!isLoading && <MiniBar value={dashboard?.averageScore} />}
                    toneClass="bg-[var(--color-block-amber)]"
                />
                <StatCard loading={isLoading} icon={Award}        label="Personal best"    value={formatPercentage(dashboard?.bestScore)} iconBg="var(--color-danger-soft)" iconColor="var(--color-danger)" toneClass="bg-[var(--color-block-purple)]" />
            </div>

            {/* ── PASS RATE BANNER ── */}
            <Card padding="lg" shadow="sm" className="bg-[var(--color-block-cream)]">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                    <div style={{ flex: '1 1 55%', minWidth: 180 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Your Pass Rate</p>
                        {isLoading
                            ? <div className="skeleton" style={{ height: 52, width: 120 }} />
                            : <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1, color: 'var(--color-text-primary)' }}>
                                {(dashboard?.passRate ?? 0).toFixed(1)}<span style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-secondary)' }}>%</span>
                              </div>
                        }
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>Keep it above 70% for best results</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {isLoading
                            ? <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%' }} />
                            : <RingChart value={dashboard?.passRate ?? 0} />
                        }
                    </div>
                </div>
            </Card>

            {/* ── TWO COLUMN: Recent + Upcoming ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 20 }}>

                {/* LEFT — Recent Attempts */}
                <Card padding="lg" shadow="sm" className="bg-[var(--color-block-sky)]">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Recent Attempts</h3>
                        <button onClick={() => navigate('/student/history')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 2 }}>
                            View all <ChevronRight size={14} />
                        </button>
                    </div>

                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-border-soft)' }}>
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                                    <div className="skeleton" style={{ height: 11, width: '40%' }} />
                                </div>
                                <div className="skeleton" style={{ width: 44, height: 22 }} />
                            </div>
                        ))
                    ) : (dashboard?.recentAttempts ?? []).length === 0 ? (
                        <EmptyState
                            icon={<BookOpen size={36} />}
                            title="No attempts yet"
                            description="Take your first quiz!"
                            action={{ label: 'Browse Quizzes', onClick: () => navigate('/student/quizzes') }}
                        />
                    ) : (
                        (dashboard.recentAttempts).slice(0, 5).map((a, i, arr) => (
                            <div key={a.attemptUuid ?? i}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-soft)' : 'none', cursor: 'pointer' }}
                                onClick={() => navigate(`/student/results/${a.attemptUuid}`)}
                            >
                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {truncateText(a.quizTitle, 35)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                        <Badge variant={getStatusColor(a.status)} size="sm">{a.status?.replace('_', ' ')}</Badge>
                                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>#{a.attemptNumber}</span>
                                    </div>
                                </div>
                                
                            </div>
                        ))
                    )}
                </Card>

                {/* RIGHT — Upcoming Quizzes */}
                <Card padding="lg" shadow="sm" className="bg-[var(--color-block-mint)]">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Upcoming Quizzes</h3>
                        <button onClick={() => navigate('/student/quizzes')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 2 }}>
                            Browse all <ChevronRight size={14} />
                        </button>
                    </div>

                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-soft)' }}>
                                <div className="skeleton" style={{ height: 14, width: '75%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 11, width: '55%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 11, width: '40%' }} />
                            </div>
                        ))
                    ) : (dashboard?.upcomingQuizzes ?? []).length === 0 ? (
                        <EmptyState
                            icon={<BookOpen size={36} />}
                            title="No upcoming quizzes"
                            description="Check back for new quizzes"
                            action={{ label: 'Browse All Quizzes', onClick: () => navigate('/student/quizzes') }}
                        />
                    ) : (
                        (dashboard.upcomingQuizzes).slice(0, 3).map((quiz, i, arr) => {
                            const expiresMs  = quiz.expiresAt ? new Date(quiz.expiresAt) - nowMs : null;
                            const soonExpiry = expiresMs !== null && expiresMs < 86_400_000;
                            return (
                                <div key={quiz.uuid ?? i} style={{ padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-soft)' : 'none' }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {truncateText(quiz.title, 30)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                        <Badge variant={quiz.difficulty === 'EASY' ? 'success' : quiz.difficulty === 'HARD' ? 'danger' : 'warning'} size="sm">{quiz.difficulty}</Badge>
                                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{quiz.questionCount} questions</span>
                                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                            {quiz.timeLimitSeconds ? formatDuration(quiz.timeLimitSeconds) : 'No limit'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                                        <span style={{ fontSize: 11, color: soonExpiry ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: soonExpiry ? 600 : 400 }}>
                                            {quiz.expiresAt ? `Expires: ${formatDate(quiz.expiresAt)}` : ''}
                                        </span>
                                        <button onClick={() => navigate(`/student/quizzes/${quiz.uuid}`)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: 12 }}>
                                            Start Quiz →
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </Card>
            </div>
        </div>
    );
}