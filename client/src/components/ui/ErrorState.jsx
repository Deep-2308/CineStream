import { AlertTriangle } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again later.',
  onRetry
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="mb-4 h-16 w-16 text-primary" />
      <h3 className="mb-2 text-xl font-semibold text-txt">{title}</h3>
      <p className="mb-6 max-w-md text-txt-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
