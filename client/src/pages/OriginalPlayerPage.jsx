import { lazy, Suspense, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys.js';
import { originalsApi } from '../services/originalsApi.js';
import { useResumePlayback } from '../hooks/useResumePlayback.js';
import PageTransition from '../components/common/PageTransition.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const HlsPlayer = lazy(() => import('../components/player/HlsPlayer.jsx'));

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function OriginalPlayerPage() {
  const { id } = useParams();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.originals.detail(id),
    queryFn:  () => originalsApi.getById(id),
    retry:    (failCount, err) => err?.response?.status !== 404 && failCount < 2,
  });

  const original = data?.original ?? data;

  const { resumeAt, saveProgress } = useResumePlayback(
    id,
    original?.durationSeconds ?? 0
  );

  const handleTimeUpdate = useCallback((currentTime) => {
    saveProgress(currentTime);
  }, [saveProgress]);

  const handlePause = useCallback((currentTime) => {
    saveProgress(currentTime);
  }, [saveProgress]);

  if (error) {
    const status = error?.response?.status;
    return <ErrorState message={status === 404 ? 'Original not found.' : 'Failed to load.'} onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <PageTransition>
        <Skeleton className="w-full aspect-video" />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-1/2 mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </PageTransition>
    );
  }

  if (!original) return <ErrorState message="Original not found." />;

  // Client-side https guard
  const manifestUrl = original.hlsManifestUrl?.startsWith('https://')
    ? original.hlsManifestUrl
    : null;

  return (
    <PageTransition>
      {/* Player */}
      <div className="w-full bg-black">
        {manifestUrl ? (
          <Suspense fallback={<div className="w-full aspect-video flex items-center justify-center bg-black"><Spinner size="lg" /></div>}>
            <HlsPlayer
              src={manifestUrl}
              title={original.title}
              startTime={resumeAt}
              onTimeUpdate={handleTimeUpdate}
              onPause={handlePause}
            />
          </Suspense>
        ) : (
          <div className="w-full aspect-video flex flex-col items-center justify-center bg-black text-white gap-3">
            <span className="text-4xl">⚠</span>
            <p>Playback unavailable — manifest URL is not secure.</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-txt mb-3">{original.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-txt-muted text-sm mb-6">
          {original.releaseYear && (
            <span className="flex items-center gap-1"><Calendar size={16} />{original.releaseYear}</span>
          )}
          {original.durationSeconds && (
            <span className="flex items-center gap-1"><Clock size={16} />{formatDuration(original.durationSeconds)}</span>
          )}
          {original.genres?.length > 0 && original.genres.map(g => (
            <span key={g} className="border border-surface px-2 py-0.5 rounded-full text-xs bg-surface/50">{g}</span>
          ))}
        </div>

        {original.description && (
          <p className="text-txt-muted text-lg leading-relaxed mb-8">{original.description}</p>
        )}

        {original.licenseNote && (
          <p className="text-xs text-txt-muted/60 border-t border-surface pt-4">{original.licenseNote}</p>
        )}
      </div>
    </PageTransition>
  );
}
