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
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    id={name}
                    name={name}
                    disabled={disabled}
                    className={`
            w-full h-10 rounded-lg border bg-white pl-3 pr-10 text-sm text-gray-900
            appearance-none cursor-pointer
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300'}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
}
