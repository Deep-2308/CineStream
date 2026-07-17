import {
  useEffect, useRef, useState, useCallback, useMemo
} from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  PictureInPicture2, Settings, AlertTriangle, Loader2,
  SkipBack, SkipForward
} from 'lucide-react';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const BLOCKED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']);

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
/**
 * HlsPlayer — adaptive HLS video player with custom controls.
 *
 * Feature-detects Safari's native HLS vs hls.js for all other browsers.
 * Quality selector is only rendered when hls.js is driving.
 * PiP button is only rendered when document.pictureInPictureEnabled.
 * Keyboard shortcuts are scoped to the container (not window).
 * All cleanup (hls.destroy, listeners, rAF) runs on unmount.
 *
 * @param {string}   src            HLS manifest URL (https:// required)
 * @param {string}   [title]
 * @param {number}   [startTime]    Resume point in seconds
 * @param {function} [onTimeUpdate] Called with currentTime during playback
 * @param {function} [onPause]      Called with currentTime on pause
 */
export default function HlsPlayer({
  src,
  title,
  startTime = 0,
  onTimeUpdate,
  onPause,
}) {
  const videoRef       = useRef(null);
  const containerRef   = useRef(null);
  const hlsRef         = useRef(null);
  const rafRef         = useRef(null);
  const hideControlsTimer = useRef(null);

  const [isPlaying,        setIsPlaying]        = useState(false);
  const [currentTime,      setCurrentTime]       = useState(0);
  const [duration,         setDuration]          = useState(0);
  const [buffered,         setBuffered]          = useState(0);
  const [volume,           setVolume]            = useState(1);
  const [isMuted,          setIsMuted]           = useState(false);
  const [isFullscreen,     setIsFullscreen]      = useState(false);
  const [showControls,     setShowControls]      = useState(true);
  const [playbackRate,     setPlaybackRate]       = useState(1);
  const [levels,           setLevels]            = useState([]);   // hls.js only
  const [currentLevel,     setCurrentLevel]      = useState(-1);   // -1 = Auto
  const [isNativeHls,      setIsNativeHls]       = useState(false);
  const [status,           setStatus]            = useState('loading'); // 'loading'|'ready'|'error'
  const [errorMessage,     setErrorMessage]      = useState('');
  const [showSettings,     setShowSettings]      = useState(false);

  const supportsNativeHls = useMemo(() => {
    if (typeof document === 'undefined') return false;
    const v = document.createElement('video');
    return v.canPlayType('application/vnd.apple.mpegurl') !== '';
  }, []);

  const supportsPiP = typeof document !== 'undefined' && !!document.pictureInPictureEnabled;

  // ------------------------------------------------------------------
  // Client-side security: refuse non-https manifests
  // ------------------------------------------------------------------
  const safeSrc = useMemo(() => {
    if (!src) return null;
    if (!src.startsWith('https://')) {
      setStatus('error');
      setErrorMessage('Playback unavailable: insecure manifest URL.');
      return null;
    }
    return src;
  }, [src]);

  // ------------------------------------------------------------------
  // rAF loop — updates time & buffered bar without adding event listeners
  // ------------------------------------------------------------------
  const startRaf = useCallback(() => {
    const tick = () => {
      const v = videoRef.current;
      if (!v) return;
      setCurrentTime(v.currentTime);

      // Buffered end
      if (v.buffered.length > 0) {
        setBuffered(v.buffered.end(v.buffered.length - 1));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  // ------------------------------------------------------------------
  // HLS setup
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!safeSrc) return;
    const video = videoRef.current;
    if (!video) return;

    let hls = null;

    const onVideoReady = () => {
      setStatus('ready');
      setDuration(video.duration);
      if (startTime > 0) video.currentTime = startTime;
      video.play().catch(() => {});
      startRaf();
    };

    if (supportsNativeHls) {
      // Safari — native HLS
      setIsNativeHls(true);
      video.src = safeSrc;
      video.addEventListener('loadedmetadata', onVideoReady, { once: true });
      video.addEventListener('error', () => {
        setStatus('error');
        setErrorMessage('Playback failed. The video may be unavailable.');
      }, { once: true });
    } else {
      // Chrome, Firefox, etc — hls.js
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          setStatus('error');
          setErrorMessage('HLS is not supported in this browser.');
          return;
        }

        hls = new Hls({ startLevel: -1 });
        hlsRef.current = hls;

        hls.loadSource(safeSrc);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setLevels(data.levels.map((l, i) => ({ index: i, height: l.height, bitrate: l.bitrate })));
          onVideoReady();
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          setCurrentLevel(data.level);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setStatus('error');
            setErrorMessage('Playback failed. Please try again.');
          }
        });
      });
    }

    // Video element event listeners
    const onPlay  = () => { setIsPlaying(true);  startRaf(); };
    const onPauseEvt = () => {
      setIsPlaying(false);
      stopRaf();
      onPause?.(video.currentTime);
    };
    const onEnded = () => { setIsPlaying(false); stopRaf(); };
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange   = () => { setVolume(video.volume); setIsMuted(video.muted); };

    video.addEventListener('play',           onPlay);
    video.addEventListener('pause',          onPauseEvt);
    video.addEventListener('ended',          onEnded);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('volumechange',   onVolumeChange);

    return () => {
      stopRaf();
      if (hls) { hls.destroy(); hlsRef.current = null; }
      video.removeEventListener('play',           onPlay);
      video.removeEventListener('pause',          onPauseEvt);
      video.removeEventListener('ended',          onEnded);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('volumechange',   onVolumeChange);
      video.src = '';
    };
  }, [safeSrc, supportsNativeHls, startTime, startRaf, stopRaf, onPause]);

  // onTimeUpdate callback (throttled by rAF already)
  useEffect(() => {
    onTimeUpdate?.(currentTime);
  }, [currentTime, onTimeUpdate]);

  // ------------------------------------------------------------------
  // Fullscreen
  // ------------------------------------------------------------------
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ------------------------------------------------------------------
  // Controls auto-hide
  // ------------------------------------------------------------------
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => clearTimeout(hideControlsTimer.current);
  }, []);

  // ------------------------------------------------------------------
  // Control handlers
  // ------------------------------------------------------------------
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  }, []);

  const seek = useCallback((seconds) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + seconds));
  }, [duration]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = parseFloat(e.target.value);
    v.muted  = v.volume === 0;
  }, []);

  const handleSeek = useCallback((e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = (parseFloat(e.target.value) / 100) * duration;
  }, [duration]);

  const handleRate = useCallback((rate) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const handleQuality = useCallback((index) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index; // -1 = Auto, no playback restart
    }
    setCurrentLevel(index);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenEnabled) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  const togglePiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch { /* ignore */ }
  }, []);

  // ------------------------------------------------------------------
  // Keyboard shortcuts — scoped to container
  // ------------------------------------------------------------------
  const handleKeyDown = useCallback((e) => {
    // Don't steal input from form elements
    if (BLOCKED_TAGS.has(e.target.tagName)) return;

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        seek(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        seek(10);
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        toggleMute();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
      default:
        break;
    }
  }, [togglePlay, seek, toggleMute, toggleFullscreen]);

  // ------------------------------------------------------------------
  // Progress % for seek bar
  // ------------------------------------------------------------------
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none outline-none"
      style={{ aspectRatio: '16/9' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      role="application"
      aria-label={title ? `${title} — video player` : 'Video player'}
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />

      {/* LOADING */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* ERROR */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4 text-white">
          <AlertTriangle className="w-12 h-12 text-primary" />
          <p className="text-lg font-medium">Playback unavailable</p>
          <p className="text-sm text-gray-400 max-w-sm text-center">{errorMessage || 'This video could not be loaded.'}</p>
        </div>
      )}

      {/* CUSTOM CONTROLS */}
      {status === 'ready' && (
        <div
          className={`absolute bottom-0 inset-x-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
        >
          {/* SEEK BAR */}
          <div className="px-4 pt-4 pb-1 relative h-6 flex items-center">
            {/* Buffered */}
            <div
              className="absolute left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              <div
                className="h-full bg-white/40 rounded-full"
                style={{ width: `${bufferedPct}%` }}
              />
            </div>
            {/* Progress input */}
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressPct}
              onChange={handleSeek}
              className="absolute inset-x-4 h-1 opacity-0 cursor-pointer z-10"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
              aria-label="Seek"
              aria-valuenow={Math.round(progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              role="slider"
            />
            {/* Visual progress */}
            <div
              className="absolute left-4 h-1 bg-primary rounded-full pointer-events-none"
              style={{ width: `calc(${progressPct}% - 0px)`, top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          {/* BOTTOM ROW */}
          <div className="flex items-center gap-2 px-4 pb-3">
            {/* Skip back */}
            <button onClick={() => seek(-10)} aria-label="Seek back 10 seconds" className="text-white hover:text-primary focus-visible:ring-2 focus-visible:ring-primary rounded p-1">
              <SkipBack size={20} />
            </button>

            {/* Play/Pause */}
            <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} className="text-white hover:text-primary focus-visible:ring-2 focus-visible:ring-primary rounded p-1">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            {/* Skip forward */}
            <button onClick={() => seek(10)} aria-label="Seek forward 10 seconds" className="text-white hover:text-primary focus-visible:ring-2 focus-visible:ring-primary rounded p-1">
              <SkipForward size={20} />
            </button>

            {/* Volume */}
            <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} className="text-white hover:text-primary focus-visible:ring-2 focus-visible:ring-primary rounded p-1">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range" min="0" max="1" step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-primary cursor-pointer"
              aria-label="Volume"
            />

            {/* Time */}
            <span className="text-white text-sm font-mono ml-1 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings (speed + quality) */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(s => !s)}
                aria-label="Settings"
                className="text-white hover:text-primary focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
              >
                <Settings size={20} />
              </button>

              {showSettings && (
                <div className="absolute bottom-10 right-0 bg-black/90 rounded-lg p-3 min-w-[160px] text-white text-sm z-30 space-y-3">
                  {/* Playback speed */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Speed</p>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                      <button
                        key={r}
                        onClick={() => { handleRate(r); setShowSettings(false); }}
                        className={`block w-full text-left px-2 py-1 rounded hover:bg-white/10 ${playbackRate === r ? 'text-primary font-semibold' : ''}`}
                      >
                        {r === 1 ? 'Normal' : `${r}×`}
                      </button>
                    ))}
                  </div>

                  {/* Quality — only when hls.js is driving */}
                  {!isNativeHls && levels.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Quality</p>
                      <button
                        onClick={() => { handleQuality(-1); setShowSettings(false); }}
                        className={`block w-full text-left px-2 py-1 rounded hover:bg-white/10 ${currentLevel === -1 ? 'text-primary font-semibold' : ''}`}
                      >
                        Auto
                      </button>
                      {[...levels].reverse().map(l => (
                        <button
                          key={l.index}
                          onClick={() => { handleQuality(l.index); setShowSettings(false); }}
                          className={`block w-full text-left px-2 py-1 rounded hover:bg-white/10 ${currentLevel === l.index ? 'text-primary font-semibold' : ''}`}
                        >
                          {l.height}p
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Safari — read-only quality notice */}
                  {isNativeHls && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Quality</p>
                      <p className="px-2 py-1 text-gray-400">Auto</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PiP — only when supported */}
            {supportsPiP && (
              <button onClick={togglePiP} aria-label="Picture in Picture" className="text-white hover:text-primary focus-visible:ring-2 focus-visible:ring-primary rounded p-1">
                <PictureInPicture2 size={20} />
              </button>
            )}

            {/* Fullscreen */}
            {document.fullscreenEnabled && (
              <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} className="text-white hover:text-primary focus-visible:ring-2 focus-visible:ring-primary rounded p-1">
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
