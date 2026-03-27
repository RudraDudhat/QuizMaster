import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, Search, X, ClipboardList, Eye, FileText,
    CheckCircle2, XCircle, MoreVertical,
} from 'lucide-react';
import { getAttemptHistory } from '../../../api/attempt.api';
import {
    formatScore, formatPercentage, formatDuration,
    formatDate, formatDateTime, getStatusColor, truncateText,
} from '../../../utils/formatters';
import Table from '../../../components/ui/Table';
import Dropdown from '../../../components/ui/Dropdown';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'AUTO_SUBMITTED', label: 'Auto Submitted' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'INVALIDATED', label: 'Invalidated' },
];

function MiniProgressBar({ pct }) {
    const color = pct >= 70 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
    return (
        <div style={{ height: 4, background: 'var(--color-bg-muted)', borderRadius: 4, overflow: 'hidden', width: 80, marginTop: 4 }}>
            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
    );
}

export default function AttemptHistory() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    const { data: response, isLoading } = useQuery({
        queryKey: ['attempt-history', page],
        queryFn: () => getAttemptHistory({ page, size: 20 }),
        staleTime: 30_000,
        keepPreviousData: true,
    });

    const attempts = response?.data?.content ?? [];
    const totalPages = response?.data?.totalPages ?? 0;
    const totalElements = response?.data?.totalElements ?? 0;

    const filteredAttempts = attempts
        .filter(a => statusFilter ? a.status === statusFilter : true)
        .filter(a => search ? a.quizTitle?.toLowerCase().includes(search.toLowerCase()) : true);

    const passedCount = filteredAttempts.filter(a => a.isPassed).length;
    const failedCount = filteredAttempts.filter(a => !a.isPassed).length;
    const hasFilters = statusFilter || search;

    const columns = [
        {
            key: 'quiz',
            label: 'Quiz',
            render: (row) => (
                <div
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/student/results/${row.attemptUuid}`)}
                >
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 2, transition: 'color 0.15s' }}>
                        {truncateText(row.quizTitle, 40)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Attempt #{row.attemptNumber}</div>
                </div>
            ),
        },
        {
            key: 'score',
            label: 'Score',
            render: (row) => (
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {formatScore(row.marksObtained, row.totalMarksPossible)}
                    </div>
                    <MiniProgressBar pct={row.percentage ?? 0} />
                </div>
            ),
        },
        {
            key: 'percentage',
            label: 'Percentage',
            align: 'center',
            render: (row) => {
                const pct = row.percentage ?? 0;
                const color = pct >= 70 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
                return <span style={{ fontSize: 14, fontWeight: 700, color }}>{formatPercentage(pct)}</span>;
            },
        },
        {
            key: 'result',
            label: 'Result',
            align: 'center',
            render: (row) => row.isPassed
                ? <Badge variant="success">✅ Passed</Badge>
                : <Badge variant="danger">❌ Failed</Badge>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <Badge variant={getStatusColor(row.status)}>{row.status}</Badge>,
        },
        {
            key: 'timeTaken',
            label: 'Time Taken',
            render: (row) => (
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {row.timeTakenSeconds ? formatDuration(row.timeTakenSeconds) : '—'}
                </span>
            ),
        },
        {
            key: 'date',
            label: 'Date',
            render: (row) => (
                <div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
                        {row.submittedAt ? formatDate(row.submittedAt) : (
                            <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>In Progress</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            align: 'center',
            width: 48,
            render: (row) => {
                const canReview = row.status === 'SUBMITTED' || row.status === 'AUTO_SUBMITTED';
                return (
                    <Dropdown
                        trigger={
                            <button style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                                <MoreVertical size={15} />
                            </button>
                        }
                        items={[
                            {
                                label: 'View Result',
                                icon: <Eye size={14} />,
                                onClick: () => navigate(`/student/results/${row.attemptUuid}`),
                            },
                            ...(canReview ? [{
                                label: 'Review Answers',
                                icon: <FileText size={14} />,
                                onClick: () => navigate(`/student/results/${row.attemptUuid}/review`),
                            }] : []),
                        ]}
                    />
                );
            },
        },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)', paddingBottom: 48 }}>
            <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* ── Header ── */}
            <div style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => navigate('/student/dashboard')} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>My History</h1>
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                                {totalElements} total attempt{totalElements !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'var(--color-success-soft)', fontSize: 12, fontWeight: 700, color: 'var(--color-success)' }}>
                            <CheckCircle2 size={13} /> {passedCount} Passed
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'var(--color-danger-soft)', fontSize: 12, fontWeight: 700, color: 'var(--color-danger)' }}>
                            <XCircle size={13} /> {failedCount} Failed
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', animation: 'fadeUp 0.3s ease' }}>

                {/* ── Filters ── */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 220px' }}>
                        <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by quiz name..."
                            style={{ width: '100%', height: 40, paddingLeft: 34, paddingRight: 12, border: '1.5px solid var(--color-border)', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', transition: 'border-color 0.15s' }}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ height: 40, padding: '0 12px', border: '1.5px solid var(--color-border)', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', cursor: 'pointer', flex: '0 0 180px' }}
                    >
                        {STATUS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    {/* Clear */}
                    {hasFilters && (
                        <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => { setSearch(''); setStatusFilter(''); }}>
                            Clear
                        </Button>
                    )}
                </div>

                {/* ── Table ── */}
                {filteredAttempts.length === 0 && !isLoading ? (
                    <div style={{ background: 'var(--color-bg-card)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
                        <EmptyState
                            icon={<ClipboardList size={48} />}
                            title={hasFilters ? 'No results match your filters' : 'No attempts yet'}
                            description={hasFilters ? 'Try adjusting your search or filter.' : 'Take your first quiz to see your history here.'}
                            action={!hasFilters ? { label: 'Browse Quizzes', onClick: () => navigate('/student/quizzes') } : undefined}
                        />
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        data={filteredAttempts}
                        loading={isLoading}
                    />
                )}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div style={{ marginTop: 16 }}>
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalElements={totalElements}
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
