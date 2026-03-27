export function SparkleIcon({ className = '', color = 'var(--color-accent-yellow)' }) {
    return (
        <svg
            className={className}
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M16 2L18.7 10.6L27.3 13.3L18.7 16L16 24.6L13.3 16L4.7 13.3L13.3 10.6L16 2Z"
                fill={color}
                stroke="var(--color-border)"
                strokeWidth="1.5"
            />
        </svg>
    );
}

export function Squiggle({ className = '', color = 'var(--color-primary)' }) {
    return (
        <svg
            className={className}
            width="120"
            height="20"
            viewBox="0 0 120 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M2 10C12 2 22 18 32 10C42 2 52 18 62 10C72 2 82 18 92 10C102 2 112 18 118 10"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function FloatingBadge({ text = 'Free+', className = '' }) {
    return (
        <span
            className={`inline-flex items-center px-3 py-1 text-xs font-extrabold text-[var(--color-text-inverse)] bg-[var(--color-text-primary)] rounded-full shadow-[2px_2px_0_var(--color-border)] ${className}`}
        >
            {text}
        </span>
    );
}
