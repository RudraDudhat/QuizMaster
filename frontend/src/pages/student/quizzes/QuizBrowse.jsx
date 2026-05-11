import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Filter } from 'lucide-react';
import { getAvailableQuizzes } from '../../../api/attempt.api';
import { formatPercentage, formatDuration, formatDate } from '../../../utils/formatters';
import { DIFFICULTY_LEVELS } from '../../../utils/constants';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';

// ─── Difficulty badge variant ─────────────────────────────
const diffVariant = (d) => d === 'EASY' ? 'success' : d === 'HARD' ? 'danger' : 'warning';

// ─── Status badge ─────────────────────────────────────────
function StatusBadge({ status, isPassed }) {
    const map = {
        AVAILABLE:            { v: 'success', label: 'Available' },
        UPCOMING:             { v: 'info',    label: 'Upcoming' },
        EXPIRED:              { v: 'default', label: 'Expired' },
        COMPLETED:            { v: 'warning', label: isPassed ? 'Passed ✓' : 'Completed ✓' },
        MAX_ATTEMPTS_REACHED: { v: 'danger',  label: 'Attempts Used' },
    };
    const cfg = map[status] ?? { v: 'default', label: status };
    return <Badge variant={cfg.v} size="sm">{cfg.label}</Badge>;
}

// ─── Mini progress bar ────────────────────────────────────
function MiniBar({ value }) {
    const pct = Math.min(100, Math.max(0, value ?? 0));
    const color = pct >= 70 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
    return (
        <div style={{ width: '100%', height: 5, background: 'var(--color-border-muted)', borderRadius: 9999, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 9999 }} />
        </div>
    );
}

// ─── Skeleton card ────────────────────────────────────────
function SkeletonCard() {
    return (
        <div style={{ background: 'var(--color-bg-card)', border: '2px solid var(--color-border)', borderRadius: 20, overflow: 'hidden', boxShadow: '3px 3px 0 var(--color-border)' }}>
            <div className="skeleton" style={{ height: 4 }} />
            <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div className="skeleton" style={{ height: 11, width: '35%' }} />
                    <div className="skeleton" style={{ height: 20, width: 70, borderRadius: 9999 }} />
                </div>
                <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 13, width: '95%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 13, width: '70%', marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 22, width: 60, borderRadius: 6 }} />)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--color-border-soft)' }}>
                    <div className="skeleton" style={{ height: 20, width: 70, borderRadius: 9999 }} />
                    <div className="skeleton" style={{ height: 30, width: 90, borderRadius: 8 }} />
                </div>
            </div>
        </div>
    );
}

