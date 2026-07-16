import PageTransition from '../components/common/PageTransition.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function WatchlistPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-txt">My Watchlist</h1>
        <p className="mb-8 text-txt-muted">Movies you've saved to watch later.</p>
        <EmptyState title="Your watchlist is empty" message="Browse movies and add them to your watchlist." />
      </div>
    </PageTransition>
  );
}
