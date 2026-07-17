import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { interactionApi } from '../../services/interactionApi.js';
import { watchlistApi } from '../../services/watchlistApi.js';
import { queryKeys } from '../../lib/queryKeys.js';
import { useAuthStore } from '../../store/authStore.js';
import Button from '../ui/Button.jsx';

/**
 * WatchlistButton
 *
 * Toggles a movie in/out of the user's watchlist.
 *
 * @param {string} movieId
 * @param {'icon' | 'full'} size
 */
export default function WatchlistButton({ movieId, size = 'icon' }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch watchlist to determine initial state
  const { data } = useQuery({
    queryKey: queryKeys.watchlist.all(),
    queryFn: () => watchlistApi.getWatchlist(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const isSaved = data?.items?.some(item => 
    (typeof item === 'string' ? item : item._id) === movieId
  ) || false;

  const [optimisticSaved, setOptimisticSaved] = useState(isSaved);

  // Sync state when data changes (e.g. from other mutations)
  useEffect(() => {
    setOptimisticSaved(isSaved);
  }, [isSaved]);

  const mutation = useMutation({
    mutationFn: () => interactionApi.toggleWatchlist(movieId),
    onMutate: async () => {
      // Optimistic update
      setOptimisticSaved(!optimisticSaved);
    },
    onSuccess: () => {
      // Refresh cache
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(movieId) });
    },
    onError: () => {
      // Rollback
      setOptimisticSaved(isSaved);
    }
  });

  if (!isAuthenticated) return null;

  const handleClick = (e) => {
    e.preventDefault(); // prevent navigation if inside a Link (like PosterCard)
    e.stopPropagation();
    if (mutation.isPending) return;
    mutation.mutate();
  };

  if (size === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={mutation.isPending}
        aria-label={optimisticSaved ? "Remove from watchlist" : "Add to watchlist"}
        className={`p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 ${
          mutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Bookmark
          size={18}
          className={`${optimisticSaved ? 'fill-primary text-primary' : 'fill-transparent text-white'} transition-colors`}
        />
      </button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="lg"
      onClick={handleClick}
      disabled={mutation.isPending}
      className="gap-2 px-6"
    >
      <Bookmark
        size={20}
        className={`${optimisticSaved ? 'fill-primary text-primary' : 'fill-transparent text-current'} transition-colors`}
      />
      {optimisticSaved ? 'Saved' : 'Watchlist'}
    </Button>
  );
}
