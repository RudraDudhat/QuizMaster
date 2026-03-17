import Spinner from './Spinner';

const variantClasses = {
    primary:
        'bg-primary text-white shadow-sm hover:bg-primary-hover active:shadow-none',
    secondary:
        'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
    danger:
        'bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700',
    ghost:
        'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
    outline:
        'bg-white border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100',
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
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-150 cursor-pointer select-none
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1
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
