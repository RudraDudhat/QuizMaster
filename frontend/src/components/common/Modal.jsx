import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
// eslint-disable-next-line no-unused-vars -- `motion` is used as <motion.div> in JSX
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const sizeClasses = {
    sm: 'max-w-[400px]',
    md: 'max-w-[560px]',
    lg: 'max-w-[720px]',
    xl: 'max-w-[900px]',
};

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    footer,
    closeOnBackdrop = true,
    ariaLabel,
}) {
    const titleId = useId();
    const panelRef = useRef(null);
    const previouslyFocusedRef = useRef(null);

    // Body scroll lock + esc handler + focus management
    useEffect(() => {
        if (!isOpen) return;

        previouslyFocusedRef.current = document.activeElement;
        document.body.classList.add('modal-open');

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
                return;
            }

            if (e.key !== 'Tab' || !panelRef.current) return;

            // Focus trap: cycle Tab within the modal
            const focusables = Array.from(
                panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
            ).filter((el) => !el.hasAttribute('aria-hidden'));

            if (focusables.length === 0) {
                e.preventDefault();
                panelRef.current.focus();
                return;
            }

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;

            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        // Move initial focus into the dialog (panel itself for screen readers)
        const moveFocus = () => {
            if (!panelRef.current) return;
            const firstFocusable = panelRef.current.querySelector(FOCUSABLE_SELECTOR);
            (firstFocusable ?? panelRef.current).focus();
        };
        const focusFrame = requestAnimationFrame(moveFocus);

        return () => {
            cancelAnimationFrame(focusFrame);
            document.body.classList.remove('modal-open');
            window.removeEventListener('keydown', onKeyDown);
            // Restore focus to the trigger element that opened the modal
            const prev = previouslyFocusedRef.current;
            if (prev && typeof prev.focus === 'function') {
                prev.focus();
            }
        };
    }, [isOpen, onClose]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center p-4"
                    style={{ zIndex: 'var(--z-modal)' }}
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
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? titleId : undefined}
                        aria-label={!title ? ariaLabel : undefined}
                        tabIndex={-1}
                        className={`relative w-full ${sizeClasses[size]} bg-[var(--color-bg-card)] rounded-2xl border-2 border-[var(--color-border)] shadow-[6px_6px_0_var(--color-border)] z-10 outline-none`}
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b-2 border-[var(--color-border)]">
                                <h3
                                    id={titleId}
                                    className="text-lg font-extrabold text-[var(--color-text-primary)] truncate"
                                >
                                    {title}
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close dialog"
                                    className="p-1.5 rounded-full border-2 border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)] transition-colors flex-shrink-0"
                                >
                                    <X size={18} aria-hidden="true" />
                                </button>
                            </div>
                        )}

                        {/* Body */}
                        <div
                            data-lenis-prevent
                            className="px-6 py-5 max-h-[calc(100vh-220px)] overflow-y-auto overscroll-contain"
                        >
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 px-6 py-4 border-t-2 border-[var(--color-border)] bg-[var(--color-bg-subtle)] rounded-b-2xl">
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
