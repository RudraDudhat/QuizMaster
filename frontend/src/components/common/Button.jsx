import Spinner from './Spinner';

const variantClasses = {
    primary:
        'bg-[var(--color-primary)] text-[var(--color-text-inverse)] border-2 border-[var(--color-border)] shadow-[3px_3px_0_var(--color-border)] hover:brightness-90 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
    secondary:
        'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border-2 border-[var(--color-border)] shadow-[3px_3px_0_var(--color-border)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
    danger:
        'bg-[var(--color-danger)] text-[var(--color-text-inverse)] border-2 border-[var(--color-border)] shadow-[3px_3px_0_var(--color-border)] hover:brightness-95 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
    ghost:
        'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)] active:scale-95',
    outline:
        'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border-2 border-[var(--color-border)] shadow-[3px_3px_0_var(--color-border)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
};

const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-4 py-2 h-10 gap-2',
    lg: 'text-base px-6 py-2.5 h-12 gap-2.5',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    onClick,
    type = 'button',
    icon,
    className = '',
    ...rest
}) {
    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={`
        inline-flex items-center justify-center font-semibold rounded-full
        transition-all duration-150 cursor-pointer select-none
        focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-opacity-30 focus:ring-offset-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 !cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `}
            {...rest}
        >
            {loading ? (
                <Spinner size="sm" />
            ) : icon ? (
                <span className="flex-shrink-0">{icon}</span>
            ) : null}
            {children}
        </button>
    );
}
