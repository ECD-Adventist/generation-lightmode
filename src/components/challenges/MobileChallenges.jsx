import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Target, Calendar, Users, ArrowRight, Menu, X, Bell, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";
import MobileSiteFooter from "@/components/site/MobileSiteFooter";

/**
 * Mobile-only Challenges page — LightMode branded (dark cyan/gold).
 * Hero + stats + filter tabs + challenge cards + footer.
 */
export default function MobileChallenges() {
  const { data: snapshot } = usePublicCommunitySnapshot();
  const challenges = snapshot?.challenges || [];
  const [filter, setFilter] = useState("active");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser).catch(() => {});
    });
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return challenges;
    if (filter === "active") return challenges.filter((c) => c.active);
    return challenges.filter((c) => !c.active);
  }, [challenges, filter]);

  const totalParticipants = challenges.reduce((s, c) => s + (c.participantsCount || 0), 0);

  return (
    <div className="min-h-[100dvh] font-['Inter']" style={{ background: "#0B0F1A", color: "#FFFFFF" }}>
      <style>{`
        @keyframes mc-float { 0%,100% { transform: translateY(0); opacity: 0.2 } 50% { transform: translateY(-16px); opacity: 0.4 } }
        @keyframes mc-pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: 0.6 } }
      `}</style>

      {/* TOP BAR */}
      <div className="sticky top-0 z-50 safe-pt px-4 pb-2 backdrop-blur-xl" style={{ background: "rgba(11,15,26,0.85)", borderBottom: "1px solid rgba(0,207,255,0.08)" }}>
        <div className="flex items-center justify-between pt-2">
          <Link to={createPageUrl("Home")} className="active:scale-95 transition">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="" className="h-8 w-auto object-contain" style={{ filter: "drop-shadow(0 0 10px rgba(0,207,255,0.5))" }} />
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <Link to={createPageUrl("Notifications")} className="w-11 h-11 rounded-xl flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.06)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Bell className="w-[18px] h-[18px]" />
              </Link>
            )}
            <button onClick={() => setMenuOpen(true)} className="w-11 h-11 rounded-xl flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.06)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Menu className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pt-10 pb-10 text-center">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,208,0,0.16)", animation: "mc-float 10s ease-in-out infinite" }} />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(0,207,255,0.16)", animation: "mc-float 12s ease-in-out infinite 2s" }} />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)" }}>
            <Target size={12} style={{ color: "#FFD000" }} />
            <span className="text-[9.5px] font-black uppercase tracking-[0.18em]" style={{ color: "#FFD000" }}>Live Challenges</span>
          </div>

          <h1 className="font-['Space_Grotesk'] font-black text-[32px] leading-[1.05] tracking-tight mb-3">
            Real{" "}
            <span style={{ background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 60%, #8A5CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Challenges
            </span>
          </h1>
          <p className="text-[13.5px] leading-relaxed mb-6 max-w-[320px] mx-auto" style={{ color: "#C8D0E0" }}>
            These challenges come directly from the app's live challenge records.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Active", value: snapshot?.totalChallenges || 0, color: "#00CFFF" },
              { label: "All", value: challenges.length, color: "#FFD000" },
              { label: "Participants", value: totalParticipants, color: "#8A5CFF" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: "rgba(18,24,38,0.7)", border: `1px solid ${s.color}20`, backdropFilter: "blur(10px)" }}>
                <div className="font-['Space_Grotesk'] font-black text-[24px] leading-none" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
                <div className="text-[9.5px] mt-1.5 font-black uppercase tracking-wider" style={{ color: "#8A9BB0" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FILTER TABS */}
      <section className="sticky top-[60px] z-40 px-5 py-3 backdrop-blur-xl" style={{ background: "rgba(13,18,32,0.9)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex gap-2">
          {[
            { id: "active", label: "Active" },
            { id: "all", label: "All" },
            { id: "completed", label: "Completed" },
          ].map((item) => {
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className="flex-1 px-4 py-2.5 rounded-full text-[12px] font-black transition active:scale-95"
                style={isActive
                  ? { background: "linear-gradient(90deg, #00CFFF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 18px rgba(0,207,255,0.35)" }
                  : { background: "rgba(255,255,255,0.05)", color: "#C8D0E0", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* CARDS */}
      <section className="px-5 pt-6 pb-10 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(18,24,38,0.6)", border: "1px dashed rgba(0,207,255,0.2)" }}>
            <p className="text-[13px]" style={{ color: "#8A9BB0" }}>No live challenges match this filter yet.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "rgba(18,24,38,0.7)", border: c.active ? "1px solid rgba(0,207,255,0.28)" : "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}>
              {c.active && <div className="absolute top-0 left-[20%] right-[20%] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.5), transparent)" }} />}

              <div className="flex justify-between items-start gap-2 mb-3">
                <span className="text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full" style={c.active
                  ? { background: "rgba(0,207,255,0.12)", color: "#00CFFF", border: "1px solid rgba(0,207,255,0.3)" }
                  : { background: "rgba(255,255,255,0.05)", color: "#8A9BB0", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {c.active ? "Active" : "Completed"}
                </span>
                <span className="text-[11px] font-black" style={{ color: "#FFD000" }}>+{c.points_reward} XP</span>
              </div>

              <h3 className="font-['Space_Grotesk'] font-black text-[18px] mb-2 text-white leading-tight">{c.title}</h3>
              <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: "#B0BAC8" }}>{c.description || "No description yet."}</p>

              <div className="flex gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-1.5" style={{ color: "#8A9BB0" }}>
                  <Users size={12} />
                  <span className="text-[11px]">{c.participantsCount || 0} participants</span>
                </div>
                {(c.start_date || c.end_date) && (
                  <div className="flex items-center gap-1.5" style={{ color: "#8A9BB0" }}>
                    <Calendar size={12} />
                    <span className="text-[11px]">{c.start_date || "Open"}{c.end_date ? ` → ${c.end_date}` : ""}</span>
                  </div>
                )}
              </div>

              <Link to={createPageUrl("Dashboard") + "?tab=challenges"} className="flex items-center justify-center gap-2 text-[12.5px] font-['Space_Grotesk'] font-black py-3 rounded-full no-underline active:scale-[0.98] transition" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 6px 20px rgba(255,208,0,0.35)" }}>
                Open in dashboard <ArrowRight size={13} />
              </Link>
            </div>
          ))
        )}
      </section>

      {/* FOOTER */}
      <MobileSiteFooter />

      {/* MENU DRAWER */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 backdrop-blur-md" style={{ background: "rgba(11,15,26,0.7)" }} />
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-[82%] max-w-[340px] p-5 safe-pt safe-pb overflow-y-auto" style={{ background: "linear-gradient(180deg, #0D1220 0%, #0B0F1A 100%)", borderLeft: "1px solid rgba(0,207,255,0.15)" }}>
            <div className="flex items-center justify-between mb-6">
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="" className="h-8 w-auto object-contain" />
              <button onClick={() => setMenuOpen(false)} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {[["Home", "Home"], ["About", "About"], ["Impact", "Impact"], ["Challenges", "Challenges"], ["Assistant", "Assistant"], ["Keep It 100", "KeepIt100"], ["Codes of Truth", "CodesOfTruth"], ["Resources", "Resources"]].map(([l, to]) => (
                <Link key={to} to={createPageUrl(to)} onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-[14px] font-semibold no-underline active:scale-95 transition" style={{ color: "#E0E8F0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>{l}</Link>
              ))}
            </nav>
            <div className="mt-6">
              <Link to={createPageUrl(user ? "Feed" : "Dashboard")} onClick={() => setMenuOpen(false)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-[13.5px] font-['Space_Grotesk'] no-underline active:scale-95 transition" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 6px 24px rgba(255,208,0,0.35)" }}>
                <Zap className="w-4 h-4" /> {user ? "Go to Feed" : "Join Now"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}