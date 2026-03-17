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
        <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-4 py-3 font-semibold text-gray-600 whitespace-nowrap ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
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
                            <tr key={i} className="border-b border-gray-50">
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
                                className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-3.5 text-gray-700 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
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
