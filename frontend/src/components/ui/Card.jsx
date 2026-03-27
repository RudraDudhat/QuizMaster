import { motion } from 'framer-motion';

const paddingClasses = {
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

export default function Card({
    children,
    padding = 'md',
    shadow = 'sm',
    hover = false,
    onClick,
    className = '',
}) {
    const Component = hover || onClick ? motion.div : 'div';
    const motionProps =
        hover || onClick
            ? {
                whileHover: { y: -4, boxShadow: '7px 7px 0px var(--color-border)' },
                transition: { duration: 0.15 },
            }
            : {};

    return (
        <Component
            onClick={onClick}
            className={`
                bg-[var(--color-bg-card)] rounded-[20px] border-2 border-[var(--color-border)]
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
            {...motionProps}
        >
            {children}
        </Component>
    );
}
