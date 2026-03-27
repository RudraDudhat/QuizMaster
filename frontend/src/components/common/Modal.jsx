import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const sizeClasses = {
    sm: 'max-w-[400px]',
    md: 'max-w-[560px]',
    lg: 'max-w-[720px]',
    xl: 'max-w-[900px]',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    footer,
    closeOnBackdrop = true,
}) {
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        const onEsc = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onEsc);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onEsc);
        };
    }, [isOpen, onClose]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-[color:var(--color-overlay)]"
                        onClick={closeOnBackdrop ? onClose : undefined}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Panel */}
                    <motion.div
                        className={`relative w-full ${sizeClasses[size]} bg-[var(--color-bg-card)] rounded-2xl border-2 border-[var(--color-border)] shadow-[6px_6px_0_var(--color-border)] z-10`}
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--color-border)]">
                            <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-full border-2 border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 max-h-[calc(100vh-220px)] overflow-y-auto">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-[var(--color-border)] bg-[var(--color-bg-subtle)] rounded-b-2xl">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
