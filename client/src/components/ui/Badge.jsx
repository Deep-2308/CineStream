import { cn } from '../../lib/utils.js';

const colorMap = {
  primary:   'bg-primary/20 text-primary',
  secondary: 'bg-secondary/20 text-secondary',
  default:   'bg-surface text-txt-muted',
};

export default function Badge({ variant = 'default', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
