import { useRef, useCallback } from 'react';

/**
 * useHoverIntent — single hook managing prefetch + preview thresholds.
 *
 * Replaces the two competing setTimeout effects that were in PosterCard.
 * Both timers share one mouseLeave cancellation path.
 *
 * @param {object} opts
 * @param {number} opts.prefetchDelay  ms before onPrefetch fires  (default 200)
 * @param {number} opts.previewDelay   ms before onPreview fires   (default 500)
 * @param {function} opts.onPrefetch   callback at prefetchDelay
 * @param {function} opts.onPreview    callback at previewDelay
 * @param {function} opts.onLeave      callback when mouse leaves before/after timers
 *
 * Returns handlers to spread onto the trigger element:
 *   const { handlers } = useHoverIntent({ ... })
 *   <div {...handlers}>...</div>
 */
export function useHoverIntent({
  prefetchDelay = 200,
  previewDelay  = 500,
  onPrefetch,
  onPreview,
  onLeave,
} = {}) {
  const prefetchTimer = useRef(null);
  const previewTimer  = useRef(null);

  const clearTimers = useCallback(() => {
    if (prefetchTimer.current) { clearTimeout(prefetchTimer.current); prefetchTimer.current = null; }
    if (previewTimer.current)  { clearTimeout(previewTimer.current);  previewTimer.current  = null; }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimers();

    if (onPrefetch) {
      prefetchTimer.current = setTimeout(() => {
        onPrefetch();
      }, prefetchDelay);
    }

    if (onPreview) {
      previewTimer.current = setTimeout(() => {
        onPreview();
      }, previewDelay);
    }
  }, [clearTimers, onPrefetch, onPreview, prefetchDelay, previewDelay]);

  const handleMouseLeave = useCallback(() => {
    clearTimers();
    onLeave?.();
  }, [clearTimers, onLeave]);

  return {
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}
