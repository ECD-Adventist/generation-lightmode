import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";
import { Heart, Trash2, Send, Loader2, Globe, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const TYPES = ["all", "status", "prayer"];
const TYPE_COLORS = { status: "#00CFFF", prayer: "#8A5CFF" };
const TYPE_LABEL = { status: "⚡ Status", prayer: "🙏 Prayer" };

export default function AdminActivityFeedTab({ currentUser }) {
  const [filter, setFilter] = useState("all");
  const [postText, setPostText] = useState("");
  const [postType, setPostType] = useState("status");
  const queryClient = useQueryClient();

  const { data: moments = [], isLoading } = useQuery({
    queryKey: ["community_moments"],
    queryFn: () => base44.entities.CommunityMoment.list("-created_date", 100),
    refetchInterval: 30000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin_users_feed"],
    queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(r => r.data || []),
    staleTime: 60000,
  });

  // Real-time
  useEffect(() => {
    const unsub = base44.entities.CommunityMoment.subscribe(event => {
      queryClient.invalidateQueries({ queryKey: ["community_moments"] });
    });
    return unsub;
  }, [queryClient]);

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!postText.trim()) return;
      await base44.entities.CommunityMoment.create({
        user_email: currentUser.email,
        type: postType,
        content: postText.trim(),
        likes_count: 0,
      });
    },
    onSuccess: () => {
      setPostText("");
      toast.success("Posted!");
      queryClient.invalidateQueries({ queryKey: ["community_moments"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (moment) => {
      await base44.entities.CommunityMoment.update(moment.id, { likes_count: (moment.likes_count || 0) + 1 });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community_moments"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.CommunityMoment.delete(id);
    },
    onSuccess: () => {
      toast.success("Deleted.");
      queryClient.invalidateQueries({ queryKey: ["community_moments"] });
    },
  });

  const getUserInfo = (email) => users.find(u => u.email === email) || { full_name: email?.split("@")[0] || "Member", email };

  const filtered = moments.filter(m => filter === "all" || m.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">⚡ Community Activity Feed</h1>
        <p className="text-gray-400 mt-1 text-sm">Live Glow moments from across the movement — status updates and prayer requests.</p>
      </div>

      {/* Post composer */}
      <div className="bg-[#121826] border border-white/10 rounded-2xl p-5">
        <div className="flex gap-3 mb-3">
          <img
            src={currentUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
            className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
            alt=""
          />
          <textarea
            value={postText}
            onChange={e => setPostText(e.target.value)}
            placeholder="Share a Glow moment or prayer request with the community..."
            className="flex-1 bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white resize-none min-h-[80px] focus:outline-none focus:border-[#00CFFF]/40 placeholder-gray-600"
            maxLength={280}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {["status", "prayer"].map(t => (
              <button
                key={t}
                onClick={() => setPostType(t)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border transition"
                style={postType === t
                  ? { background: `${TYPE_COLORS[t]}22`, borderColor: `${TYPE_COLORS[t]}50`, color: TYPE_COLORS[t] }
                  : { borderColor: "rgba(255,255,255,0.08)", color: "#6B7280" }}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-600">{postText.length}/280</span>
            <button
              onClick={() => postMutation.mutate()}
              disabled={!postText.trim() || postMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80 transition disabled:opacity-40"
            >
              {postMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition capitalize ${filter === t ? "bg-[#00CFFF]/15 border-[#00CFFF]/40 text-[#00CFFF]" : "border-white/10 text-gray-400 hover:text-white"}`}
          >
            {t === "all" ? "🌍 All" : TYPE_LABEL[t]}
            {t !== "all" && <span className="ml-1.5 text-[9px] opacity-60">{moments.filter(m => m.type === t).length}</span>}
          </button>
        ))}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#00CFFF] animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-[#121826]/50 rounded-2xl border border-white/5">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-bold">No moments yet.</p>
          <p className="text-xs mt-1">Be the first to post a Glow moment!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(moment => {
            const u = getUserInfo(moment.user_email);
            const typeColor = TYPE_COLORS[moment.type] || "#00CFFF";
            return (
              <div key={moment.id} className="bg-[#121826] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition">
                <div className="flex items-start gap-3">
                  <img
                    src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                    className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm text-white">{u.full_name || u.email}</span>
                      {u.country && <span className="text-[10px] text-gray-500">📍 {u.country}</span>}
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30` }}>
                        {moment.type === "prayer" ? "🙏 Prayer" : "⚡ Status"}
                      </span>
                      <span className="text-[10px] text-gray-600 ml-auto">
                        {moment.created_date ? formatDistanceToNow(new Date(moment.created_date), { addSuffix: true }) : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{moment.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => likeMutation.mutate(moment)}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#00CFFF] transition"
                      >
                        <Heart size={13} /> {moment.likes_count || 0}
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(moment.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition ml-auto"
                        title="Delete post"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}