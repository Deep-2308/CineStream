import PageTransition from '../components/common/PageTransition.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

export default function OriginalsPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-txt">CineStream Originals</h1>
        <p className="mb-8 text-txt-muted">Exclusive content produced by CineStream.</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-3 aspect-video w-full rounded-card" />
              <Skeleton className="mb-1 h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
