import { motion } from 'framer-motion';

const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
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
                whileHover: { y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' },
                transition: { duration: 0.2 },
            }
            : {};

    return (
        <Component
            onClick={onClick}
            className={`
        bg-white rounded-xl border border-gray-200
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
