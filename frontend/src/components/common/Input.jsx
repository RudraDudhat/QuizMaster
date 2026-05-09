import { useId } from 'react';

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
    id,
    className = '',
    ...rest
}) {
    const reactId = useId();
    const inputId = id ?? name ?? reactId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5"
                >
                    {label}
                    {required && (
                        <span
                            className="text-[var(--color-danger)] ml-0.5"
                            aria-hidden="true"
                        >
                            *
                        </span>
                    )}
                </label>
            )}
            <div className="relative">
                {prefixIcon && (
                    <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                        aria-hidden="true"
                    >
                        {prefixIcon}
                    </span>
                )}
                <input
                    id={inputId}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    aria-required={required || undefined}
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
                    // No `pointer-events-none` here — `suffixIcon` is often an
                    // interactive element (eye toggle, clear button). Decorative
                    // icons should be plain SVGs that don't need event handlers.
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] flex items-center">
                        {suffixIcon}
                    </span>
                )}
            </div>
            {error && (
                <p
                    id={errorId}
                    className="mt-1.5 text-xs text-[var(--color-danger)] font-semibold"
                    role="alert"
                >
                    {error}
                </p>
            )}
            {!error && hint && (
                <p id={hintId} className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                    {hint}
                </p>
            )}
        </div>
    );
}
