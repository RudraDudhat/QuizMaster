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
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <div className="relative">
                {prefixIcon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
            w-full h-10 rounded-lg border bg-white text-sm text-gray-900
            placeholder:text-gray-400
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${prefixIcon ? 'pl-10' : 'pl-3'}
            ${suffixIcon ? 'pr-10' : 'pr-3'}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300'}
            ${className}
          `}
                    {...(register || {})}
                    {...rest}
                />
                {suffixIcon && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {suffixIcon}
                    </span>
                )}
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
            {!error && hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
        </div>
    );
}
