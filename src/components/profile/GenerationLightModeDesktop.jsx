import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, BookOpen, Globe, Heart, Home, MessageCircle, Sparkles, UserCheck, UserPlus, Users, Zap } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import AppFooter from "@/components/AppFooter";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";

const HERO_COVER_URL = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/6a1c1025d_Gemini_Generated_Image_s3fvlrs3fvlrs3fv.png?v=2";

function PostArtwork({ post, className = "" }) {
  if (post?.category === "Keep It 100") {
    return <KeepIt100Poster text={post.reflection} verse={post.verse} className={className} />;
  }
  if (post?.category === "Code of Truth") {
    return <CodesOfTruthPoster text={post.reflection} verse={post.verse} className={className} />;
  }
  return null;
}

function CategoryCard({ item }) {
  return (
    <Link
      to={`${createPageUrl("DailyTruthFeed")}?tab=${item.tab}`}
      className="group rounded-[28px] p-6 no-underline transition-all hover:-translate-y-1"
      style={{ background: item.bg, border: `1px solid ${item.border}`, boxShadow: "0 18px 45px rgba(11,27,61,0.06)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-3xl mb-5">{item.icon}</div>
          <p className="text-[11px] uppercase tracking-[0.22em] font-black mb-2" style={{ color: item.color }}>Collection</p>
          <h3 className="text-xl font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{item.label}</h3>
          <p className="text-sm mt-2" style={{ color: "#6B5E48" }}>{item.count} curated posts</p>
        </div>
        <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: item.color }} />
      </div>
    </Link>
  );
}

function PostSnippet({ post, getCategoryStyle }) {
  const catStyle = getCategoryStyle(post.category);
  const postedDate = post.created_date ? new Date(post.created_date.endsWith("Z") ? post.created_date : `${post.created_date}Z`) : null;

  return (
    <article className="rounded-[24px] p-5 transition-all hover:-translate-y-0.5" style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(217,203,170,0.55)" }}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black" style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
          {catStyle.icon} {post.category || "Daily Drop"}
        </span>
        {postedDate && <span className="text-[11px]" style={{ color: "#8D7C5A" }}>{format(postedDate, "MMM d, yyyy")}</span>}
      </div>
      <PostArtwork post={post} className="w-full max-w-[210px] aspect-[4/5] rounded-2xl mb-4 shadow-lg" />
      {post.verse && <h4 className="font-black text-sm leading-relaxed mb-2" style={{ color: "#0B1B3D" }}>{post.verse}</h4>}
      {post.reflection && <p className="text-sm leading-relaxed line-clamp-3 whitespace-pre-line" style={{ color: "#4D5870" }}>{post.reflection}</p>}
      {post.hashtags && <p className="text-xs font-bold mt-3" style={{ color: "#0B3FD9" }}>{post.hashtags}</p>}
      <div className="flex items-center gap-5 mt-4 text-xs" style={{ color: "#8D7C5A" }}>
        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likes_count || 0}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.shares_count || 0}</span>
      </div>
    </article>
  );
}

