import { Film } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', message = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Film className="mb-4 h-16 w-16 text-txt-muted" />
      <h3 className="mb-2 text-xl font-semibold text-txt">{title}</h3>
      {message && <p className="max-w-md text-txt-muted">{message}</p>}
    </div>
  );
}
