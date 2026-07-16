import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../services/searchApi.js';
import { queryKeys } from '../lib/queryKeys.js';
import { useDebounce } from './useDebounce.js';

export function useSearch(query, options = {}) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: queryKeys.search(debouncedQuery, options),
    queryFn: () => searchApi.search(debouncedQuery, options),
    enabled: debouncedQuery.length >= 2,
    ...options,
  });
}
