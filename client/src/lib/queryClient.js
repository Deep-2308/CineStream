import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 60 seconds
      gcTime: 10 * 60 * 1000,      // 10 minutes
      retry: (failureCount, error) => {
        // Do not retry on 404 Not Found
        if (error.response?.status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
