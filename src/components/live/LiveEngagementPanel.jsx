import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const reactions = ["🙏", "❤️", "🔥", "🙌"];

export default function LiveEngagementPanel({ session, currentUser }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ["liveComments", session?.id],
    queryFn: () => base44.entities.LiveComment.filter({ session_id: session.id }, "-created_date"),
    enabled: !!session?.id,
  });

  const { data: liveReactions = [] } = useQuery({
    queryKey: ["liveReactions", session?.id],
    queryFn: () => base44.entities.LiveReaction.filter({ session_id: session.id }, "-created_date"),
    enabled: !!session?.id,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["liveUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (!session?.id) return;
    const unsubscribeComments = base44.entities.LiveComment.subscribe((event) => {
      if (event.data?.session_id === session.id) queryClient.invalidateQueries({ queryKey: ["liveComments", session.id] });
    });
    const unsubscribeReactions = base44.entities.LiveReaction.subscribe((event) => {
      if (event.data?.session_id === session.id) queryClient.invalidateQueries({ queryKey: ["liveReactions", session.id] });
    });
    return () => {
      unsubscribeComments();
      unsubscribeReactions();
    };
  }, [session?.id, queryClient]);

  const reactionCounts = useMemo(() => reactions.reduce((accumulator, reaction) => ({ ...accumulator, [reaction]: liveReactions.filter((entry) => entry.reaction === reaction).length }), {}), [liveReactions]);
  const getName = (email) => allUsers.find((user) => user.email === email)?.full_name || email?.split("@")[0] || "Believer";

  return (
    <div className="bg-[#121826] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-full">
      <div className="px-4 py-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-white">Live engagement</h3>
      </div>

      <div className="px-4 py-4 border-b border-white/10 flex flex-wrap gap-2">
        {reactions.map((reaction) => (
          <button
            key={reaction}
            onClick={() => base44.entities.LiveReaction.create({ session_id: session.id, user_email: currentUser.email, reaction })}
            className="px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm"
          >
            {reaction} {reactionCounts[reaction] || 0}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#0F1524]">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white/5 rounded-2xl px-4 py-3">
            <div className="text-xs font-semibold text-[#00CFFF] mb-1">{getName(comment.user_email)}</div>
            <div className="text-sm text-white">{comment.content}</div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          base44.entities.LiveComment.create({ session_id: session.id, user_email: currentUser.email, content: draft });
          setDraft("");
        }}
        className="px-4 py-3 border-t border-white/10 flex gap-2"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Say amen, pray, encourage..."
          className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00CFFF]/40"
        />
        <button type="submit" className="px-4 rounded-2xl bg-[#00CFFF] text-black font-semibold">Send</button>
      </form>
    </div>
  );
}