import { useQueries } from "@tanstack/react-query";
import readAdminRecords from "@/components/admin/data/readAdminRecords";
const entities = ['User', 'GlowDrop', 'GlowGroup', 'Challenge'];
const EMPTY = [];
export default function useAdminDashboardData(user, enabled = true) {
  const queries = useQueries({ queries: entities.map(entity => ({
    queryKey: ['adminDashboardDatabase', user?.id, entity],
    queryFn: ({ signal }) => readAdminRecords(entity, { signal, user }),
    enabled: !!user?.id && enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: 60_000,
    retry: (count, error) => ![400, 401, 403].includes(error?.response?.status) && count < 2,
    retryDelay: (attempt, error) => error?.response?.status === 429 ? 30_000 : Math.min(1000 * 2 ** attempt, 8000),
  })) });
  return {
    users: queries[0].data || EMPTY, drops: queries[1].data || EMPTY,
    groups: queries[2].data || EMPTY, challenges: queries[3].data || EMPTY,
    ready: queries.every(q => q.data !== undefined),
    isFetching: queries.some(q => q.isFetching), isError: queries.some(q => q.isError),
    readAt: Math.min(...queries.map(q => q.dataUpdatedAt)),
    refetch: () => Promise.all(queries.map(q => q.refetch())),
  };
}