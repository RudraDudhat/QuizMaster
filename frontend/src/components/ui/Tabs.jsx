import { useId, useRef } from 'react';
// eslint-disable-next-line no-unused-vars -- `motion` is used as <motion.div> in JSX
import { motion } from 'framer-motion';

/**
 * Accessible tab list following the WAI-ARIA Authoring Practices.
 *
 * - Each tab has role="tab", aria-selected, tabindex follows the active tab
 * - Arrow keys move focus & selection (Home/End jump to first/last)
 * - Tab key moves focus out of the tablist (one stop in tab order)
 *
 * Tabs control the page above; consumers should render their panel
 * with role="tabpanel" and aria-labelledby={tab-id}.
 */
export default function Tabs({
    tabs = [],
    activeTab,
    onChange,
    variant = 'underline',
    ariaLabel,
}) {
    const idBase = useId();
    const listRef = useRef(null);

    const onKeyDown = (e) => {
        const enabled = tabs.filter((t) => !t.disabled);
        if (enabled.length === 0) return;
        const idx = enabled.findIndex((t) => t.key === activeTab);
        let nextKey = null;
        if (e.key === 'ArrowRight') {
            nextKey = enabled[(idx + 1 + enabled.length) % enabled.length].key;
        } else if (e.key === 'ArrowLeft') {
            nextKey = enabled[(idx - 1 + enabled.length) % enabled.length].key;
        } else if (e.key === 'Home') {
            nextKey = enabled[0].key;
        } else if (e.key === 'End') {
            nextKey = enabled[enabled.length - 1].key;
        }
        if (nextKey != null) {
            e.preventDefault();
            onChange(nextKey);
            // Move focus to the newly selected tab
            const el = listRef.current?.querySelector(`[id="${idBase}-tab-${nextKey}"]`);
            el?.focus();
        }
    };

    if (variant === 'pill') {
        return (
            <div
                ref={listRef}
                role="tablist"
                aria-label={ariaLabel}
                onKeyDown={onKeyDown}
                className="inline-flex items-center gap-1 p-1 bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] rounded-full shadow-[3px_3px_0_var(--color-border)]"
            >
                {tabs.map((tab) => {
                    const selected = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            id={`${idBase}-tab-${tab.key}`}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            aria-controls={`${idBase}-panel-${tab.key}`}
                            tabIndex={selected ? 0 : -1}
                            disabled={tab.disabled}
                            onClick={() => onChange(tab.key)}
                            className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${selected
                                ? 'text-[var(--color-text-inverse)]'
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                }`}
                        >
                            {selected && (
                                <motion.div
                                    layoutId="pill-bg"
                                    className="absolute inset-0 bg-[var(--color-primary)] rounded-full"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    aria-hidden="true"
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab.icon && (
                                    <span aria-hidden="true">{tab.icon}</span>
                                )}
                                {tab.label}
                                {tab.count != null && (
                                    <span className="text-xs bg-[color:var(--color-text-inverse)]/25 text-[var(--color-text-inverse)] px-1.5 py-0.5 rounded-full font-semibold">
                                        {tab.count}
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div
            ref={listRef}
            role="tablist"
            aria-label={ariaLabel}
            onKeyDown={onKeyDown}
            className="flex items-center gap-0 border-b-2 border-[var(--color-border)] overflow-x-auto"
        >
            {tabs.map((tab) => {
                const selected = activeTab === tab.key;
                return (
                    <button
                        key={tab.key}
                        id={`${idBase}-tab-${tab.key}`}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls={`${idBase}-panel-${tab.key}`}
                        tabIndex={selected ? 0 : -1}
                        disabled={tab.disabled}
                        onClick={() => onChange(tab.key)}
                        className={`relative px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${selected
                            ? 'text-[var(--color-primary)]'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            {tab.icon && (
                                <span aria-hidden="true">{tab.icon}</span>
                            )}
                            {tab.label}
                            {tab.count != null && (
                                <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${selected
                                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                        : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'
                                        }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </span>
                        {selected && (
                            <motion.div
                                layoutId="tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-primary)]"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                aria-hidden="true"
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
