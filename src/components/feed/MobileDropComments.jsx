import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

/**
 * Inline comment thread for the mobile feed card.
 * Loads comments only when opened so the feed stays light.
 */
export default function MobileDropComments({ drop, user }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [replyToComment, setReplyToComment] = useState(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["dropComments", drop.id],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: drop.id }, "created_date", 100),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user) { toast.error("Please log in to comment"); return; }
      await base44.functions.invoke("createGlowDropComment", { drop_id: drop.id, content: text.trim(), parent_comment_id: replyToComment?.id || undefined });
    },
    onSuccess: () => {
      setText("");
      setReplyToComment(null);
      queryClient.invalidateQueries({ queryKey: ["dropComments", drop.id] });
    },
    onError: () => toast.error("Could not post your comment"),
  });

  return (
    <div className="px-3 pb-3">
      <div className="rounded-2xl p-3 space-y-3" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
        {isLoading ? (
          <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin" style={{ color: "#0B3FD9" }} /></div>
        ) : comments.length === 0 ? (
          <p className="text-[12px] italic text-center py-2" style={{ color: "#8A97B5" }}>No comments yet. Start the conversation 🔥</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {comments.map(c => (
              <div key={c.id} className="rounded-xl px-3 py-2" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                <div className="text-[11px] font-black" style={{ color: "#0B3FD9" }}>{c.user_email?.split("@")[0] || "Member"}</div>
                <p className="text-[13px] leading-snug" style={{ color: "#0B1B3D" }}>{c.content}</p>
                {user && c.user_email !== user.email && <button type="button" onClick={() => setReplyToComment(c)} className="mt-1 text-[10px] font-black" style={{ color: "#0B3FD9" }}>Reply</button>}
              </div>
            ))}
          </div>
        )}

        {replyToComment && <div className="flex items-center justify-between text-[11px]" style={{ color: "#6B7FA0" }}><span>Replying to {replyToComment.user_email?.split("@")[0]}</span><button type="button" onClick={() => setReplyToComment(null)} className="font-black" style={{ color: "#0B3FD9" }}>Cancel</button></div>}
        <form
          onSubmit={(e) => { e.preventDefault(); if (text.trim()) addComment.mutate(); }}
          className="flex items-center gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 h-10 px-4 rounded-full text-[13px] focus:outline-none"
            style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
          />
          <button
            type="submit"
            disabled={!text.trim() || addComment.isPending}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}
            aria-label="Post comment"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}