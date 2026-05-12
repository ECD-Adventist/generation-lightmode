import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Heart, Sparkles, Users, BookOpen, ArrowRight, MessageCircle, UserPlus, UserCheck, ChevronLeft, Globe } from "lucide-react";
import { format } from "date-fns";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";

const ACCOUNT_EMAIL = "system@lightmode.com";
const ACCOUNT_NAME = "Generation LightMode";
const ACCOUNT_IMAGE = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg";
const COVER_GRADIENT = "linear-gradient(120deg, #0B1B3D 0%, #0B2870 25%, #0B3FD9 50%, #1FB8FF 80%, #5AD8FF 100%)";

export default function MobileGenerationLightMode() {
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
      {/* Top bar */}
      <div className="sticky top-0 z-40 safe-pt backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl("Feed")} className="flex items-center gap-1 p-2 -ml-2" style={{ color: "#0B3FD9" }}>
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Feed</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#0B3FD9" }}>Official</span>
          <div className="w-12" />
        </div>
      </div>

      {/* Cover */}
      <div className="relative h-44 overflow-hidden" style={{ background: "#0B1B3D" }}>
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/6a1c1025d_Gemini_Generated_Image_s3fvlrs3fvlrs3fv.png?v=2"
          alt="Generation LightMode cover"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,27,61,0.12), rgba(11,27,61,0.72))" }} />
        <div className="absolute bottom-2 right-4 text-white/20 text-4xl font-black font-['Space_Grotesk'] select-none pointer-events-none tracking-tighter leading-none">GLM ⚡</div>
      </div>

      {/* Profile block */}
      <div className="px-4 -mt-14 pb-5">
        <div className="flex items-end gap-3 mb-3">
          <div className="w-24 h-24 rounded-full p-[3px] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 50%, #0B2870 100%)", boxShadow: "0 8px 24px rgba(11,63,217,0.25)" }}>
            <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "3px solid #FFFFFF" }}>
              <img src={ACCOUNT_IMAGE} alt={ACCOUNT_NAME} className="w-full h-full object-cover" />
            </div>
          </div>
          {me?.email && me.email !== ACCOUNT_EMAIL && (
            <button
              onClick={() => followMutation.mutate()}
              className="mb-1 px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
              style={isFollowing
                ? { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }
                : { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11,63,217,0.3)" }}
            >
              {isFollowing ? <><UserCheck className="w-3.5 h-3.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <h1 className="text-xl font-black font-['Space_Grotesk']">{ACCOUNT_NAME}</h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(11,63,217,0.08)", color: "#0B3FD9", border: "1px solid #D6E4FF" }}>
            <Sparkles className="w-2.5 h-2.5" /> Official
          </span>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#4A5878" }}>
          The official Generation LightMode profile — daily drops, movement announcements, campaign highlights. Faith. Always On. ⚡
        </p>
        <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: "#6B7FA0" }}>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} /> <strong style={{ color: "#0B1B3D" }}>{follows.length}</strong> followers</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" style={{ color: "#CC7A00" }} /> <strong style={{ color: "#0B1B3D" }}>{posts.length}</strong> posts</span>
          <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" style={{ color: "#1FB8FF" }} /> Global</span>
        </div>
      </div>

      {/* Category tiles */}
      <div className="px-4 mb-5 space-y-2.5">
        {[
          { icon: "🔐", label: "Codes of Truth", count: codeOfTruthCount, color: "#0B3FD9", bg: "rgba(11,63,217,0.06)", border: "#D6E4FF", tab: "codes_of_truth" },
          { icon: "💯", label: "Keep It 100", count: keepIt100Count, color: "#CC7A00", bg: "rgba(255,208,0,0.06)", border: "#FFE4A0", tab: "keeping_it_100" },
          { icon: "📖", label: "Daily Verse", count: dailyVerseCount, color: "#8A5CFF", bg: "rgba(138,92,255,0.06)", border: "rgba(138,92,255,0.25)", tab: "daily_verse" },
        ].map(item => (
          <Link
            key={item.tab}
            to={`${createPageUrl("DailyTruthFeed")}?tab=${item.tab}`}
            className="rounded-2xl p-4 flex items-center gap-3 no-underline active:scale-[0.99] transition"
            style={{ background: "#FFFFFF", border: `1px solid ${item.border}`, boxShadow: "0 2px 8px rgba(11,63,217,0.04)" }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: item.bg }}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{item.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>{item.count} posts</div>
            </div>
            <ArrowRight className="w-4 h-4" style={{ color: item.color }} />
          </Link>
        ))}
      </div>

      {/* Posts list */}
      <div className="px-4 pb-24">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold font-['Space_Grotesk']">Latest Posts</h2>
          <Link to={createPageUrl("DailyTruthFeed")} className="text-xs font-bold flex items-center gap-1 no-underline" style={{ color: "#0B3FD9" }}>
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          {posts.slice(0, 10).map((post, idx) => {
            const catStyle = getCategoryStyle(post.category);
            const postedDate = post.created_date ? new Date(post.created_date.endsWith('Z') ? post.created_date : post.created_date + 'Z') : null;
            return (
              <div key={post.id} className={`p-4 ${idx > 0 ? "border-t" : ""}`} style={{ borderColor: "#F0F4FA" }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
                    {catStyle.icon} {post.category || "Daily Drop"}
                  </span>
                  {postedDate && (
                    <span className="text-[10px]" style={{ color: "#8A97B5" }}>{format(postedDate, "MMM d")}</span>
                  )}
                </div>
                {post.category === "Keep It 100" && (
                  <KeepIt100Poster text={post.reflection} verse={post.verse} className="w-full aspect-[4/5] rounded-2xl mb-3" />
                )}
                {post.category === "Code of Truth" && (
                  <CodesOfTruthPoster text={post.reflection} verse={post.verse} className="w-full aspect-[4/5] rounded-2xl mb-3" />
                )}
                {post.verse && <p className="font-bold text-sm mb-1" style={{ color: "#0B3FD9" }}>{post.verse}</p>}
                {post.reflection && <p className="text-[13px] leading-relaxed whitespace-pre-line line-clamp-3" style={{ color: "#3A4A6B" }}>{post.reflection}</p>}
                {post.hashtags && <div className="text-[11px] font-medium mt-1.5" style={{ color: "#0B3FD9" }}>{post.hashtags}</div>}
                <div className="flex items-center gap-4 mt-2 text-[11px]" style={{ color: "#8A97B5" }}>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.shares_count || 0}</span>
                </div>
              </div>
            );
          })}
          {posts.length === 0 && (
            <div className="p-8 text-center" style={{ color: "#8A97B5" }}>
              <div className="text-3xl mb-2">✨</div>
              <p className="text-sm">No posts yet. Stay tuned!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}