import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Globe, Heart, Sparkles, Bell, Users, BookOpen, ArrowRight, Share2, MessageCircle, UserPlus, UserCheck, Home, Zap } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import AppFooter from "@/components/AppFooter";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileGenerationLightMode from "@/components/profile/MobileGenerationLightMode";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";

const ACCOUNT_EMAIL = "system@lightmode.com";
const ACCOUNT_NAME = "Generation LightMode";
const ACCOUNT_IMAGE = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg";
const HERO_BG_URL = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/5be5a34f8_generated_image.png";

export default function GenerationLightMode() {
  const isMobile = useIsMobile();
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

  if (isMobile) return <MobileGenerationLightMode />;

  const getCategoryStyle = (cat) => {
    if (cat === "Code of Truth") return { bg: "rgba(0,207,255,0.08)", border: "#B8E5FF", color: "#0B3FD9", icon: "🔐" };
    if (cat === "Keep It 100") return { bg: "rgba(255,208,0,0.08)", border: "#FFE4A0", color: "#CC7A00", icon: "💯" };
    if (cat === "Daily Verse") return { bg: "rgba(138,92,255,0.08)", border: "rgba(138,92,255,0.25)", color: "#8A5CFF", icon: "📖" };
    return { bg: "#F6F8FC", border: "#E6ECF5", color: "#4A5878", icon: "✨" };
  };

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#FAFBF7", color: "#071733" }}>
      {/* Hero Cover with Background Image */}
      <div 
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(7,23,51,0.75) 0%, rgba(7,23,51,0.65) 100%), url(${HERO_BG_URL}) center/cover no-repeat`,
          backgroundBlendMode: "overlay",
          minHeight: "500px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        {/* Top Nav */}
        <div className="border-b border-white/10">
          <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-6">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="LightMode" className="h-9 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-5 text-white/90">
              {[
                { to: "Feed", icon: <Home className="w-3.5 h-3.5" />, label: "Feed" },
                { to: "GlowGroups", icon: <Users className="w-3.5 h-3.5" />, label: "Groups" },
                { to: "Notifications", icon: <Bell className="w-3.5 h-3.5" />, label: "Alerts" },
                { to: "Dashboard", icon: <Zap className="w-3.5 h-3.5" />, label: "Dashboard" },
                { to: "Messages", icon: <MessageCircle className="w-3.5 h-3.5" />, label: "Messages" },
              ].map(item => (
                <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 text-sm font-medium no-underline transition hover:text-[#D6B86A]">
                  {item.icon}<span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Title Section */}
        <div className="max-w-5xl mx-auto px-5 py-16">
          <div className="flex items-end gap-8">
            <h1 className="font-['Space_Grotesk'] font-black uppercase leading-[0.9] tracking-[-0.06em] text-[#D6B86A] text-[72px] md:text-[108px] lg:text-[128px]">
              GENERATION<br />LIGHTMODE
            </h1>
            <div className="hidden md:block pb-4 text-[#D6B86A] font-['Space_Grotesk'] font-black text-6xl tracking-tight">GLM ⚡</div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 -mt-24 relative z-10">
        <section className="rounded-[22px] bg-white shadow-[0_18px_45px_rgba(7,23,51,0.16)] border border-[#EFE6D0] overflow-hidden">
          {/* Cover Image */}
          <div 
            className="h-48 bg-cover bg-center relative"
            style={{
              background: `linear-gradient(135deg, rgba(7,23,51,0.4) 0%, rgba(7,23,51,0.2) 100%), url(${HERO_BG_URL}) center/cover no-repeat`,
              backgroundBlendMode: "overlay"
            }}
          />

          {/* Profile Info */}
          <div className="px-7 pt-0 pb-7">
            <div className="flex flex-col md:flex-row md:items-start gap-6 -mt-16 relative z-10">
              <div className="w-32 h-32 rounded-full p-[4px] shrink-0" style={{ background: "linear-gradient(135deg, #F3E4B8 0%, #B58B35 100%)" }}>
                <div className="w-full h-full rounded-full overflow-hidden bg-[#071733] border-[4px] border-white">
                  <img src={ACCOUNT_IMAGE} alt={ACCOUNT_NAME} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-4">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="text-3xl font-black font-['Space_Grotesk'] tracking-tight text-[#071733]">{ACCOUNT_NAME}</h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#EAF2FF] text-[#0B3FD9]">
                    <Sparkles className="w-3 h-3" /> Official Account
                  </span>
                </div>
                <p className="text-sm leading-relaxed max-w-2xl mb-4 text-[#1F2F4D]">
                  The official Generation LightMode profile — daily drops, movement announcements, campaign highlights, and platform updates. Faith. Always On. ⚡
                </p>
                <div className="flex flex-wrap items-center gap-5 text-sm text-[#5D6472]">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> <strong className="text-[#071733]">{follows.length}</strong> followers</span>
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-[#B58B35]" /> <strong className="text-[#071733]">{posts.length}</strong> posts</span>
                  <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Global movement</span>
                </div>
              </div>
              {me?.email && me.email !== ACCOUNT_EMAIL && (
                <button
                  onClick={() => followMutation.mutate()}
                  className="px-6 py-3 rounded-full font-bold text-sm transition-all shrink-0 flex items-center gap-2 md:mt-8"
                  style={isFollowing
                    ? { background: "#FAFBF7", color: "#071733", border: "1px solid #D8C391" }
                    : { background: "#071733", color: "#D6B86A", boxShadow: "0 10px 22px rgba(7,23,51,0.22)" }}
                >
                  {isFollowing ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">
          {[
            { icon: "🔐", label: "Codes of Truth", count: codeOfTruthCount, tab: "codes_of_truth" },
            { icon: "💯", label: "Keep It 100", count: keepIt100Count, tab: "keeping_it_100" },
            { icon: "📖", label: "Daily Verse", count: dailyVerseCount, tab: "daily_verse" },
          ].map(item => (
            <Link
              key={item.tab}
              to={`${createPageUrl("DailyTruthFeed")}?tab=${item.tab}`}
              className="rounded-2xl p-5 flex items-center gap-4 bg-white border border-[#D8C391] shadow-[0_12px_28px_rgba(181,139,53,0.13)] no-underline transition hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-[#F7F1E2]">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm text-[#071733]">{item.label}</div>
                <div className="text-xs mt-1 text-[#5D6472]">{item.count} posts</div>
              </div>
            </Link>
          ))}
        </section>

        <section className="pt-11 pb-16">
          <div className="flex items-center justify-between mb-5 px-5">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-[#071733]">Latest Posts</h2>
            <Link to={createPageUrl("DailyTruthFeed")} className="text-sm font-bold flex items-center gap-1 no-underline text-[#071733]">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div>
            {posts.length > 0 && (() => {
              const renderPost = (post, variant = "card") => {
                const catStyle = getCategoryStyle(post.category);
                const postedDate = post.created_date ? new Date(post.created_date.endsWith('Z') ? post.created_date : post.created_date + 'Z') : null;
                const hasPoster = post.category === "Keep It 100" || post.category === "Code of Truth";
                const Poster = post.category === "Keep It 100" ? KeepIt100Poster : CodesOfTruthPoster;
                const isFeatured = variant === "featured";
                const isCompact = variant === "compact";

                return (
                  <article key={post.id} className={`bg-white border border-[#D8C391] shadow-[0_12px_28px_rgba(7,23,51,0.09)] overflow-hidden rounded-2xl ${isFeatured ? "p-6" : isCompact ? "p-4" : "p-5"}`}>
                    {hasPoster && (isFeatured || !isCompact) && <Poster text={post.reflection} verse={post.verse} className={`w-full ${isFeatured ? "aspect-video" : "aspect-[4/5]"} rounded-xl mb-4`} />}
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F3E4B8] text-[#7C5A17]">
                          {catStyle.icon} {post.category || "Drop"}
                        </span>
                        {postedDate && <span className="text-[10px] text-[#7A8190]">{format(postedDate, "MMM d")}</span>}
                      </div>
                      {post.verse && (
                        <h3 className={`${isFeatured ? "text-xl" : isCompact ? "text-sm" : "text-base"} font-black leading-tight mb-2 text-[#071733]`}>
                          {post.verse}
                        </h3>
                      )}
                      {post.reflection && (
                        <p className={`${isCompact ? "text-xs line-clamp-2" : "text-sm line-clamp-3"} leading-relaxed whitespace-pre-line text-[#1F2F4D]`}>
                          {post.reflection}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-[#5D6472]">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes_count || 0}</span>
                        {!isCompact && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.shares_count || 0}</span>}
                      </div>
                    </div>
                  </article>
                );
              };

              return (
                <>
                  {/* Featured Post — Full width */}
                  <div className="mb-8">
                    {renderPost(posts[0], "featured")}
                  </div>

                  {/* Grid Layout — 3-col responsive */}
                  {posts.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                      {posts.slice(1, 13).map((post) => renderPost(post, "card"))}
                    </div>
                  )}
                </>
              );
            })()}
            {posts.length === 0 && (
              <div className="p-10 text-center rounded-2xl bg-white border border-[#D8C391] text-[#5D6472]">
                <div className="text-4xl mb-3">✨</div>
                <p>No posts yet. Stay tuned!</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}