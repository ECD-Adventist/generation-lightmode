import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, BookOpen, Copy, Globe, HeartPulse, Share2, Sparkles, Users, Zap } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function OfficialProfileHighlights({ followersCount, postsCount, codeCount, keepCount, verseCount }) {
  const shareProfile = async () => {
    const url = `${window.location.origin}${createPageUrl("GenerationLightMode")}`;
    if (navigator.share) {
      await navigator.share({ title: "Generation LightMode", text: "Faith. Always On.", url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Profile link copied");
  };

  const stats = [
    { icon: Users, label: "Followers", value: followersCount.toLocaleString(), glow: "#1FB8FF" },
    { icon: BookOpen, label: "Published Drops", value: postsCount.toLocaleString(), glow: "#FFD000" },
    { icon: Sparkles, label: "Collections", value: "3", glow: "#8A5CFF" },
    { icon: HeartPulse, label: "Light Status", value: "Live", glow: "#22C55E" },
  ];

  return (
    <section className="relative max-w-6xl mx-auto px-5 py-5">
      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glm-light-card rounded-[26px] p-5 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(217,203,170,0.65)", boxShadow: `0 16px 42px ${stat.glow}18` }}>
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-30" style={{ background: stat.glow }} />
                <div className="relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${stat.glow}18`, color: stat.glow, border: `1px solid ${stat.glow}35` }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="relative z-10 text-2xl font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{stat.value}</div>
                <div className="relative z-10 text-[10px] uppercase tracking-[0.18em] font-black mt-1" style={{ color: "#8D7C5A" }}>{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[28px] p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #08152F 0%, #0B3FD9 62%, #D4B82E 120%)", boxShadow: "0 20px 55px rgba(11,63,217,0.24)" }}>
          <div className="absolute -top-16 -right-10 w-40 h-40 rounded-full blur-3xl opacity-40" style={{ background: "#FFD000" }} />
          <div className="absolute -bottom-16 -left-12 w-44 h-44 rounded-full blur-3xl opacity-35" style={{ background: "#1FB8FF" }} />
          <div className="relative z-10 flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <BadgeCheck className="w-6 h-6 text-[#FFD000]" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[#FFD000]">Official Light Hub</div>
              <div className="text-white font-black font-['Space_Grotesk']">Verified movement source</div>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="rounded-2xl p-3 bg-white/10 border border-white/15"><div className="text-white font-black">{codeCount}</div><div className="text-[9px] text-white/65 uppercase">Truth</div></div>
            <div className="rounded-2xl p-3 bg-white/10 border border-white/15"><div className="text-white font-black">{keepCount}</div><div className="text-[9px] text-white/65 uppercase">100</div></div>
            <div className="rounded-2xl p-3 bg-white/10 border border-white/15"><div className="text-white font-black">{verseCount}</div><div className="text-[9px] text-white/65 uppercase">Verse</div></div>
          </div>
          <div className="relative z-10 flex gap-2">
            <button onClick={shareProfile} className="flex-1 px-4 py-3 rounded-full text-sm font-black bg-white text-[#0B1B3D] flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <Link to={createPageUrl("DailyTruthFeed")} className="px-4 py-3 rounded-full text-sm font-black text-white border border-white/25 flex items-center justify-center gap-2 no-underline bg-white/10">
              Explore <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}