import { motion } from 'framer-motion';

export default function Tabs({ tabs = [], activeTab, onChange, variant = 'underline' }) {
    if (variant === 'pill') {
        return (
            <div className="inline-flex items-center gap-1 p-1 bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] rounded-full shadow-[3px_3px_0_var(--color-border)]">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-150 ${activeTab === tab.key
                            ? 'text-[var(--color-text-inverse)]'
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        {activeTab === tab.key && (
                            <motion.div
                                layoutId="pill-bg"
                                className="absolute inset-0 bg-[var(--color-primary)] rounded-full"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {tab.icon}
                            {tab.label}
                            {tab.count != null && (
                                <span className="text-xs bg-[color:var(--color-text-inverse)]/25 text-[var(--color-text-inverse)] px-1.5 py-0.5 rounded-full font-semibold">
                                    {tab.count}
                                </span>
                            )}
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-0 border-b-2 border-[var(--color-border)]">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`relative px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab.key
                            ? 'text-[var(--color-primary)]'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        {tab.icon}
                        {tab.label}
                        {tab.count != null && (
                            <span
                                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === tab.key
                                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                        : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'
                                    }`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </span>
                    {activeTab === tab.key && (
                        <motion.div
                            layoutId="tab-underline"
                            className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-primary)]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
