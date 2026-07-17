import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys.js';
import { originalsApi } from '../services/originalsApi.js';
import { backdropUrl, posterUrl } from '../lib/tmdbImage.js';
import PageTransition from '../components/common/PageTransition.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Image from '../components/common/Image.jsx';
import Button from '../components/ui/Button.jsx';

function OriginalCard({ original }) {
  // Originals may have full URLs (not TMDB paths) or relative TMDB paths
  const thumb = original.posterPath?.startsWith('http')
    ? original.posterPath
    : posterUrl(original.posterPath, 'w342');

  return (
    <Link
      to={`/originals/${original._id}`}
      className="group block relative rounded-card overflow-hidden bg-surface shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ flexShrink: 0, width: 'var(--poster-width, 160px)' }}
    >
      <div className="w-full aspect-[2/3] relative">
        <Image src={thumb} alt={original.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <Play className="w-8 h-8 text-white fill-white" />
        </div>
      </div>
      <div className="p-2">
        <p className="text-sm font-medium text-txt truncate">{original.title}</p>
        {original.releaseYear && <p className="text-xs text-txt-muted">{original.releaseYear}</p>}
      </div>
    </Link>
  );
}

export default function OriginalsPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.originals.list({ limit: 20 }),
    queryFn:  () => originalsApi.getOriginals({ limit: 20 }),
  });

  const items    = data?.items ?? [];
  const featured = items.find(o => o.featured) ?? items[0];
  const rest     = items.filter(o => o._id !== featured?._id);

  if (isError) return <ErrorState message="Failed to load Originals." onRetry={refetch} />;

  const heroBg = featured?.backdropPath?.startsWith('http')
    ? featured.backdropPath
    : backdropUrl(featured?.backdropPath, 'w1280');

  return (
    <PageTransition>
      {/* Hero */}
      {isLoading ? (
        <div className="w-full h-[60vh] bg-surface animate-pulse" />
      ) : featured ? (
        <div className="relative w-full h-[60vh] md:h-[75vh] min-h-[380px] max-h-[700px] bg-background">
          <div className="absolute inset-0">
            <Image src={heroBg} alt={featured.title} className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent w-[80%]" />
          <div className="absolute bottom-0 left-0 px-4 md:px-8 pb-12 max-w-2xl z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">CineStream Original</span>
            <h1 className="text-3xl md:text-5xl font-bold text-txt mb-4">{featured.title}</h1>
            {featured.description && (
              <p className="text-txt-muted text-sm md:text-base mb-6 line-clamp-3">{featured.description}</p>
            )}
            <div className="flex gap-3">
              <Link to={`/originals/${featured._id}`}>
                <Button variant="primary" size="lg" className="gap-2 px-6">
                  <Play size={20} className="fill-current" />
                  Watch Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Shelf */}
      <div className="px-4 md:px-8 py-10 md:-mt-12 relative z-20">
        <h2 className="text-2xl font-bold text-txt mb-6">CineStream Originals</h2>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ width: 160, flexShrink: 0 }}>
                <Skeleton className="w-full aspect-[2/3] rounded-card" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
            {[featured, ...rest].filter(Boolean).map(o => (
              <div key={o._id} className="snap-start">
                <OriginalCard original={o} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
