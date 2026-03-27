const sizes = {
    sm: 'h-4 w-4 border-[2px]',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-[3px]',
};

export default function Spinner({ size = 'md', fullScreen = false, label }) {
    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-3 ${fullScreen ? 'fixed inset-0 bg-[color:var(--color-bg-card)]/80 backdrop-blur-sm z-50' : ''}`}>
            <div
                className={`${sizes[size]} rounded-full border-[color:var(--color-border)]/15 border-t-[var(--color-primary)] animate-spin`}
            />
            {label && <p className="text-sm text-[var(--color-text-secondary)] font-medium">{label}</p>}
        </div>
    );
    return spinner;
}
