import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { loadYouTubeApi } from '../../hooks/useYouTubeApi.js';
import { usePlayerStore } from '../../store/playerStore.js';
import Dialog from '../ui/Dialog.jsx';

/**
 * TrailerModal — YouTube IFrame player wrapped in the existing Dialog.
 *
 * - Composes on Dialog for focus-trap, Escape, click-outside, aria-modal.
 * - Calls playerStore.stopAll() on open to kill any live hover preview.
 * - Destroys the YT player instance completely on close (no audio bleed).
 * - Autoplay muted; unmutes on first user interaction inside the modal.
 *
 * @param {boolean}  open
 * @param {function} onClose
 * @param {string}   trailerKey  YouTube video ID
 * @param {string}   title       Movie title (for aria-label)
 */
export default function TrailerModal({ open, onClose, trailerKey, title }) {
  const containerId = 'yt-trailer-container';
  const playerRef   = useRef(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'
  const { stopAll } = usePlayerStore();

  // Stable close handler that also destroys the player
  const handleClose = useCallback(() => {
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    }
    setStatus('idle');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open || !trailerKey) return;

    // Kill any live hover preview immediately
    stopAll();
    setStatus('loading');

    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;

      // Small rAF pause to ensure the DOM container is mounted
      requestAnimationFrame(() => {
        if (cancelled) return;

        playerRef.current = new YT.Player(containerId, {
          videoId:     trailerKey,
          playerVars: {
            autoplay:       1,
            mute:           1,
            modestbranding: 1,
            rel:            0,
            playsinline:    1,
          },
          events: {
            onReady: (event) => {
              if (cancelled) { event.target.destroy(); return; }
              setStatus('ready');
              event.target.playVideo();
            },
            onError: () => {
              if (!cancelled) setStatus('error');
            },
          },
        });
      });
    }).catch(() => {
      if (!cancelled) setStatus('error');
    });

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }
      setStatus('idle');
    };
  }, [open, trailerKey, stopAll]);

  // Unmute on first click anywhere inside the modal
  const handleUnmute = useCallback(() => {
    if (playerRef.current && status === 'ready') {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(80);
      } catch { /* ignore */ }
    }
  }, [status]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={title ? `${title} — Trailer` : 'Trailer'}
      className="!max-w-5xl !p-0 !bg-black overflow-hidden aspect-video"
    >
      {/* Click to unmute */}
      <div className="relative w-full h-full" onClick={handleUnmute}>

        {/* Loading state */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4 text-txt-muted">
            <AlertTriangle className="w-12 h-12 text-primary" />
            <p className="text-lg font-medium">Trailer unavailable</p>
            <p className="text-sm">This trailer could not be loaded right now.</p>
          </div>
        )}

        {/* YouTube container — always in DOM once open, YT replaces it */}
        <div
          id={containerId}
          className="w-full h-full min-h-[300px]"
          aria-label={`${title ?? 'Movie'} trailer video`}
        />

        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="absolute top-3 right-3 z-20 bg-black/60 hover:bg-black rounded-full p-1.5 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Close trailer"
        >
          <X size={20} />
        </button>
      </div>
    </Dialog>
  );
}
