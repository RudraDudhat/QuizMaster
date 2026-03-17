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
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                rows={rows}
                placeholder={placeholder}
                disabled={disabled}
                className={`
          w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900
          placeholder:text-gray-400 resize-y
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300'}
          ${className}
        `}
                {...(register || {})}
                {...rest}
            />
            {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
            {!error && hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
        </div>
    );
}
