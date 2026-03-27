const variantClasses = {
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[color:var(--color-primary)]/20',
    success: 'bg-[color:var(--color-accent-green)]/15 text-[var(--color-success)] border-[color:var(--color-success)]/20',
    warning: 'bg-[color:var(--color-accent-orange)]/15 text-[var(--color-warning)] border-[color:var(--color-warning)]/20',
    danger: 'bg-[color:var(--color-danger)]/15 text-[var(--color-danger)] border-[color:var(--color-danger)]/20',
    info: 'bg-[color:var(--color-info)]/15 text-[var(--color-info)] border-[color:var(--color-info)]/20',
    default: 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] border-[color:var(--color-border)]/10',
};

const dotColors = {
    primary: 'bg-[var(--color-primary)]',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]',
    info: 'bg-[var(--color-info)]',
    default: 'bg-[var(--color-text-muted)]',
};

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
};

export default function Badge({ children, variant = 'default', size = 'md', dot = false }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border font-medium leading-none whitespace-nowrap ${variantClasses[variant]} ${sizeClasses[size]}`}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />}
            {children}
        </span>
    );
}
