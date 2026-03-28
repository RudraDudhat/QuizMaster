import { ChevronDown } from 'lucide-react';

export default function Select({
    label,
    name,
    options = [],
    error,
    register,
    required,
    disabled,
    placeholder,
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
            <div className="relative">
                <select
                    id={name}
                    name={name}
                    disabled={disabled}
                    className={`
                        w-full h-10 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] pl-3 pr-10 text-sm text-[var(--color-text-primary)]
            appearance-none cursor-pointer
            transition-all duration-150
                        focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20 focus:border-[var(--color-primary)]
                        disabled:bg-[var(--color-bg-soft)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed
                        ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[color:var(--color-danger)]/20' : ''}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                />
            </div>
            {error && <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{error}</p>}
        </div>
    );
}
