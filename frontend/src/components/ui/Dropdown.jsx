import { useEffect, useId, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- `motion` is used as <motion.div> in JSX
import { motion, AnimatePresence } from 'framer-motion';

export default function Dropdown({ trigger, items = [], align = 'right' }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const menuId = useId();

    // Close on outside click
    useEffect(() => {
        const onDown = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    // Keyboard handling — ESC closes, Arrow keys move within the menu
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
                return;
            }
            if (!menuRef.current) return;
            const items = Array.from(
                menuRef.current.querySelectorAll('[role="menuitem"]:not([disabled])')
            );
            if (items.length === 0) return;
            const idx = items.indexOf(document.activeElement);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                items[(idx + 1 + items.length) % items.length]?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                items[(idx - 1 + items.length) % items.length]?.focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                items[0]?.focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                items[items.length - 1]?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    // When the menu opens via keyboard, move focus to the first item
    useEffect(() => {
        if (!open || !menuRef.current) return;
        const first = menuRef.current.querySelector('[role="menuitem"]:not([disabled])');
        const frame = requestAnimationFrame(() => first?.focus());
        return () => cancelAnimationFrame(frame);
    }, [open]);

    const onTriggerKey = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
        }
    };

    return (
        <div className="relative inline-block" ref={wrapperRef}>
            <button
                type="button"
                ref={triggerRef}
                onClick={() => setOpen((p) => !p)}
                onKeyDown={onTriggerKey}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                className="cursor-pointer rounded-full"
            >
                {trigger}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        id={menuId}
                        ref={menuRef}
                        role="menu"
                        data-lenis-prevent
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{ zIndex: 'var(--z-dropdown)' }}
                        className={`absolute mt-2 w-52 bg-[var(--color-bg-card)] rounded-xl border border-[color:var(--color-border)]/20 shadow-lg py-1.5 max-h-72 overflow-y-auto overscroll-contain ${align === 'right' ? 'right-0' : 'left-0'
                            }`}
                    >
                        {items.map((item, idx) => {
                            if (item.divider) {
                                return (
                                    <div
                                        key={`d-${idx}`}
                                        role="separator"
                                        aria-orientation="horizontal"
                                        className="my-1.5 border-t border-[color:var(--color-border)]/10"
                                    />
                                );
                            }
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    role="menuitem"
                                    disabled={item.disabled}
                                    onClick={() => {
                                        item.onClick?.();
                                        setOpen(false);
                                        triggerRef.current?.focus();
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${item.danger
                                        ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-text-primary)]'
                                        }`}
                                >
                                    {item.icon && (
                                        <span className="flex-shrink-0 opacity-70" aria-hidden="true">
                                            {item.icon}
                                        </span>
                                    )}
                                    {item.label}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
