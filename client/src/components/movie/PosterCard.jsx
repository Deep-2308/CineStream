import { memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { queryClient } from '../../lib/queryClient.js';
import { queryKeys } from '../../lib/queryKeys.js';
import { movieApi } from '../../services/movieApi.js';
import { posterUrl } from '../../lib/tmdbImage.js';
import { useCanHover } from '../../hooks/useCanHover.js';
import { useHoverIntent } from '../../hooks/useHoverIntent.js';
import { usePlayerStore } from '../../store/playerStore.js';
import Image from '../common/Image.jsx';

const PosterCard = memo(({ movie }) => {
  const canHover = useCanHover();
  const { activePreviewId, setActivePreview, stopAll } = usePlayerStore();

  // This card's preview is "live" when the store says so
  const isPreviewLive = canHover && activePreviewId === movie._id;

  // Clean up our own slot when unmounting
  useEffect(() => {
    return () => {
      if (usePlayerStore.getState().activePreviewId === movie._id) {
        stopAll();
      }
    };
  }, [movie._id, stopAll]);

  const { handlers } = useHoverIntent({
    prefetchDelay: 200,
    previewDelay:  500,
    onPrefetch: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.movies.detail(movie._id),
        queryFn:  () => movieApi.getById(movie._id),
        staleTime: 60_000,
      });
    },
    onPreview: () => {
      if (canHover) setActivePreview(movie._id);
    },
    onLeave: () => {
      // Only clear if we own the slot (don't clobber another card's preview)
      if (usePlayerStore.getState().activePreviewId === movie._id) {
        stopAll();
      }
    },
  });

  const url = posterUrl(movie.posterPath, 'w342');

  return (
    <Link
      to={`/movie/${movie._id}`}
      className="group block flex-shrink-0 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-card"
      style={{ width: 'var(--poster-width, 160px)' }}
      {...(canHover ? handlers : {})}
    >
      <motion.div
        className="w-full aspect-[2/3] rounded-card overflow-hidden bg-surface relative shadow-lg"
        whileHover={canHover ? { scale: 1.05 } : {}}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Image
          src={url}
          alt={movie.title}
          className="w-full h-full object-cover"
        />

        {/* Play Icon Overlay — appears after preview threshold */}
        <AnimatePresence>
          {isPreviewLive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { delay: 0 } }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-primary/90 rounded-full p-3 shadow-lg">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
});

PosterCard.displayName = 'PosterCard';

export default PosterCard;
