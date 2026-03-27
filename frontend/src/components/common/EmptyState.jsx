import Button from './Button';

export default function EmptyState({ icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {icon && (
                <div className="text-[color:var(--color-text-muted)]/60 mb-4">
                    <span className="text-5xl">{icon}</span>
                </div>
            )}
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">{description}</p>
            )}
            {action && (
                <Button variant="primary" size="sm" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}
