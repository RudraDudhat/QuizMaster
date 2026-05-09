import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPageNumbers(current, total) {
    const pages = [];
    if (total <= 7) {
        for (let i = 0; i < total; i++) pages.push(i);
        return pages;
    }
    pages.push(0);
    if (current > 2) pages.push('...');
    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 3) pages.push('...');
    pages.push(total - 1);
    return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange, totalElements }) {
    if (totalPages <= 1) return null;

    const pages = getPageNumbers(currentPage, totalPages);

    return (
        <nav
            aria-label="Pagination"
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4"
        >
            {totalElements != null ? (
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Showing{' '}
                    <span className="font-medium text-[var(--color-text-primary)]">
                        {totalElements}
                    </span>{' '}
                    results
                </p>
            ) : (
                <div />
            )}

            <div className="flex items-center gap-1 self-center sm:self-auto">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    aria-label="Previous page"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                >
                    <ChevronLeft size={16} aria-hidden="true" />
                </button>

                {pages.map((page, idx) =>
                    page === '...' ? (
                        <span
                            key={`ellipsis-${idx}`}
                            className="w-9 h-9 flex items-center justify-center text-sm text-[var(--color-text-muted)]"
                            aria-hidden="true"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            aria-label={`Page ${page + 1}`}
                            aria-current={page === currentPage ? 'page' : undefined}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                page === currentPage
                                    ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-sm'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]'
                            }`}
                        >
                            {page + 1}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    aria-label="Next page"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                >
                    <ChevronRight size={16} aria-hidden="true" />
                </button>
            </div>
        </nav>
    );
}