// ─── Quiz Card ────────────────────────────────────────────
function QuizCard({ quiz }) {
    const navigate = useNavigate();
    // Date.now() is impure during render; cache once via a lazy state initialiser.
    const [nowMs] = useState(() => Date.now());
    const hoursLeft = quiz.expiresAt
        ? (new Date(quiz.expiresAt) - nowMs) / 3_600_000
        : null;
    const canStart  = !['MAX_ATTEMPTS_REACHED', 'EXPIRED', 'UPCOMING'].includes(quiz.quizStatus);
    const headerGradient =
        quiz.difficulty === 'EASY'
            ? 'linear-gradient(135deg,var(--color-success-soft),var(--color-success))'
            : quiz.difficulty === 'HARD'
                ? 'linear-gradient(135deg,var(--color-danger-soft),var(--color-danger))'
                : 'linear-gradient(135deg,var(--color-warning-soft),var(--color-warning))';

    return (
        <div
            onClick={() => navigate(`/student/quizzes/${quiz.uuid}`)}
            style={{
                background: 'var(--color-bg-card)', border: '2px solid var(--color-border)',
                borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                boxShadow: '3px 3px 0 var(--color-border)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '5px 5px 0 var(--color-border)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '3px 3px 0 var(--color-border)'; e.currentTarget.style.transform = ''; }}
        >
            {/* Header gradient */}
            <div style={{ height: 72, background: headerGradient, borderBottom: '2px solid var(--color-border)' }} />

            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1, gap: 0 }}>
                {/* Category + Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {quiz.categoryName ?? 'General'}
                    </span>
                    <StatusBadge status={quiz.quizStatus} isPassed={quiz.isPassed} />
                </div>

                {/* Title */}
                <h3 style={{
                    fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)',
                    margin: '0 0 6px', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {quiz.title}
                </h3>

                {/* Description */}
                <p style={{
                    fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 14px',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    lineHeight: 1.5, flex: 1,
                }}>
                    {quiz.description ?? 'No description provided.'}
                </p>

                {/* Stats row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {[
                        `📝 ${quiz.questionCount} questions`,
                        `⏱️ ${quiz.timeLimitSeconds ? formatDuration(quiz.timeLimitSeconds) : 'No limit'}`,
                        `💯 ${quiz.totalMarks} marks`,
                        `🎯 Pass: ${quiz.passMarks}`,
                    ].map(s => (
                        <span key={s} style={{ fontSize: 11, background: 'var(--color-bg-card)', border: '2px solid var(--color-border)', borderRadius: 9999, padding: '3px 8px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{s}</span>
                    ))}
                </div>

                {/* Best score bar (if attempted) */}
                {(quiz.attemptsUsed ?? 0) > 0 && (
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            Best: {formatPercentage(quiz.studentBestPercentage)}
                        </div>
                        <MiniBar value={quiz.studentBestPercentage} />
                    </div>
                )}

                {/* Attempts info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        Attempt {quiz.attemptsUsed ?? 0} of {quiz.maxAttempts === 0 ? '∞' : quiz.maxAttempts}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: quiz.attemptsRemaining === 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                        {quiz.attemptsRemaining === 0
                            ? '🔒 No attempts left'
                            : quiz.attemptsRemaining === -1
                                ? 'Unlimited'
                                : `${quiz.attemptsRemaining} left`
                        }
                    </span>
                </div>

                {/* Expiry warning */}
                {hoursLeft !== null && (
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: hoursLeft < 24 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                        {hoursLeft < 24
                            ? `⚠️ Expires in ${Math.max(1, Math.floor(hoursLeft))} hours!`
                            : hoursLeft < 72
                                ? `Expires ${formatDate(quiz.expiresAt)}`
                                : null
                        }
                    </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px solid var(--color-border)', marginTop: 'auto' }}>
                    <Badge variant={diffVariant(quiz.difficulty)} size="sm">{quiz.difficulty}</Badge>
                    <Button
                        variant="primary" size="sm"
                        disabled={!canStart}
                        onClick={e => { e.stopPropagation(); navigate(`/student/quizzes/${quiz.uuid}`); }}
                    >
                        Start Quiz →
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════
export default function QuizBrowse() {
    const [searchParams, setSearchParams] = useSearchParams();
    const groupUuid = searchParams.get('group') ?? '';

    const [page, setPage]               = useState(0);
    const [diffFilter, setDiffFilter]   = useState('');
    const [typeFilter, setTypeFilter]   = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch]           = useState('');

    const { data: response, isLoading } = useQuery({
        queryKey: ['student-quizzes', page],
        queryFn:  () => getAvailableQuizzes({ page, size: 12 }),
        staleTime: 30_000,
        keepPreviousData: true,
    });
    const quizzes       = response?.data?.content ?? [];
    const totalPages    = response?.data?.totalPages ?? 0;
    const totalElements = response?.data?.totalElements ?? 0;

    const filteredQuizzes = quizzes
        .filter(q => diffFilter   ? q.difficulty === diffFilter     : true)
        .filter(q => typeFilter   ? q.quizType   === typeFilter     : true)
        .filter(q => statusFilter ? q.quizStatus === statusFilter   : true)
        .filter(q => search       ? q.title.toLowerCase().includes(search.toLowerCase()) : true)
        .filter(q => groupUuid    ? (q.assignedGroupUuids ?? []).includes(groupUuid) : true);

    const anyFilter = diffFilter || typeFilter || statusFilter || search || groupUuid;
    const clearAll  = () => {
        setSearch(''); setDiffFilter(''); setTypeFilter(''); setStatusFilter('');
        setSearchParams({}); // also drop ?group=
    };
    const clearGroup = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('group');
        setSearchParams(next);
    };

    const inputStyle = {
        height: 40, border: '2px solid var(--color-border)', borderRadius: 9999,
        fontSize: 13, padding: '0 12px', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)',
        outline: 'none', fontFamily: 'inherit', cursor: 'pointer', transition: 'border-color 0.15s',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* PAGE HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Available Quizzes</h1>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{totalElements} quizzes available</p>
                    {groupUuid && (
                        <button
                            onClick={clearGroup}
                            title="Clear group filter"
                            style={{
                                marginTop: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px 4px 12px',
                                borderRadius: 999,
                                background: 'var(--color-primary-light)',
                                border: '2px solid var(--color-primary)',
                                color: 'var(--color-primary)',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Filtered by group
                            <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>×</span>
                        </button>
                    )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', alignSelf: 'flex-end' }}>
                    Showing {filteredQuizzes.length} of {quizzes.length}
                </div>
            </div>

            {/* FILTERS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', background: 'var(--color-bg-card)', border: '2px solid var(--color-border)', borderRadius: 16, padding: '14px 16px', boxShadow: '3px 3px 0 var(--color-border)' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
                    <input type="text" placeholder="Search quizzes..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ ...inputStyle, width: '100%', paddingLeft: 32 }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                    />
                </div>

                {/* Difficulty */}
                <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)} style={{ ...inputStyle, flex: '0 1 150px' }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}>
                    <option value="">All Difficulties</option>
                    {DIFFICULTY_LEVELS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>

                {/* Type */}
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inputStyle, flex: '0 1 140px' }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}>
                    <option value="">All Types</option>
                    <option value="PRACTICE">Practice</option>
                    <option value="GRADED">Graded</option>
                    <option value="SURVEY">Survey</option>
                </select>

                {/* Status */}
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, flex: '0 1 160px' }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}>
                    <option value="">All Statuses</option>
                    <option value="AVAILABLE">✅ Available</option>
                    <option value="COMPLETED">🏆 Completed</option>
                    <option value="MAX_ATTEMPTS_REACHED">🔒 Max Attempts</option>
                </select>

                {anyFilter && (
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                        Clear
                    </Button>
                )}
            </div>

            {/* QUIZ CARDS GRID */}
            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
                    {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filteredQuizzes.length === 0 ? (
                <EmptyState
                    icon={<BookOpen size={40} />}
                    title="No quizzes available"
                    description="Check back later for new quizzes or clear your filters"
                    action={{ label: 'Clear Filters', onClick: clearAll }}
                />
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
                        {filteredQuizzes.map(q => <QuizCard key={q.uuid} quiz={q} />)}
                    </div>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        onPageChange={p => setPage(p)}
                    />
                </>
            )}
        </div>
    );
}