export default function Input({
    label,
    name,
    type = 'text',
    placeholder,
    error,
    register,
    required,
    disabled,
    prefixIcon,
    suffixIcon,
    hint,
    className = '',
    ...rest
}) {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={name} className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
                    {label}
                    {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
                </label>
            )}
            <div className="relative">
                {prefixIcon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
                        {prefixIcon}
                    </span>
                )}
                <input
                    id={name}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
            w-full h-11 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] text-sm text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-muted)]
            transition-all duration-150
            focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[2px_2px_0_var(--color-primary)]
            disabled:bg-[var(--color-bg-muted)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed
            ${prefixIcon ? 'pl-10' : 'pl-3'}
            ${suffixIcon ? 'pr-10' : 'pr-3'}
            ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[2px_2px_0_var(--color-danger)]' : ''}
            ${className}
          `}
                    {...(register || {})}
                    {...rest}
                />
                {suffixIcon && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
                        {suffixIcon}
                    </span>
                )}
            </div>
                {error && <p className="mt-1.5 text-xs text-[var(--color-danger)] font-semibold">{error}</p>}
                {!error && hint && <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{hint}</p>}
        </div>
    );
}
