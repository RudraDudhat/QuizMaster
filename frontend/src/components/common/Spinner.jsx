const sizes = {
    sm: 'h-4 w-4 border-[2px]',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-[3px]',
};

export default function Spinner({ size = 'md', fullScreen = false, label }) {
    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-3 ${fullScreen ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50' : ''}`}>
            <div
                className={`${sizes[size]} rounded-full border-gray-200 border-t-primary animate-spin`}
            />
            {label && <p className="text-sm text-gray-500 font-medium">{label}</p>}
        </div>
    );
    return spinner;
}
