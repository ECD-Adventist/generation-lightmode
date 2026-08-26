import { QueryClient } from '@tanstack/react-query';

const retryDelay = (attempt) => {
  const exponential = Math.min(1000 * (2 ** attempt), 8000);
  return exponential + Math.floor(Math.random() * 350);
};

const shouldRetry = (failureCount, error) => {
  if (failureCount >= 2) return false;
  const status = error?.status || error?.response?.status;
  return status === 429 || (status >= 500 && status < 600) || !status;
};

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: shouldRetry,
      retryDelay,
    },
    mutations: {
      retry: shouldRetry,
      retryDelay,
    },
  },
});