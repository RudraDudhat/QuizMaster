const sizes = {
    sm: 'h-4 w-4 border-[2px]',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-[3px]',
};

export default function Spinner({ size = 'md', fullScreen = false, label }) {
    const wrapperClass = fullScreen
        ? 'fixed inset-0 bg-[color:var(--color-bg-card)]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3'
        : 'inline-flex flex-col items-center justify-center gap-3';

    return (
        <div
            className={wrapperClass}
            style={fullScreen ? { zIndex: 'var(--z-modal)' } : undefined}
            role="status"
            aria-live="polite"
        >
            <div
                className={`${sizes[size]} rounded-full border-[color:var(--color-border)]/15 border-t-[var(--color-primary)] animate-spin`}
                aria-hidden="true"
            />
            {label && (
                <p className="text-sm text-[var(--color-text-secondary)] font-medium">{label}</p>
            )}
            <span className="sr-only-not-focusable">{label ?? 'Loading'}</span>
        </div>
    );
}
