import PageTransition from '../components/common/PageTransition.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function HomePage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-txt">Home</h1>
        <p className="mb-8 text-txt-muted">Discover trending movies, personalized recommendations, and more.</p>

        {/* Skeleton example */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-txt">Loading State</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-2 aspect-[2/3] w-full" />
                <Skeleton className="mb-1 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </section>

        {/* Spinner example */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-txt">Spinner</h2>
          <Spinner />
        </section>

        {/* Empty state example */}
        <section className="mb-12">
          <EmptyState title="No recommendations yet" message="Start rating movies to get personalized picks." />
        </section>

        {/* Error state example */}
        <section className="mb-12">
          <ErrorState
            title="Failed to load movies"
            message="The server might be unavailable."
            onRetry={() => window.location.reload()}
          />
        </section>
      </div>
    </PageTransition>
  );
}
