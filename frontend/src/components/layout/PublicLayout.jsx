export default function PublicLayout({ children }) {
    return (
        <div className="min-h-screen bg-[var(--color-bg-page)]">
            {children}
        </div>
    );
}
