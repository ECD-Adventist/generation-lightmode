import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function useAdminDirectory(admin) {
  const query = useInfiniteQuery({
    queryKey: ["admin_users_full", admin?.id, "database-pages-v2"],
    enabled: !!admin?.id,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const res = await base44.functions.invoke("adminListUsers", {
        view: "directory", limit: pageParam ? 2000 : 100,
        ...(pageParam || {}),
      });
      if (!Array.isArray(res.data?.items)) throw new Error("Unable to read the directory");
      return res.data;
    },
    getNextPageParam: last => last.next_offset == null ? undefined : { skip: last.next_offset, snapshot_at: last.snapshot_at },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: (count, error) => ![400, 401, 403].includes(error?.response?.status) && count < 2,
    retryDelay: (attempt, error) => error?.response?.status === 429 ? 30_000 : Math.min(1000 * 2 ** attempt, 8000),
  });
  useEffect(() => {
    if (!query.hasNextPage || query.isFetching || query.isError) return;
    const timer = setTimeout(() => query.fetchNextPage(), 350);
    return () => clearTimeout(timer);
  }, [query.hasNextPage, query.isFetching, query.isError, query.fetchNextPage]);
  const users = useMemo(() => [...new Map((query.data?.pages || []).flatMap(p => p.items).map(u => [u.id, u])).values()], [query.data]);
  return {
    users, isLoading: query.isPending, isError: query.isError, isFetching: query.isFetching,
    complete: !!query.data && !query.hasNextPage && !query.isError,
    readAt: query.data?.pages.at(-1)?.read_at,
    refetch: () => query.isFetchNextPageError ? query.fetchNextPage() : query.refetch(),
  };
}