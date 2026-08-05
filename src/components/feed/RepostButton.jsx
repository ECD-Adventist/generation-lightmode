import React from "react";
import { Repeat2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function RepostButton({ drop, user, compact = false, dark = false }) {
  const queryClient = useQueryClient();
  const originalId = drop?.repost?.original_post_id || drop?.original_drop_id || drop?.id;
  const { data: records = [] } = useQuery({
    queryKey: ["myReposts", user?.id],
    queryFn: () => base44.entities.Repost.filter({ reposter_user_id: user.id }, "-created_at", 500),
    enabled: !!user?.id,
    staleTime: 60000,
  });
  const existing = records.find(record => record.original_post_id === originalId);
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke("manageRepost", { action: existing ? "undo" : "create", original_post_id: originalId });
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["myReposts", user.id] });
      const previous = queryClient.getQueryData(["myReposts", user.id]) || [];
      queryClient.setQueryData(["myReposts", user.id], existing
        ? previous.filter(record => record.id !== existing.id)
        : [{ id: `pending-${originalId}`, original_post_id: originalId, reposter_user_id: user.id }, ...previous]);
      return { previous };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["myReposts", user.id] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      toast.success(data.action === "undone" ? "Repost undone" : "Reposted to your feed");
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["myReposts", user.id], context.previous);
      toast.error(error?.response?.data?.error || error?.message || "Repost failed");
    },
  });
  if (!user || !originalId || drop?.user_email === user.email || drop?.hidden || drop?.is_flagged || drop?.status === "rejected") return null;
  return (
    <button type="button" disabled={mutation.isPending} onClick={(event) => { event.stopPropagation(); mutation.mutate(); }}
      className={compact ? "flex items-center gap-1.5 text-xs font-bold disabled:opacity-50" : "flex flex-col items-center gap-1 disabled:opacity-50"}
      style={{ color: existing ? "#10B981" : dark ? "#FFFFFF" : "#0B3FD9" }} title={existing ? "Undo repost" : "Repost"}>
      <span
        className={compact ? "" : "w-11 h-11 rounded-full flex items-center justify-center"}
        style={compact ? undefined : {
          background: "rgba(255,255,255,0.96)",
          border: "1px solid #D6E4FF",
          boxShadow: "0 4px 12px rgba(11, 63, 217, 0.12)",
          color: existing ? "#10B981" : "#0B3FD9",
        }}
      >
        <Repeat2 className="w-5 h-5" />
      </span>
      <span className={compact ? "" : "text-[11px] font-black"} style={compact ? undefined : { textShadow: dark ? "0 1px 4px rgba(0,0,0,0.65)" : "none" }}>{compact ? (existing ? "Undo repost" : "Repost") : (drop.reposts_count || 0)}</span>
    </button>
  );
}