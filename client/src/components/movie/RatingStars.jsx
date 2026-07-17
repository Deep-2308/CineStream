import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { interactionApi } from '../../services/interactionApi.js';
import { queryKeys } from '../../lib/queryKeys.js';
import { useAuthStore } from '../../store/authStore.js';

/**
 * RatingStars
 *
 * 1–5 star interactive rating component.
 * Keyboard accessible (radiogroup).
 * Optimistically updates UI and fires React Query invalidation on success.
 */
export default function RatingStars({ movieId, initialRating = 0, onRatingChange }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Internal state is 1-5 (stars)
  // Backend stores 1-10, so if initialRating is from backend, it might be 1-10.
  // The prompt said rateMovie accepts 1-5, but the movie aggregate might be 1-10.
  // Let's assume initialRating passed here is already scaled to 1-5 if it represents the user's rating.
  // Actually, we don't fetch the user's specific past rating from the API separately right now,
  // we just start at 0. If we had it, it would be 1-5 here.
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(initialRating);

  const mutation = useMutation({
    mutationFn: (rating) => interactionApi.rateMovie(movieId, rating),
    onMutate: async (newRating) => {
      // Optimistic update
      setSelected(newRating);
    },
    onSuccess: (data, newRating) => {
      // Invalidate queries so recommendations and movie detail (averages) refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(movieId) });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.recommendations.home(user.id) });
      }
      onRatingChange?.(newRating);
    },
    onError: () => {
      // Rollback
      setSelected(initialRating);
    }
  });

  const handleSelect = useCallback((rating) => {
    if (mutation.isPending) return;
    mutation.mutate(rating);
  }, [mutation]);

  const handleKeyDown = (e, rating) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(rating);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleSelect(Math.min(5, rating + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleSelect(Math.max(1, rating - 1));
    }
  };

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Rate movie"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hovered || selected) >= star;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={selected === star}
            aria-label={`Rate ${star} stars`}
            disabled={mutation.isPending}
            onClick={() => handleSelect(star)}
            onMouseEnter={() => setHovered(star)}
            onKeyDown={(e) => handleKeyDown(e, star)}
            className={`p-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 ${
              mutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              size={24}
              className={`${
                isFilled ? 'text-secondary fill-secondary' : 'text-surface-light fill-transparent'
              } transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
}
