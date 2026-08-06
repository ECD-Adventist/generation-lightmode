import React, { useEffect, useState } from "react";
import { Repeat2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function RepostButton({ drop, user, compact = false, dark = false, dock = false, capsule = false }) {
  const queryClient = useQueryClient();
  const originalId = drop?.repost?.original_post_id || drop?.original_drop_id || drop?.id;
  const { data: records = [] } = useQuery({
    queryKey: ["myReposts", user?.id],
    queryFn: () => base44.entities.Repost.filter({ reposter_user_id: user.id }, "-created_at", 500),
    enabled: !!user?.id,
    staleTime: 60000,
  });
  const existing = records.find(record => record.original_post_id === originalId);
  const [displayedCount, setDisplayedCount] = useState(drop?.reposts_count || 0);

  useEffect(() => {
    setDisplayedCount(drop?.reposts_count || 0);
  }, [drop?.reposts_count]);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke("manageRepost", { action: existing ? "undo" : "create", original_post_id: originalId });
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["myReposts", user.id] });
      const previous = queryClient.getQueryData(["myReposts", user.id]) || [];
      const previousCount = displayedCount;
      const toastId = toast.loading(existing ? "Removing repost..." : "Reposting...");
      setDisplayedCount(count => Math.max(0, count + (existing ? -1 : 1)));
      queryClient.setQueryData(["myReposts", user.id], existing
        ? previous.filter(record => record.id !== existing.id)
        : [{ id: `pending-${originalId}`, original_post_id: originalId, reposter_user_id: user.id }, ...previous]);
      return { previous, previousCount, toastId };
    },
    onSuccess: (data, _variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["myReposts", user.id] });
      ["allGlowDrops", "glowFeed", "feedDrops", "discoverDrops"].forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
      toast.success(data.action === "undone" ? "Repost undone" : "Reposted to your feed", { id: context?.toastId });
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["myReposts", user.id], context.previous);
      if (typeof context?.previousCount === "number") setDisplayedCount(context.previousCount);
      toast.error(error?.response?.data?.error || error?.message || "Repost failed", { id: context?.toastId });
    },
  });
  if (!user || !originalId || drop?.user_email === user.email || drop?.hidden || drop?.is_flagged || drop?.status === "rejected") return null;
  if (capsule) {
    return (
      <button type="button" disabled={mutation.isPending} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); mutation.mutate(); }}
        className="min-w-0 h-[70px] sm:h-[76px] px-1 sm:px-2.5 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-left border-r border-[#31516D] transition disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#18C8FF]"
        title={existing ? "Undo repost" : "Repost"} aria-label={existing ? "Undo repost" : "Repost"}>
        <Repeat2 className={`shrink-0 w-5 h-5 sm:w-6 sm:h-6 ${existing ? "text-[#F4C84A]" : "text-[#18C8FF]"}`} />
        <span className="min-w-0 flex flex-col items-center sm:items-start leading-none">
          <span className="text-[9px] sm:text-[13px] font-bold text-white truncate">{existing ? "Undo" : "Repost"}</span>
          <span className="mt-1 text-[8px] sm:text-[11px] font-medium text-[#A8B4C5] truncate">{displayedCount}</span>
        </span>
      </button>
    );
  }
  return (
    <button type="button" disabled={mutation.isPending} onClick={(event) => { event.stopPropagation(); mutation.mutate(); }}
      className={compact ? "flex items-center gap-1.5 text-xs font-bold disabled:opacity-50" : "flex flex-col items-center gap-1 disabled:opacity-50"}
      style={{ color: existing ? "#10B981" : dock ? "#18C8E8" : dark ? "#FFFFFF" : "#0B3FD9" }} title={existing ? "Undo repost" : "Repost"}>
      <span
        className={compact ? "" : "w-11 h-11 rounded-full flex items-center justify-center"}
        style={compact ? undefined : dock ? { color: existing ? "#10B981" : "#18C8E8" } : {
          background: "rgba(255,255,255,0.96)",
          border: "1px solid #D6E4FF",
          boxShadow: "0 4px 12px rgba(11, 63, 217,0.12)",
          color: existing ? "#10B981" : "#0B3FD9",
        }}
      >
        <Repeat2 className="w-5 h-5" />
      </span>
      <span className={compact ? "" : "text-[11px] font-black"} style={compact ? undefined : { textShadow: dark && !dock ? "0 1px 4px rgba(0,0,0,0.65)" : "none" }}>{compact ? (existing ? "Undo repost" : "Repost") : displayedCount}</span>
      {dock && <span className="text-[10px] text-white/70">reposts</span>}
    </button>
  );
}