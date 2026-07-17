import { useQuery } from '@tanstack/react-query';
import { movieApi } from '../../services/movieApi.js';
import { queryKeys } from '../../lib/queryKeys.js';
import PosterCard from '../../components/movie/PosterCard.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

export default function RecommendationBubble({ recommendation, onClick }) {
  const { data: movie, isLoading } = useQuery({
    queryKey: queryKeys.movies.detail(recommendation.movieId),
    queryFn: () => movieApi.getById(recommendation.movieId),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 items-start p-3 bg-surface rounded-card border border-surface-light">
        <Skeleton className="w-[100px] h-[150px] rounded flex-shrink-0" />
        <div className="flex-grow space-y-2 py-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }

  // If movie wasn't found (perhaps deleted), skip rendering cleanly
  if (!movie) return null;

  // Use raw movie object if returned, or extract from { movie: ... } payload wrapper
  const m = movie.movie || movie;

  return (
    <div className="flex flex-col gap-3 p-3 bg-surface rounded-card border border-surface-light hover:border-primary/50 transition-colors">
      <p className="text-sm text-txt italic leading-relaxed">"{recommendation.reason}"</p>
      <div className="flex gap-4" onClick={onClick}>
        <div className="w-[100px] flex-shrink-0" style={{ '--poster-width': '100px' }}>
          {/* Note: PosterCard wraps in a Link. onClick handles closing the slideover */}
          <PosterCard movie={m} />
        </div>
        <div className="flex flex-col gap-1 py-1">
          <h4 className="font-semibold text-txt text-base">{m.title}</h4>
          <p className="text-xs text-txt-muted">
            {m.releaseDate ? new Date(m.releaseDate).getFullYear() : ''} • {m.runtime}m
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {m.genres?.slice(0, 2).map(g => (
              <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-light text-txt-muted">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
