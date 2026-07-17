import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore.js';
import { queryKeys } from '../lib/queryKeys.js';
import { movieApi } from '../services/movieApi.js';
import { recommendationApi } from '../services/recommendationApi.js';
import PageTransition from '../components/common/PageTransition.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import HeroBanner from '../components/movie/HeroBanner.jsx';
import MovieRow from '../components/movie/MovieRow.jsx';

export default function HomePage() {
  const { user } = useAuthStore();

  // 1. Trending Query (used for Hero and Trending Row)
  const {
    data: trendingData,
    isLoading: trendingLoading,
    isError: trendingError,
    refetch: refetchTrending
  } = useQuery({
    queryKey: queryKeys.movies.trending({ limit: 20 }),
    queryFn: () => movieApi.getTrending({ limit: 20 }),
  });

  // 2. Recommendations Query
  const {
    data: recData,
    isLoading: recLoading,
    isError: recError,
  } = useQuery({
    queryKey: queryKeys.recommendations.home(user?.id ?? 'anon'),
    queryFn: () => recommendationApi.getHome({ limit: 20 }),
  });

  // 3. Genre Queries (using exact TMDB strings)
  const genres = ['Action', 'Science Fiction', 'Comedy'];
  
  // We'll map through these below, but using useQuery in a loop is technically a violation of rules of hooks, 
  // so we'll just define them sequentially (or use useQueries, but sequential is fine for 3).
  const actionQuery = useQuery({
    queryKey: queryKeys.movies.genre('Action', { limit: 20 }),
    queryFn: () => movieApi.getByGenre('Action', { limit: 20 }),
  });

  const sciFiQuery = useQuery({
    queryKey: queryKeys.movies.genre('Science Fiction', { limit: 20 }),
    queryFn: () => movieApi.getByGenre('Science Fiction', { limit: 20 }),
  });

  const comedyQuery = useQuery({
    queryKey: queryKeys.movies.genre('Comedy', { limit: 20 }),
    queryFn: () => movieApi.getByGenre('Comedy', { limit: 20 }),
  });

  if (trendingError) {
    return <ErrorState message="Failed to load home page content." onRetry={refetchTrending} />;
  }

  const trendingItems = trendingData?.items || trendingData?.movies || trendingData || [];
  const heroMovie = trendingItems[0];
  const trendingRowMovies = trendingItems.slice(1);
  const recItems = recData?.items || [];

  return (
    <PageTransition>
      {/* Hero Section */}
      {trendingLoading ? (
        <div className="w-full h-[60vh] md:h-[80vh] min-h-[400px] max-h-[800px] bg-surface animate-pulse" />
      ) : heroMovie ? (
        <HeroBanner movie={heroMovie} />
      ) : null}

      <div className="pb-12 pt-8 md:-mt-24 relative z-20">
        {/* Recommended Row */}
        <MovieRow 
          title={user ? "Recommended For You" : "Trending"} 
          movies={recItems} 
          isLoading={recLoading} 
        />

        {/* Trending Now Row */}
        <MovieRow 
          title="Trending Now" 
          movies={trendingRowMovies} 
          isLoading={trendingLoading} 
        />

        {/* Genre Rows */}
        <MovieRow 
          title="Action" 
          movies={actionQuery.data?.items || actionQuery.data?.movies || actionQuery.data || []} 
          isLoading={actionQuery.isLoading} 
        />

        <MovieRow 
          title="Science Fiction" 
          movies={sciFiQuery.data?.items || sciFiQuery.data?.movies || sciFiQuery.data || []} 
          isLoading={sciFiQuery.isLoading} 
        />

        <MovieRow 
          title="Comedy" 
          movies={comedyQuery.data?.items || comedyQuery.data?.movies || comedyQuery.data || []} 
          isLoading={comedyQuery.isLoading} 
        />
      </div>
    </PageTransition>
  );
}
