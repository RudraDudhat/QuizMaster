import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dropdown({ trigger, items = [], align = 'right' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative inline-block" ref={ref}>
            <div onClick={() => setOpen((p) => !p)} className="cursor-pointer">
                {trigger}
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className={`absolute z-50 mt-2 w-52 bg-[var(--color-bg-card)] rounded-xl border border-[color:var(--color-border)]/20 shadow-lg py-1.5 max-h-72 overflow-y-auto ${align === 'right' ? 'right-0' : 'left-0'
                            }`}
                    >
                        {items.map((item, idx) => {
                            if (item.divider) {
                                return <div key={`d-${idx}`} className="my-1.5 border-t border-[color:var(--color-border)]/10" />;
                            }
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        item.onClick?.();
                                        setOpen(false);
                                    }}
                                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${item.danger
                                            ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]'
                                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-soft)]'
                                        }`}
                                >
                                    {item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
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
