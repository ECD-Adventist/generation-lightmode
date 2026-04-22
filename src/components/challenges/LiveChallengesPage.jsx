import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Target, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";

/**
 * Desktop Challenges — branded LightMode dark theme matching the public website.
 * Shown inside the public website Layout (public navbar + footer are handled by Layout).
 */
export default function LiveChallengesPage() {
  const [filter, setFilter] = useState("active");
  const { data: snapshot } = usePublicCommunitySnapshot();
  const challenges = snapshot?.challenges || [];

  const filteredChallenges = useMemo(() => {
    if (filter === "all") return challenges;
    if (filter === "active") return challenges.filter((c) => c.active);
    return challenges.filter((c) => !c.active);
  }, [challenges, filter]);

  return (
    <div className="font-['Inter']" style={{ background: "#0B0F1A", color: "#FFFFFF", minHeight: "100vh" }}>
      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-24 pb-16 text-center">
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full blur-[140px] pointer-events-none" style={{ background: "rgba(0,207,255,0.18)" }} />
        <div className="absolute -bottom-20 -left-20 w-[420px] h-[420px] rounded-full blur-[140px] pointer-events-none" style={{ background: "rgba(255,208,0,0.14)" }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6" style={{ background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)" }}>
            <Target size={14} style={{ color: "#FFD000" }} />
            <span className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#FFD000" }}>Live Challenges</span>
          </div>

          <h1 className="font-['Space_Grotesk'] font-black tracking-tight mb-5" style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1.02, letterSpacing: "-0.03em" }}>
            Real{" "}
            <span style={{ background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 60%, #8A5CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Challenges
            </span>
          </h1>
          <p className="text-[16px] max-w-xl mx-auto mb-10" style={{ color: "#C8D0E0" }}>
            These challenges come directly from the app's live challenge records.
          </p>

          <div className="flex gap-10 justify-center flex-wrap">
            {[
              { label: "Active", value: snapshot?.totalChallenges || 0, color: "#00CFFF" },
              { label: "All Challenges", value: challenges.length, color: "#FFD000" },
              { label: "Participants", value: challenges.reduce((s, c) => s + (c.participantsCount || 0), 0), color: "#8A5CFF" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-['Space_Grotesk'] font-black text-[44px] leading-none" style={{ color: stat.color }}>{stat.value.toLocaleString()}</div>
                <div className="text-[12px] mt-2 font-semibold uppercase tracking-wider" style={{ color: "#8A9BB0" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.3), transparent)" }} />

      {/* FILTER BAR */}
      <section className="py-8 px-6" style={{ background: "#0D1220", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto flex gap-2.5 flex-wrap justify-center">
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
                className="px-6 py-2.5 rounded-full text-sm font-bold transition"
                style={isActive
                  ? { background: "linear-gradient(90deg, #00CFFF, #0B3FD9)", color: "#FFFFFF", border: "1px solid transparent", boxShadow: "0 4px 18px rgba(0,207,255,0.35)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#C8D0E0", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* GRID */}
      <section className="pt-16 px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {filteredChallenges.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(18,24,38,0.7)", border: "1px dashed rgba(0,207,255,0.2)" }}>
              <p style={{ color: "#8A9BB0" }}>No live challenges match this filter yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges.map((c) => (
                <div key={c.id} className="rounded-2xl p-7 relative overflow-hidden transition-all" style={{ background: "rgba(18,24,38,0.7)", border: c.active ? "1px solid rgba(0,207,255,0.3)" : "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}>
                  <div className="absolute top-0 left-[20%] right-[20%] h-[1px]" style={{ background: c.active ? "linear-gradient(90deg, transparent, rgba(0,207,255,0.5), transparent)" : "transparent" }} />

                  <div className="flex justify-between items-start gap-3 mb-4 relative">
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full" style={c.active
                      ? { background: "rgba(0,207,255,0.12)", color: "#00CFFF", border: "1px solid rgba(0,207,255,0.3)" }
                      : { background: "rgba(255,255,255,0.05)", color: "#8A9BB0", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {c.active ? "Active" : "Completed"}
                    </span>
                    <span className="text-[13px] font-black" style={{ color: "#FFD000" }}>+{c.points_reward} XP</span>
                  </div>

                  <h3 className="font-['Space_Grotesk'] font-black text-[22px] mb-2 text-white leading-tight">{c.title}</h3>
                  <p className="text-[13px] leading-relaxed mb-5" style={{ color: "#B0BAC8" }}>{c.description || "No description yet."}</p>

                  <div className="flex gap-4 flex-wrap mb-5">
                    <div className="flex items-center gap-1.5" style={{ color: "#8A9BB0" }}>
                      <Users size={13} />
                      <span className="text-[12px]">{c.participantsCount || 0} participants</span>
                    </div>
                    {(c.start_date || c.end_date) && (
                      <div className="flex items-center gap-1.5" style={{ color: "#8A9BB0" }}>
                        <Calendar size={13} />
                        <span className="text-[12px]">{c.start_date || "Open"}{c.end_date ? ` → ${c.end_date}` : ""}</span>
                      </div>
                    )}
                  </div>

                  <Link to={createPageUrl("Dashboard") + "?tab=challenges"} className="flex items-center justify-center gap-2 text-[14px] font-['Space_Grotesk'] font-black py-3.5 rounded-full no-underline transition" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 6px 24px rgba(255,208,0,0.35)" }}>
                    Open in dashboard <ArrowRight size={15} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}