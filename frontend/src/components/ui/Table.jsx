import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import { Inbox } from 'lucide-react';

export default function Table({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'No data found',
    emptyIcon,
}) {
    return (
        <div className="w-full overflow-x-auto rounded-[20px] border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[5px_5px_0_var(--color-border)]">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b-2 border-[var(--color-border)] bg-[var(--color-primary-light)]">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[var(--color-text-primary)] whitespace-nowrap ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                    }`}
                                style={col.width ? { width: col.width } : undefined}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-[color:var(--color-border)]/10">
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-3.5">
                                        <div className="skeleton h-4 w-3/4 rounded" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length}>
                                <EmptyState
                                    icon={emptyIcon || <Inbox size={48} />}
                                    title={emptyMessage}
                                />
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr
                                key={row.uuid || row.id || idx}
                                className="border-b border-[color:var(--color-border)]/10 last:border-b-0 hover:bg-[color:var(--color-primary-light)]/40 transition-colors"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-3.5 text-[var(--color-text-secondary)] ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                            }`}
                                    >
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
