import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const reactions = ["🙏", "❤️", "🔥", "🙌"];

export default function LiveEngagementPanel({ session, currentUser }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: comments = [] } = useQuery({ queryKey: ["liveComments", session?.id], queryFn: () => base44.entities.LiveComment.filter({ session_id: session.id }, "-created_date"), enabled: !!session?.id });
  const { data: liveReactions = [] } = useQuery({ queryKey: ["liveReactions", session?.id], queryFn: () => base44.entities.LiveReaction.filter({ session_id: session.id }, "-created_date"), enabled: !!session?.id });
  const { data: allUsers = [] } = useQuery({ queryKey: ["liveUsers"], queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; }, enabled: !!currentUser });

  useEffect(() => {
    if (!session?.id) return;
    const unC = base44.entities.LiveComment.subscribe(e => { if (e.data?.session_id === session.id) queryClient.invalidateQueries({ queryKey: ["liveComments", session.id] }); });
    const unR = base44.entities.LiveReaction.subscribe(e => { if (e.data?.session_id === session.id) queryClient.invalidateQueries({ queryKey: ["liveReactions", session.id] }); });
    return () => { unC(); unR(); };
  }, [session?.id, queryClient]);

  const reactionCounts = useMemo(() => reactions.reduce((a, r) => ({ ...a, [r]: liveReactions.filter(e => e.reaction === r).length }), {}), [liveReactions]);
  const getName = (email) => allUsers.find(u => u.email === email)?.full_name || email?.split("@")[0] || "Believer";

  return (
    <div className="rounded-[1.75rem] overflow-hidden flex flex-col h-full font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
      <div className="px-4 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
        <h3 className="text-lg font-bold" style={{ color: "#0B1B3D" }}>Live engagement</h3>
      </div>
      <div className="px-4 py-4 border-b flex flex-wrap gap-2" style={{ borderColor: "#E6ECF5" }}>
        {reactions.map(r => (
          <button key={r} onClick={() => base44.entities.LiveReaction.create({ session_id: session.id, user_email: currentUser.email, reaction: r })} className="px-3 py-2 rounded-full text-sm transition" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}
            onMouseOver={e => e.currentTarget.style.background = "#EEF3FF"}
            onMouseOut={e => e.currentTarget.style.background = "#F6F8FC"}>
            {r} {reactionCounts[r] || 0}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#F6F8FC" }}>
        {comments.map(c => (
          <div key={c.id} className="rounded-2xl px-4 py-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
            <div className="text-xs font-semibold mb-1" style={{ color: "#0B3FD9" }}>{getName(c.user_email)}</div>
            <div className="text-sm" style={{ color: "#0B1B3D" }}>{c.content}</div>
          </div>
        ))}
      </div>
      <form onSubmit={e => { e.preventDefault(); if (!draft.trim()) return; base44.entities.LiveComment.create({ session_id: session.id, user_email: currentUser.email, content: draft }); setDraft(""); }} className="px-4 py-3 border-t flex gap-2" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Say amen, pray, encourage..." className="flex-1 h-11 rounded-2xl px-4 focus:outline-none" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }} />
        <button type="submit" className="px-4 rounded-2xl font-semibold" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>Send</button>
      </form>
    </div>
  );
}