import PageTransition from '../components/common/PageTransition.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

export default function MovieDetailPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-txt">Movie Details</h1>
        <p className="mb-8 text-txt-muted">Full movie information, trailer, and similar recommendations.</p>
        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          <Skeleton className="aspect-[2/3] w-full rounded-card" />
          <div>
            <Skeleton className="mb-4 h-8 w-2/3" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="mt-6 h-10 w-32" />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
