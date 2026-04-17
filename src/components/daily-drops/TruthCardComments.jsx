import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function TruthCardComments({ dropId, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["dropComments", dropId],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: dropId }, '-created_date'),
    enabled: isOpen,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: isOpen,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user) { toast.error("Please log in to comment"); return; }
      if (!newComment.trim()) return;
      await base44.entities.GlowDropComment.create({
        drop_id: dropId,
        user_email: user.email,
        content: newComment.trim(),
      });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["dropComments", dropId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GlowDropComment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dropComments", dropId] }),
  });

  const getUserInfo = (email) => allUsers.find((u) => u.email === email) || { full_name: email?.split("@")[0] };

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-bold transition"
        style={{ color: "#6B7FA0" }}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {isOpen ? "Hide Comments" : "Comments"}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Input */}
          {user && (
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addMutation.mutate()}
                placeholder="Share a reflection..."
                className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
              />
              <button
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !newComment.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition disabled:opacity-40"
                style={{ background: "rgba(31, 184, 255, 0.1)", color: "#0B3FD9" }}
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gray-500 animate-spin" /></div>
          ) : comments.length === 0 ? (
            <p className="text-xs py-2" style={{ color: "#8A97B5" }}>No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comments.map((c) => {
                const commenter = getUserInfo(c.user_email);
                return (
                  <div key={c.id} className="flex gap-2 group">
                    <Link
                      to={`${createPageUrl("Profile")}?user=${encodeURIComponent(c.user_email)}`}
                      className="w-7 h-7 rounded-full p-[1.5px] shrink-0"
                      style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF" }}>
                        <img
                          src={commenter.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="rounded-xl px-3 py-2" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                      <Link
                        to={`${createPageUrl("Profile")}?user=${encodeURIComponent(c.user_email)}`}
                        className="text-xs font-bold transition"
                        style={{ color: "#0B3FD9" }}
                        >
                          {commenter.full_name || c.user_email?.split("@")[0]}
                        </Link>
                        <p className="text-xs mt-0.5 whitespace-pre-line" style={{ color: "#4A5878" }}>{c.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 px-1">
                        <span className="text-[10px]" style={{ color: "#8A97B5" }}>
                          {c.created_date ? formatDistanceToNow(new Date(c.created_date.endsWith('Z') ? c.created_date : c.created_date + 'Z'), { addSuffix: true }) : "just now"}
                        </span>
                        {user?.email === c.user_email && (
                          <button
                            onClick={() => deleteMutation.mutate(c.id)}
                            className="text-[10px] hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                            style={{ color: "#8A97B5" }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}