// eslint-disable-next-line no-unused-vars -- `motion` is used as <motion.div> in JSX
import { motion } from 'framer-motion';

const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

const shadowClasses = {
    none: '',
    sm: 'shadow-[5px_5px_0_var(--color-border)]',
    md: 'shadow-[6px_6px_0_var(--color-border)]',
    lg: 'shadow-[7px_7px_0_var(--color-border)]',
};

/**
 * Brutalist card surface.
 *
 * - `hover` shows a subtle lift on hover (presentational only)
 * - `onClick` makes the card interactive — adds keyboard support
 *   (Enter / Space) and exposes role="button"
 * - `as="article"` (etc.) escapes the default div for semantic regions
 */
export default function Card({
    children,
    padding = 'md',
    shadow = 'sm',
    hover = false,
    onClick,
    ariaLabel,
    className = '',
}) {
    const interactive = typeof onClick === 'function';
    const Component = hover || interactive ? motion.div : 'div';
    const motionProps =
        hover || interactive
            ? {
                whileHover: { y: -4, boxShadow: '7px 7px 0px var(--color-border)' },
                transition: { duration: 0.15 },
            }
            : {};

    const interactiveProps = interactive
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-label': ariaLabel,
            onClick,
            onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(e);
                }
            },
        }
        : {};

    return (
        <Component
            className={`
                bg-[var(--color-bg-card)] rounded-[20px] border-2 border-[var(--color-border)]
                ${paddingClasses[padding]}
                ${shadowClasses[shadow]}
                ${interactive ? 'cursor-pointer focus:outline-none' : ''}
                ${className}
            `}
            {...motionProps}
            {...interactiveProps}
        >
            {children}
        </Component>
    );
}
