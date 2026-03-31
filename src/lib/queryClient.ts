import {
  QueryClient,
  DefaultOptions,
} from '@tanstack/react-query';

/**
 * Default React Query options
 */
const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: 1,
  },
};

/**
 * Create and export a singleton QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});
