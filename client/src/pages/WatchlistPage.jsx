import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys.js';
import { watchlistApi } from '../services/watchlistApi.js';
import PageTransition from '../components/common/PageTransition.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PosterCard from '../components/movie/PosterCard.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

export default function WatchlistPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.watchlist.all(),
    queryFn: () => watchlistApi.getWatchlist(),
  });

  const items = data?.items || [];

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <h1 className="mb-2 text-3xl font-bold text-txt">My Watchlist</h1>
        <p className="mb-8 text-txt-muted">Movies you've saved to watch later.</p>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-card" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-card bg-surface/50 p-8 text-center border border-surface">
            <p className="text-error">Failed to load watchlist. Please try again later.</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="Your watchlist is empty" message="Browse movies and add them to your watchlist." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((movie) => (
              <div key={movie._id} className="relative">
                {/* PosterCard natively includes the overlay WatchlistButton which functions as removal here */}
                <PosterCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
