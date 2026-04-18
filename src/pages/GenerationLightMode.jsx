import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Globe, Heart, Sparkles, Bell, Users, BookOpen, ArrowRight, Share2, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const ACCOUNT_EMAIL = "system@lightmode.com";
const ACCOUNT_NAME = "Generation LightMode";
const ACCOUNT_IMAGE = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg";
const COVER_GRADIENT = "linear-gradient(135deg, #0B0F1A 0%, #0B3FD9 40%, #1FB8FF 65%, #FFD000 100%)";

export default function GenerationLightMode() {
  const queryClient = useQueryClient();

  const { data: me } = useQuery({ queryKey: ["glmMe"], queryFn: () => base44.auth.me() });
  const { data: follows = [] } = useQuery({
    queryKey: ["glmFollowers"],
    queryFn: () => base44.entities.Follow.filter({ following_email: ACCOUNT_EMAIL })
  });
  const { data: myFollowing = [] } = useQuery({
    queryKey: ["glmMyFollowing", me?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: me?.email }),
    enabled: !!me?.email
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["glmPosts"],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: ACCOUNT_EMAIL }, "-created_date", 50)
  });

  const isFollowing = myFollowing.some((f) => f.following_email === ACCOUNT_EMAIL);

  const followMutation = useMutation({
    mutationFn: async () => {
      const existing = myFollowing.find((f) => f.following_email === ACCOUNT_EMAIL);
      if (existing) return base44.entities.Follow.delete(existing.id);
      return base44.entities.Follow.create({ follower_email: me.email, following_email: ACCOUNT_EMAIL });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glmFollowers"] });
      queryClient.invalidateQueries({ queryKey: ["glmMyFollowing", me?.email] });
    }
  });

  const codeOfTruthCount = posts.filter(p => p.category === "Code of Truth").length;
  const keepIt100Count = posts.filter(p => p.category === "Keep It 100").length;
  const dailyVerseCount = posts.filter(p => p.category === "Daily Verse").length;

  const getCategoryStyle = (cat) => {
    if (cat === "Code of Truth") return { bg: "rgba(0,207,255,0.08)", border: "#B8E5FF", color: "#0B3FD9", icon: "🔐" };
    if (cat === "Keep It 100") return { bg: "rgba(255,208,0,0.08)", border: "#FFE4A0", color: "#CC7A00", icon: "💯" };
    if (cat === "Daily Verse") return { bg: "rgba(138,92,255,0.08)", border: "rgba(138,92,255,0.25)", color: "#8A5CFF", icon: "📖" };
    return { bg: "#F6F8FC", border: "#E6ECF5", color: "#4A5878", icon: "✨" };
  };

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <div className="max-w-4xl mx-auto">
        {/* Cover Section */}
        <div className="relative">
          <div className="h-48 sm:h-64 w-full relative overflow-hidden" style={{ background: COVER_GRADIENT }}>
            <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3), transparent 50%)" }} />
            <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 30%, rgba(255,208,0,0.5), transparent 40%)" }} />
            {/* Brand text watermark */}
            <div className="absolute bottom-4 right-6 text-white/10 text-6xl sm:text-8xl font-black font-['Space_Grotesk'] select-none pointer-events-none tracking-tighter">GLM</div>
          </div>

          {/* Profile card overlapping cover */}
          <div className="relative -mt-20 px-4 sm:px-6 pb-6">
            <div className="rounded-[2rem] overflow-hidden bg-white border border-[#E6ECF5]" style={{ boxShadow: "0 12px 48px rgba(11,63,217,0.1)" }}>
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                  {/* Avatar */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 shrink-0 -mt-20 sm:-mt-24" style={{ background: "linear-gradient(135deg, #FFD000 0%, #1FB8FF 50%, #0B3FD9 100%)", boxShadow: "0 8px 32px rgba(11,63,217,0.2)" }}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                      <img src={ACCOUNT_IMAGE} alt={ACCOUNT_NAME} className="w-full h-full rounded-full object-cover" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-black font-['Space_Grotesk']">{ACCOUNT_NAME}</h1>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: "linear-gradient(90deg, rgba(31,184,255,0.1), rgba(11,63,217,0.08))", color: "#0B3FD9", border: "1px solid #D6E4FF" }}>
                        <Sparkles className="w-3 h-3" /> Official Account
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed max-w-xl mb-4" style={{ color: "#4A5878" }}>
                      The official Generation LightMode profile — daily drops, movement announcements, campaign highlights, and platform updates. Faith. Always On. ⚡
                    </p>
                    <div className="flex items-center gap-5 text-sm flex-wrap justify-center sm:justify-start" style={{ color: "#6B7FA0" }}>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4" style={{ color: "#0B3FD9" }} /> <strong style={{ color: "#0B1B3D" }}>{follows.length}</strong> followers</span>
                      <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" style={{ color: "#CC7A00" }} /> <strong style={{ color: "#0B1B3D" }}>{posts.length}</strong> posts</span>
                      <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" style={{ color: "#1FB8FF" }} /> Global movement</span>
                    </div>
                  </div>

                  {/* Follow Button */}
                  {me?.email && me.email !== ACCOUNT_EMAIL && (
                    <button
                      onClick={() => followMutation.mutate()}
                      className="px-7 py-3 rounded-full font-bold text-sm transition-all shrink-0 flex items-center gap-2"
                      style={isFollowing
                        ? { background: "#F6F8FC", color: "#4A5878", border: "1px solid #E6ECF5" }
                        : { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 16px rgba(11,63,217,0.3)" }}
                    >
                      {isFollowing ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Categories Stats */}
        <div className="px-4 sm:px-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "🔐", label: "Codes of Truth", count: codeOfTruthCount, color: "#0B3FD9", bg: "rgba(11,63,217,0.06)", border: "#D6E4FF", tab: "codes_of_truth" },
              { icon: "💯", label: "Keep It 100", count: keepIt100Count, color: "#CC7A00", bg: "rgba(255,208,0,0.06)", border: "#FFE4A0", tab: "keeping_it_100" },
              { icon: "📖", label: "Daily Verse", count: dailyVerseCount, color: "#8A5CFF", bg: "rgba(138,92,255,0.06)", border: "rgba(138,92,255,0.25)", tab: "daily_verse" },
            ].map(item => (
              <Link
                key={item.tab}
                to={`${createPageUrl("DailyTruthFeed")}?tab=${item.tab}`}
                className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5 no-underline group"
                style={{ background: "#FFFFFF", border: `1px solid ${item.border}`, boxShadow: "0 4px 12px rgba(11,63,217,0.04)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: item.bg }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>{item.count} posts</div>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: item.color }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Latest Posts */}
        <div className="px-4 sm:px-6 pb-12">
          <div className="rounded-[2rem] bg-white border border-[#E6ECF5] overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(11,63,217,0.06)" }}>
            <div className="flex items-center justify-between p-6 pb-4 border-b" style={{ borderColor: "#E6ECF5" }}>
              <h2 className="text-xl font-bold font-['Space_Grotesk']">Latest Posts</h2>
              <Link to={createPageUrl("DailyTruthFeed")} className="text-sm font-bold flex items-center gap-1 no-underline" style={{ color: "#0B3FD9" }}>
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: "#F0F4FA" }}>
              {posts.slice(0, 10).map((post) => {
                const catStyle = getCategoryStyle(post.category);
                const postedDate = post.created_date ? new Date(post.created_date.endsWith('Z') ? post.created_date : post.created_date + 'Z') : null;
                return (
                  <div key={post.id} className="p-5 sm:p-6 hover:bg-[#FAFBFE] transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
                        {catStyle.icon} {post.category || "Daily Drop"}
                      </span>
                      {postedDate && (
                        <span className="text-[11px]" style={{ color: "#8A97B5" }}>{format(postedDate, "MMM d, yyyy")}</span>
                      )}
                    </div>
                    {post.verse && (
                      <p className="font-bold text-sm mb-1.5" style={{ color: "#0B3FD9" }}>{post.verse}</p>
                    )}
                    {post.reflection && (
                      <p className="text-sm leading-relaxed whitespace-pre-line line-clamp-3" style={{ color: "#3A4A6B" }}>{post.reflection}</p>
                    )}
                    {post.hashtags && (
                      <div className="text-xs font-medium mt-2" style={{ color: "#0B3FD9" }}>{post.hashtags}</div>
                    )}
                    <div className="flex items-center gap-5 mt-3 text-xs" style={{ color: "#8A97B5" }}>
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likes_count || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.shares_count || 0}</span>
                    </div>
                  </div>
                );
              })}
              {posts.length === 0 && (
                <div className="p-10 text-center" style={{ color: "#8A97B5" }}>
                  <div className="text-4xl mb-3">✨</div>
                  <p>No posts yet. Stay tuned!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}