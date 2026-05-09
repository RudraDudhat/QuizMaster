import { useId } from 'react';

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
            <textarea
                id={inputId}
                name={name}
                rows={rows}
                placeholder={placeholder}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                aria-required={required || undefined}
                className={`
                    w-full rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2.5 text-sm text-[var(--color-text-primary)]
                    placeholder:text-[var(--color-text-muted)] resize-y
                    transition-all duration-150
                    focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[2px_2px_0_var(--color-primary)]
                    disabled:bg-[var(--color-bg-muted)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed
                    ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[2px_2px_0_var(--color-danger)]' : ''}
                    ${className}
                `}
                {...(register || {})}
                {...rest}
            />
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
