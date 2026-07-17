import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.js';
import PageTransition from '../components/common/PageTransition.jsx';
import PosterCard from '../components/movie/PosterCard.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, refetch } = useSearch(query, { limit: 40 });

  const items = data?.items || data?.movies || data || [];
  
  // Show skeleton if query is not empty and loading
  const showLoading = query.trim().length > 0 && isLoading;
  // Show empty state if query is not empty, not loading, and no results
  const showEmpty = query.trim().length > 0 && !isLoading && items.length === 0;
  // Show prompt if query is empty
  const showPrompt = query.trim().length === 0;

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12 min-h-screen">
        
        {/* Search Input */}
        <div className="relative mb-8 md:mb-12 max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-txt-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-surface border-none rounded-modal text-lg text-txt placeholder-txt-muted focus:ring-2 focus:ring-primary focus:outline-none transition-shadow shadow-lg"
            placeholder="Search movies, genres, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Content Area */}
        {isError ? (
          <ErrorState message="Something went wrong while searching." onRetry={refetch} />
        ) : showPrompt ? (
          <div className="flex flex-col items-center justify-center pt-24 text-txt-muted">
            <SearchIcon className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-medium">Find your next favorite movie</h2>
            <p className="mt-2 text-sm max-w-md text-center opacity-80">
              Search across our catalog using titles, genres, or semantic descriptions like "feel good comedy about space".
            </p>
          </div>
        ) : showEmpty ? (
          <EmptyState 
            title="No results found" 
            message={`We couldn't find any matches for "${query}". Try different keywords.`} 
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {showLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="w-full aspect-[2/3] rounded-card" />
                ))
              : items.map(movie => (
                  <PosterCard key={movie._id} movie={movie} />
                ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
