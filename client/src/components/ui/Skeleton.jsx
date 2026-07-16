import { cn } from '../../lib/utils.js';

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-card bg-surface', className)}
      {...props}
    />
  );
}
