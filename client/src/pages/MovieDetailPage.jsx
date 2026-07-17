import { lazy, Suspense, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Play, Calendar, Clock } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys.js';
import { movieApi } from '../services/movieApi.js';
import { recommendationApi } from '../services/recommendationApi.js';
import { backdropUrl, posterUrl } from '../lib/tmdbImage.js';
import PageTransition from '../components/common/PageTransition.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Image from '../components/common/Image.jsx';
import Button from '../components/ui/Button.jsx';
import MovieRow from '../components/movie/MovieRow.jsx';

const TrailerModal = lazy(() => import('../components/player/TrailerModal.jsx'));

export default function MovieDetailPage() {
  const { id } = useParams();
  const [trailerOpen, setTrailerOpen] = useState(false);

  // 1. Fetch Movie
  const {
    data: movieData,
    isLoading: movieLoading,
    error: movieError,
    refetch: refetchMovie
  } = useQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: () => movieApi.getById(id),
  });

  // 2. Fetch Similar
  const {
    data: similarData,
    isLoading: similarLoading,
  } = useQuery({
    queryKey: queryKeys.recommendations.similar(id, { limit: 10 }),
    queryFn: () => recommendationApi.getSimilar(id, { limit: 10 }),
    enabled: !!id,
  });

  // Handle 404 explicitly
  if (movieError) {
    const status = movieError.response?.status;
    if (status === 404) {
      return <ErrorState message="Movie Not Found" />;
    }
    return <ErrorState message="Failed to load movie details." onRetry={refetchMovie} />;
  }

  if (movieLoading) {
    return (
      <PageTransition>
        <div className="w-full h-[50vh] bg-surface animate-pulse" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="h-12 w-1/3 mb-4" />
          <Skeleton className="h-6 w-1/4 mb-8" />
          <Skeleton className="h-32 w-full max-w-2xl" />
        </div>
      </PageTransition>
    );
  }

  const movie = movieData?.movie || movieData;
  if (!movie) return <ErrorState message="Movie Not Found" />;

  const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
  const similarItems = similarData?.items || similarData?.movies || similarData || [];

  return (
    <>
      <PageTransition>
      {/* Backdrop Section */}
      <div className="relative w-full h-[50vh] md:h-[70vh] bg-background">
        <div className="absolute inset-0">
          <Image
            src={backdropUrl(movie.backdropPath || movie.posterPath, 'w1280')}
            alt={`${movie.title} Backdrop`}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent w-[80%]" />
        
        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-end">
            
            {/* Poster (Desktop only overlap) */}
            <div className="hidden md:block flex-shrink-0 w-64 rounded-card overflow-hidden shadow-2xl ring-1 ring-surface bg-surface relative z-10 translate-y-24">
              <Image 
                src={posterUrl(movie.posterPath, 'w500')} 
                alt={movie.title} 
                className="w-full aspect-[2/3] object-cover"
              />
            </div>

            {/* Metadata */}
            <div className="relative z-10 flex-grow pb-4 md:pb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-txt drop-shadow-md mb-4">
                {movie.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-txt-muted font-medium mb-6">
                {movie.voteAverage > 0 && (
                  <span className="flex items-center gap-1 text-secondary">
                    <Star size={18} className="fill-secondary" />
                    {movie.voteAverage.toFixed(1)}
                  </span>
                )}
                {releaseYear && (
                  <span className="flex items-center gap-1">
                    <Calendar size={18} />
                    {releaseYear}
                  </span>
                )}
                {movie.runtime > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock size={18} />
                    {movie.runtime} min
                  </span>
                )}
              </div>

              {movie.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genres.map(g => (
                    <span key={g} className="border border-surface px-3 py-1 rounded-full text-xs md:text-sm bg-surface/50 backdrop-blur-sm text-txt">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4">
                {movie.trailerKey ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="gap-2 px-8"
                    onClick={() => setTrailerOpen(true)}
                  >
                    <Play size={20} className="fill-current" />
                    Watch Trailer
                  </Button>
                ) : (
                  <span title="No trailer available" className="inline-block">
                    <Button
                      variant="primary"
                      size="lg"
                      className="gap-2 px-8 opacity-40 cursor-not-allowed"
                      disabled
                    >
                      <Play size={20} className="fill-current" />
                      Trailer Unavailable
                    </Button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:pt-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Overview */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-txt">Overview</h2>
            <p className="text-txt-muted text-lg leading-relaxed">
              {movie.overview || "No overview available."}
            </p>
          </div>
          
          {/* Side Info (could add director/cast here later) */}
          <div className="md:col-span-1">
            <div className="bg-surface rounded-card p-6 border border-surface/50">
              <h3 className="font-semibold text-txt mb-2">Release Status</h3>
              <p className="text-txt-muted">{movie.status || 'Released'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* More Like This Row */}
      <div className="pb-12">
        <MovieRow 
          title="More Like This" 
          movies={similarItems.filter(m => m._id !== movie._id)} 
          isLoading={similarLoading} 
        />
      </div>
    </PageTransition>

    {/* TrailerModal — lazy-loaded, only mounts when open */}
    {movie?.trailerKey && (
      <Suspense fallback={null}>
        <TrailerModal
          open={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          trailerKey={movie.trailerKey}
          title={movie.title}
        />
      </Suspense>
    )}
    </>
  );
}
