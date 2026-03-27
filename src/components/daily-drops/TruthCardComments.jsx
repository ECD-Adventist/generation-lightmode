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
        className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition"
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
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00CFFF]/40"
              />
              <button
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !newComment.trim()}
                className="w-9 h-9 rounded-xl bg-[#00CFFF]/20 text-[#00CFFF] flex items-center justify-center hover:bg-[#00CFFF]/30 transition disabled:opacity-40"
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gray-500 animate-spin" /></div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comments.map((c) => {
                const commenter = getUserInfo(c.user_email);
                return (
                  <div key={c.id} className="flex gap-2 group">
                    <Link
                      to={`${createPageUrl("Profile")}?user=${encodeURIComponent(c.user_email)}`}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[1.5px] shrink-0"
                    >
                      <div className="w-full h-full rounded-full bg-[#0B0F1A] overflow-hidden">
                        <img
                          src={commenter.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white/5 rounded-xl px-3 py-2">
                        <Link
                          to={`${createPageUrl("Profile")}?user=${encodeURIComponent(c.user_email)}`}
                          className="text-xs font-bold text-white hover:text-[#00CFFF] transition"
                        >
                          {commenter.full_name || c.user_email?.split("@")[0]}
                        </Link>
                        <p className="text-xs text-gray-300 mt-0.5 whitespace-pre-line">{c.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 px-1">
                        <span className="text-[10px] text-gray-600">
                          {c.created_date ? formatDistanceToNow(new Date(c.created_date.endsWith('Z') ? c.created_date : c.created_date + 'Z'), { addSuffix: true }) : "just now"}
                        </span>
                        {user?.email === c.user_email && (
                          <button
                            onClick={() => deleteMutation.mutate(c.id)}
                            className="text-[10px] text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
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