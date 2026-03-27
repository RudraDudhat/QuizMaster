export default function Textarea({
    label,
    name,
    placeholder,
    error,
    register,
    required,
    disabled,
    hint,
    rows = 4,
    className = '',
    ...rest
}) {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    {label}
                    {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                rows={rows}
                placeholder={placeholder}
                disabled={disabled}
                className={`
                    w-full rounded-lg border bg-[var(--color-bg-card)] px-3 py-2.5 text-sm text-[var(--color-text-primary)]
                    placeholder:text-[var(--color-text-muted)] resize-y
          transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20 focus:border-[var(--color-primary)]
                    disabled:bg-[var(--color-bg-soft)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed
                    ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[color:var(--color-danger)]/20' : 'border-[color:var(--color-border)]/30'}
          ${className}
        `}
                {...(register || {})}
                {...rest}
            />
                        {error && <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{error}</p>}
                        {!error && hint && <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{hint}</p>}
        </div>
    );
}
