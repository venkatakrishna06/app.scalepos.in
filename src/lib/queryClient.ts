import {QueryClient} from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000, // 30 seconds - reduced for more frequent updates
            cacheTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: true, // Enable refetch on window focus for better real-time updates
            refetchInterval: 60 * 1000, // Poll every minute for critical data
        },
    },
});
