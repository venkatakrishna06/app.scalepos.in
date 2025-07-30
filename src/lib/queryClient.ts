import {QueryClient} from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60, // 1 hour
            retry: 1,
            refetchOnWindowFocus: false, // Disable refetch on window focus
            refetchOnMount: false, // Disable refetch on mount
            refetchOnReconnect: false, // Disable refetch on reconnect
        },
    },
});
