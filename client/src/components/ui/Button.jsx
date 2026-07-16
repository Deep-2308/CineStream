import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

const variants = {
  primary:   'bg-primary text-txt hover:bg-primary/90 active:bg-primary/80',
  secondary: 'bg-secondary text-background hover:bg-secondary/90 active:bg-secondary/80',
  ghost:     'bg-transparent text-txt hover:bg-surface active:bg-surface/80',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  children,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card font-medium',
        'transition-colors duration-150 ease-out',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