export default function GenerationLightModeDesktop({
  me,
  follows,
  posts,
  isFollowing,
  followMutation,
  codeOfTruthCount,
  keepIt100Count,
  dailyVerseCount,
  getCategoryStyle,
  accountName,
  accountEmail,
  accountImage,
}) {
  const featuredPost = posts[0];
  const featuredStyle = featuredPost ? getCategoryStyle(featuredPost.category) : null;
  const featuredDate = featuredPost?.created_date ? new Date(featuredPost.created_date.endsWith("Z") ? featuredPost.created_date : `${featuredPost.created_date}Z`) : null;

  const categoryCards = [
    { icon: "🔐", label: "Codes of Truth", count: codeOfTruthCount, color: "#0B3FD9", bg: "#F8FBFF", border: "#D6E4FF", tab: "codes_of_truth" },
    { icon: "💯", label: "Keep It 100", count: keepIt100Count, color: "#A86B00", bg: "#FFF9E8", border: "#F1D894", tab: "keeping_it_100" },
    { icon: "📖", label: "Daily Verse", count: dailyVerseCount, color: "#5E3BB7", bg: "#FBF8FF", border: "#DACDF8", tab: "daily_verse" },
  ];

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#FAFBF7", color: "#0B1B3D" }}>
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(250,251,247,0.88)", borderColor: "rgba(217,203,170,0.55)" }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-1 rounded-full px-2 py-1" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(217,203,170,0.5)" }}>
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "GlowGroups", icon: <Users className="w-4 h-4" />, label: "Groups" },
              { to: "Notifications", icon: <Bell className="w-4 h-4" />, label: "Alerts" },
              { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
              { to: "Messages", icon: <MessageCircle className="w-4 h-4" />, label: "Messages" },
            ].map((item) => (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-4 py-2 rounded-full transition text-sm font-bold no-underline" style={{ color: "#324057" }}>
                {item.icon}<span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 20% 0%, rgba(255,208,0,0.16), transparent 36%), radial-gradient(circle at 85% 12%, rgba(11,63,217,0.10), transparent 32%)" }} />
        <section className="relative max-w-6xl mx-auto px-5 pt-10 pb-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
            <div className="rounded-[40px] overflow-hidden min-h-[520px] relative shadow-2xl" style={{ background: "#0B1B3D" }}>
              <img src={HERO_COVER_URL} alt="Generation LightMode cover" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,27,61,0.10) 0%, rgba(11,27,61,0.55) 58%, rgba(11,27,61,0.92) 100%)" }} />
              <div className="absolute inset-x-0 bottom-0 p-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", color: "#FFF" }}>
                  <Sparkles className="w-4 h-4 text-[#FFD000]" />
                  <span className="text-xs uppercase tracking-[0.18em] font-black">Official Movement Page</span>
                </div>
                <h1 className="text-5xl xl:text-6xl font-black font-['Space_Grotesk'] leading-none text-white max-w-xl">Faith, always on.</h1>
                <p className="mt-5 text-lg leading-relaxed max-w-xl" style={{ color: "#E9E3D0" }}>
                  Daily truth drops, campaign highlights, and movement updates from Generation LightMode.
                </p>
              </div>
            </div>

            <div className="rounded-[40px] overflow-hidden flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.86)", border: "1px solid rgba(217,203,170,0.65)", boxShadow: "0 24px 70px rgba(11,27,61,0.08)" }}>
              <div>
                <div className="relative h-44 overflow-hidden" style={{ background: "#0B1B3D" }}>
                  <img src={HERO_COVER_URL} alt="Generation LightMode profile cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,27,61,0.10) 0%, rgba(11,27,61,0.74) 100%)" }} />
                  <div className="absolute bottom-5 left-8 right-8 flex items-end justify-between gap-4">
                    <div className="w-28 h-28 rounded-full p-1 shrink-0 translate-y-12" style={{ background: "linear-gradient(135deg, #FFD000, #0B3FD9)", boxShadow: "0 16px 40px rgba(11,63,217,0.22)" }}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-white border-4 border-white">
                        <img src={accountImage} alt={accountName} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    {me?.email && me.email !== accountEmail && (
                      <button
                        onClick={() => followMutation.mutate()}
                        className="px-6 py-3 rounded-full font-black text-sm transition-all shrink-0 flex items-center gap-2 hover:-translate-y-0.5"
                        style={isFollowing
                          ? { background: "rgba(255,255,255,0.92)", color: "#4A5878", border: "1px solid rgba(255,255,255,0.6)" }
                          : { background: "#FFD000", color: "#0B1B3D", boxShadow: "0 10px 26px rgba(0,0,0,0.24)" }}
                      >
                        {isFollowing ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-8 pt-16">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black mb-4" style={{ background: "#FFF6D8", color: "#8A5A00", border: "1px solid #EAD08B" }}>
                    <Sparkles className="w-3 h-3" /> Official Account
                  </div>
                  <h2 className="text-4xl font-black font-['Space_Grotesk'] leading-tight mb-4">{accountName}</h2>
                  <p className="text-base leading-relaxed mb-7" style={{ color: "#4D5870" }}>
                    The official Generation LightMode profile — daily drops, movement announcements, campaign highlights, and platform updates. Faith. Always On. ⚡
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 px-8 pb-8">
                {[
                  { icon: Users, value: follows.length, label: "Followers", color: "#0B3FD9" },
                  { icon: BookOpen, value: posts.length, label: "Posts", color: "#A86B00" },
                  { icon: Globe, value: "Global", label: "Movement", color: "#1FB8FF" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-3xl p-4 text-center" style={{ background: "#FAFBF7", border: "1px solid rgba(217,203,170,0.55)" }}>
                      <Icon className="w-5 h-5 mx-auto mb-3" style={{ color: stat.color }} />
                      <div className="text-xl font-black font-['Space_Grotesk']">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</div>
                      <div className="text-[10px] uppercase tracking-[0.16em] font-black mt-1" style={{ color: "#8D7C5A" }}>{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="relative max-w-6xl mx-auto px-5 py-8">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] font-black mb-2" style={{ color: "#A86B00" }}>Curated devotion streams</p>
              <h2 className="text-3xl font-black font-['Space_Grotesk']">Explore the collections</h2>
            </div>
            <Link to={createPageUrl("DailyTruthFeed")} className="hidden sm:flex items-center gap-2 rounded-full px-5 py-3 font-black text-sm no-underline" style={{ background: "#0B1B3D", color: "#FFFFFF" }}>
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {categoryCards.map((item) => <CategoryCard key={item.tab} item={item} />)}
          </div>
        </section>

        <section className="relative max-w-6xl mx-auto px-5 py-8 pb-16">
          <div className="rounded-[40px] p-7 lg:p-8" style={{ background: "#F3EEE2", border: "1px solid rgba(217,203,170,0.75)" }}>
            <div className="flex items-center justify-between gap-4 mb-7">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] font-black mb-2" style={{ color: "#A86B00" }}>Latest from the movement</p>
                <h2 className="text-3xl font-black font-['Space_Grotesk']">Latest Posts</h2>
              </div>
              <Link to={createPageUrl("DailyTruthFeed")} className="flex items-center gap-2 font-black text-sm no-underline" style={{ color: "#0B3FD9" }}>
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {featuredPost ? (
              <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
                <article className="rounded-[32px] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(217,203,170,0.7)", boxShadow: "0 24px 60px rgba(11,27,61,0.08)" }}>
                  <div className="p-7">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black" style={{ background: featuredStyle.bg, color: featuredStyle.color, border: `1px solid ${featuredStyle.border}` }}>
                        {featuredStyle.icon} Featured · {featuredPost.category || "Daily Drop"}
                      </span>
                      {featuredDate && <span className="text-[11px]" style={{ color: "#8D7C5A" }}>{format(featuredDate, "MMMM d, yyyy")}</span>}
                    </div>
                    <PostArtwork post={featuredPost} className="w-full max-w-[320px] aspect-[4/5] rounded-[28px] mb-5 shadow-xl" />
                    {featuredPost.verse && <h3 className="text-xl font-black font-['Space_Grotesk'] leading-snug mb-3" style={{ color: "#0B1B3D" }}>{featuredPost.verse}</h3>}
                    {featuredPost.reflection && <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: "#4D5870" }}>{featuredPost.reflection}</p>}
                    {featuredPost.hashtags && <p className="text-sm font-black mt-4" style={{ color: "#0B3FD9" }}>{featuredPost.hashtags}</p>}
                    <div className="flex items-center gap-5 mt-5 text-xs" style={{ color: "#8D7C5A" }}>
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {featuredPost.likes_count || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {featuredPost.shares_count || 0}</span>
                    </div>
                  </div>
                </article>
                <div className="grid gap-4 content-start">
                  {posts.slice(1, 7).map((post) => <PostSnippet key={post.id} post={post} getCategoryStyle={getCategoryStyle} />)}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-[28px] bg-white" style={{ color: "#8D7C5A" }}>
                <div className="text-5xl mb-4">✨</div>
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