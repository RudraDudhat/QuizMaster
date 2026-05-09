import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
    label,
    name,
    options = [],
    error,
    hint,
    register,
    required,
    disabled,
    placeholder,
    id,
    className = '',
    ...rest
}) {
    const reactId = useId();
    const selectId = id ?? name ?? reactId;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={selectId}
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
                <select
                    id={selectId}
                    name={name}
                    disabled={disabled}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    aria-required={required || undefined}
                    className={`
                        w-full h-11 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] pl-3 pr-10 text-sm text-[var(--color-text-primary)]
                        appearance-none cursor-pointer
                        transition-all duration-150
                        focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[2px_2px_0_var(--color-primary)]
                        disabled:bg-[var(--color-bg-muted)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed
                        ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[2px_2px_0_var(--color-danger)]' : ''}
                        ${className}
                    `}
                    {...(register || {})}
                    {...rest}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt, index) => (
                        <option
                            key={opt?.value ?? `option-${index}`}
                            value={opt?.value}
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                />
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
