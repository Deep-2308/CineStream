import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PosterCard from './PosterCard.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { useCanHover } from '../../hooks/useCanHover.js';

const MovieRow = memo(({ title, movies = [], isLoading = false }) => {
  const rowRef = useRef(null);
  const canHover = useCanHover();
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true); // default true assuming more than 1 page initially

  const handleScroll = useCallback(() => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    
    // We can scroll left if we are not at 0
    setShowLeft(scrollLeft > 0);
    // We can scroll right if we haven't reached the end (with a 1px threshold for rounding errors)
    setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    // Initial check
    handleScroll();
    
    // Also check on resize
    window.addEventListener('resize', handleScroll);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll, movies.length, isLoading]);

  const scroll = (direction) => {
    if (rowRef.current) {
      const clientWidth = rowRef.current.clientWidth;
      const scrollAmount = clientWidth * 0.8;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // If not loading and no movies, don't render the row
  if (!isLoading && (!movies || movies.length === 0)) return null;

  return (
    <div className="relative mb-8 group/row">
      {title && (
        <h2 className="text-xl md:text-2xl font-bold mb-4 px-4 md:px-8 text-txt">
          {title}
        </h2>
      )}

      <div className="relative">
        {/* Left Scroll Button & Fade (Desktop only) */}
        {canHover && showLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-10 w-24 flex items-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => scroll('left')}
              className="ml-2 md:ml-4 bg-surface/80 hover:bg-surface text-txt rounded-full p-2 backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-lg"
              aria-label="Scroll left"
              tabIndex={0}
            >
              <ChevronLeft size={32} />
            </button>
          </div>
        )}

        {/* Scroll Container */}
        <div
          ref={rowRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 md:px-8 gap-4 pb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          tabIndex={0}
        >
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 snap-start" 
                  style={{ width: 'var(--poster-width, 160px)' }}
                >
                  <Skeleton className="w-full aspect-[2/3] rounded-card" />
                </div>
              ))
            : movies.map((movie) => (
                <div key={movie._id} className="flex-shrink-0 snap-start">
                  <PosterCard movie={movie} />
                </div>
              ))}
        </div>

        {/* Right Scroll Button & Fade (Desktop only) */}
        {canHover && showRight && (
          <div className="absolute right-0 top-0 bottom-0 z-10 w-24 flex items-center justify-end bg-gradient-to-l from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => scroll('right')}
              className="mr-2 md:mr-4 bg-surface/80 hover:bg-surface text-txt rounded-full p-2 backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-lg"
              aria-label="Scroll right"
              tabIndex={0}
            >
              <ChevronRight size={32} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

MovieRow.displayName = 'MovieRow';

export default MovieRow;
