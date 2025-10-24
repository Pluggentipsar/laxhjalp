import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type CardProps = Omit<HTMLMotionProps<'div'>, 'ref'> & {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, hover = false, padding = 'md', className = '', ...props },
    ref
  ) => {
    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const baseStyles = `card ${paddingStyles[padding]} ${className}`;

    return (
      <motion.div
        ref={ref}
        className={baseStyles}
        whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
        whileTap={hover ? { scale: 0.98 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
