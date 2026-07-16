import { cn } from '../../lib/utils.js';

export default function Spinner({ className, size = 'md' }) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('flex items-center justify-center', className)}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-surface border-t-primary',
          sizeMap[size]
        )}
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
