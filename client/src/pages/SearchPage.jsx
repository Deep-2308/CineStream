import PageTransition from '../components/common/PageTransition.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function SearchPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-txt">Search</h1>
        <p className="mb-8 text-txt-muted">Find movies by title, genre, or mood.</p>

        {/* Search bar placeholder */}
        <Skeleton className="mb-8 h-12 w-full max-w-xl rounded-card" />

        {/* Result skeletons */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-2 aspect-[2/3] w-full" />
              <Skeleton className="mb-1 h-4 w-3/4" />
            </div>
          ))}
        </div>

        <div className="mt-12">
          <EmptyState title="No results found" message="Try a different search query." />
        </div>
      </div>
    </PageTransition>
  );
}
