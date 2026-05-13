import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Grid3X3, Newspaper, Sparkles } from "lucide-react";
import { createPageUrl } from "@/utils";
import DropGridTile from "@/components/profile/DropGridTile";

export default function OfficialDropsShowcase({ posts }) {
  const openPost = (drop) => {
    window.location.href = `${createPageUrl("Post")}?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`;
  };

  if (!posts.length) {
    return (
      <section className="relative max-w-6xl mx-auto px-5 py-8 pb-16">
        <div className="p-12 text-center rounded-[32px] bg-white border border-[#E0D4B8]" style={{ color: "#8D7C5A" }}>
          <div className="text-5xl mb-4">✨</div>
          <p>No posts yet. Stay tuned!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative max-w-6xl mx-auto px-5 py-8 pb-16">
      <div className="rounded-[40px] p-6 lg:p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #F7F1E2 0%, #FFFFFF 45%, #EEF6FF 100%)", border: "1px solid rgba(217,203,170,0.75)", boxShadow: "0 26px 70px rgba(11,27,61,0.08)" }}>
        <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: "#1FB8FF" }} />
        <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full blur-3xl opacity-25" style={{ background: "#FFD000" }} />

        <div className="relative z-10 flex items-center justify-between gap-4 mb-7">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-black mb-2 flex items-center gap-2" style={{ color: "#A86B00" }}><Sparkles className="w-3.5 h-3.5" /> Latest from the movement</p>
            <h2 className="text-3xl font-black font-['Space_Grotesk'] flex items-center gap-2" style={{ color: "#0B1B3D" }}><Grid3X3 className="w-7 h-7 text-[#0B3FD9]" /> Light Drops Gallery</h2>
          </div>
          <Link to={createPageUrl("DailyTruthFeed")} className="hidden sm:flex items-center gap-2 font-black text-sm no-underline rounded-full px-5 py-3" style={{ color: "#FFFFFF", background: "#0B1B3D" }}>
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.slice(0, 12).map((post) => (
            <DropGridTile
              key={post.id}
              drop={post}
              onClick={() => openPost(post)}
              authorName="Generation LightMode"
              authorTitle="Official Movement"
              isLeader
              commentsCount={0}
            />
          ))}
        </div>

        <div className="relative z-10 mt-6 rounded-[26px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: "rgba(11,27,61,0.92)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD000, #1FB8FF)" }}>
              <Newspaper className="w-6 h-6 text-[#0B1B3D]" />
            </div>
            <div>
              <div className="text-white font-black font-['Space_Grotesk']">Tap any drop to open the full post</div>
              <div className="text-sm text-white/65">Profile-style viewing, with leader lighting and official badges.</div>
            </div>
          </div>
          <Link to={createPageUrl("DailyTruthFeed")} className="px-5 py-3 rounded-full text-sm font-black bg-white text-[#0B1B3D] no-underline flex items-center justify-center gap-2">
            Open Feed <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}