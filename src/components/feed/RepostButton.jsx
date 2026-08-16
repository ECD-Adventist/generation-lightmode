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
    queryFn: async () => {
      const [legacyReposts, repostDrops] = await Promise.all([
        base44.entities.Repost.filter({ reposter_user_id: user.id }, "-created_at", 500),
        base44.entities.GlowDrop.filter({ user_email: user.email }, "-created_date", 500),
      ]);
      // Re-assert ownership client-side. If either identity field were ever missing the
      // filter above would come back unscoped, and another member's repost would light
      // this button up as "already reposted by me".
      return [
        ...legacyReposts.filter(record => record.reposter_user_id === user.id),
        ...repostDrops.filter(record => record.original_drop_id && record.user_email === user.email),
      ];
    },
    enabled: !!user?.id && !!user?.email,
    staleTime: 60000,
  });
  const existing = records.find(record => (record.original_post_id || record.original_drop_id) === originalId);
  const [displayedCount, setDisplayedCount] = useState(drop?.reposts_count || 0);

  useEffect(() => {
    setDisplayedCount(drop?.reposts_count || 0);
  }, [drop?.reposts_count]);

  const mutation = useMutation({
    mutationFn: async () => {
      // Send "toggle" — the server decides create vs undo from its own records, so a stale
      // client cache can no longer send "undo" for a post that was never reposted.
      const response = await base44.functions.invoke("manageRepost", { action: "toggle", original_post_id: originalId });
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
        : [{ id: `pending-${originalId}`, original_drop_id: originalId, user_email: user.email }, ...previous]);
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
      console.error("Repost action failed:", error?.response?.data?.error || error?.message || error);
      if (context?.previous) queryClient.setQueryData(["myReposts", user.id], context.previous);
      if (typeof context?.previousCount === "number") setDisplayedCount(context.previousCount);
      // The button's state disagreed with the server — refetch so it self-corrects.
      queryClient.invalidateQueries({ queryKey: ["myReposts", user.id] });
      toast.error(error?.response?.data?.error || error?.message || "Repost failed", { id: context?.toastId });
    },
  });
  // NOTE: never gate this on `user` — the feed can briefly resolve the viewer as a
  // guest, and hiding the button made Repost disappear from the action bar entirely.
  if (!originalId || drop?.hidden || drop?.is_flagged || drop?.status === "rejected") return null;

  const handleClick = (event) => {
    event.stopPropagation();
    if (!user) { toast.error("Please log in to repost"); return; }
    mutation.mutate();
  };

  if (capsule) {
    return (
      <button type="button" disabled={mutation.isPending} onPointerDown={(event) => event.stopPropagation()} onClick={handleClick}
        className="min-w-0 h-[44px] sm:h-[48px] px-1 sm:px-2 flex items-center justify-center gap-1 border-r border-[#31516D] last:border-r-0 transition disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#18C8FF]"
        title={existing ? "Undo repost" : "Repost"} aria-label={existing ? "Undo repost" : "Repost"}>
        <Repeat2 className={`shrink-0 w-5 h-5 sm:w-6 sm:h-6 ${existing ? "text-[#F4C84A]" : "text-[#18C8FF]"}`} />
        <span className="min-w-0 flex flex-col items-center sm:items-start leading-none">
          {displayedCount > 0 && <span className="text-[10px] sm:text-[11px] font-bold text-white/90 leading-none">{displayedCount}</span>}
        </span>
      </button>
    );
  }
  return (
    <button type="button" disabled={mutation.isPending} onClick={handleClick}
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