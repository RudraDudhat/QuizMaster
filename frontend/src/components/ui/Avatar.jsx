const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
};

const onlineDotSize = {
    xs: 'w-1.5 h-1.5 border',
    sm: 'w-2 h-2 border',
    md: 'w-2.5 h-2.5 border-2',
    lg: 'w-3 h-3 border-2',
    xl: 'w-4 h-4 border-2',
};

const bgColors = [
    'bg-[var(--color-avatar-1)]',
    'bg-[var(--color-avatar-2)]',
    'bg-[var(--color-avatar-3)]',
    'bg-[var(--color-avatar-4)]',
    'bg-[var(--color-avatar-5)]',
    'bg-[var(--color-avatar-6)]',
    'bg-[var(--color-avatar-7)]',
    'bg-[var(--color-avatar-8)]',
];

function getInitials(name) {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function hashName(name) {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % bgColors.length;
}

export default function Avatar({ src, name, size = 'md', online = false }) {
    const initials = getInitials(name);
    const bg = bgColors[hashName(name)];

    return (
        <div className={`relative inline-flex items-center justify-center rounded-full flex-shrink-0 ${sizeClasses[size]}`}>
            {src ? (
                <img
                    src={src}
                    alt={name || 'Avatar'}
                    className={`rounded-full object-cover ${sizeClasses[size]}`}
                />
            ) : (
                <span className={`flex items-center justify-center rounded-full text-[var(--color-text-inverse)] font-semibold ${sizeClasses[size]} ${bg}`}>
                    {initials}
                </span>
            )}
            {online && (
                <span
                    className={`absolute bottom-0 right-0 rounded-full bg-[var(--color-success)] border-[var(--color-bg-card)] ${onlineDotSize[size]}`}
                />
            )}
        </div>
    );
}
