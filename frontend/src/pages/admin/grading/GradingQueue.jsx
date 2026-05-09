import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Hourglass, ClipboardList, ArrowRight, User, BookOpen, Mail,
} from 'lucide-react';
import { getPendingReviews } from '../../../api/grading.api';
import { formatDateTime } from '../../../utils/formatters';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';
import Button from '../../../components/common/Button';

export default function GradingQueue() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-grading-pending', page],
        queryFn: () => getPendingReviews({ page, size: 20 }),
        staleTime: 30_000,
        keepPreviousData: true,
    });

    const items = response?.data?.content ?? [];
    const totalPages = response?.data?.totalPages ?? 0;
    const totalElements = response?.data?.totalElements ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)]">
                            Essay Grading
                        </h1>
                        {totalElements > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-[var(--color-warning)] text-[var(--color-text-primary)] border-2 border-[var(--color-border)] shadow-[2px_2px_0_var(--color-border)]">
                                <Hourglass size={13} aria-hidden="true" />
                                {totalElements} pending
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                        Attempts containing essay answers that need your review.
                    </p>
                </div>
            </div>

            {/* Queue */}
            {!isLoading && items.length === 0 ? (
                <Card padding="lg" className="bg-[var(--color-block-cream)]">
                    <EmptyState
                        icon={<ClipboardList size={48} aria-hidden="true" />}
                        title="Nothing to grade — nice work"
                        description="Essay answers awaiting grading will appear here."
                    />
                </Card>
            ) : (
                <div className="space-y-3">
                    {isLoading
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="skeleton h-[88px] rounded-[20px] border-2 border-[var(--color-border)]"
                            />
                        ))
                        : items.map((item) => (
                            <Card key={item.attemptUuid} padding="md" hover className="bg-[var(--color-bg-card)]">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen size={16} className="text-[var(--color-primary)] flex-shrink-0" aria-hidden="true" />
                                            <h3 className="text-base font-extrabold text-[var(--color-text-primary)] truncate">
                                                {item.quizTitle}
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                                            <span className="inline-flex items-center gap-1.5">
                                                <User size={12} aria-hidden="true" />
                                                <strong className="text-[var(--color-text-primary)]">{item.studentName}</strong>
                                            </span>
                                            <span className="inline-flex items-center gap-1.5">
                                                <Mail size={12} aria-hidden="true" />
                                                {item.studentEmail}
                                            </span>
                                            <span>
                                                Submitted {formatDateTime(item.submittedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--color-warning-soft)] text-[var(--color-warning)] border border-[var(--color-warning)]">
                                            <Hourglass size={12} aria-hidden="true" />
                                            {item.pendingCount} of {item.totalQuestions} pending
                                        </span>
                                        <Button
                                            size="sm"
                                            icon={<ArrowRight size={14} />}
                                            onClick={() => navigate(`/admin/grading/${item.attemptUuid}`)}
                                        >
                                            Review
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                </div>
            )}

            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}
