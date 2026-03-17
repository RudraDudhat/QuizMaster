import { format } from 'date-fns';

export function formatDate(instant) {
    if (!instant) return '';
    return format(new Date(instant), 'MMM d, yyyy');
}

export function formatDateTime(instant) {
    if (!instant) return '';
    return format(new Date(instant), "MMM d, yyyy 'at' h:mm a");
}

export function formatDuration(seconds) {
    if (seconds == null) return '';
    const s = Math.floor(seconds);
    if (s < 60) return `${s}s`;
    if (s < 3600) {
        const m = Math.floor(s / 60);
        const rem = s % 60;
        return `${m}m ${rem}s`;
    }
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    return `${h}h ${m}m ${rem}s`;
}

export function formatScore(obtained, total) {
    return `${obtained} / ${total}`;
}

export function formatPercentage(value) {
    if (value == null) return '';
    return `${value.toFixed(2)}%`;
}

export function getStatusColor(status) {
    switch (status) {
        case 'PUBLISHED':
        case 'AVAILABLE':
        case 'SUBMITTED':
        case 'PASSED':
            return 'success';
        case 'DRAFT':
        case 'UPCOMING':
        case 'IN_PROGRESS':
            return 'info';
        case 'ARCHIVED':
        case 'EXPIRED':
            return 'default';
        case 'AUTO_SUBMITTED':
            return 'warning';
        case 'INVALIDATED':
        case 'FAILED':
            return 'danger';
        default:
            return 'default';
    }
}

export function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}
