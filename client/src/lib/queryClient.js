import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 60 seconds
      gcTime: 10 * 60 * 1000,      // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
