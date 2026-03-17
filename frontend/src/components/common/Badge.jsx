const variantClasses = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
};

const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    default: 'bg-gray-400',
};

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
};

export default function Badge({ children, variant = 'default', size = 'md', dot = false }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border font-semibold leading-none whitespace-nowrap ${variantClasses[variant]} ${sizeClasses[size]}`}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />}
            {children}
        </span>
    );
}
