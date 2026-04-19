import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Globe2, Crown, Target, HandHeart, Users2, MessageCircle, Flame, CheckCircle2, Zap, MapPin } from "lucide-react";
import { AnimatedNumber } from "./useCountUp";
import { countryCoordinates } from "@/lib/countryCoordinates";

/* ─── Shared PanelShell (kept local so this file stays independent) ──── */
function PanelShell({ title, subtitle, icon: Icon, iconColor, t, isDark, children, delay = 0, badge = null }) {
  return (
    <div className="rounded-[1.5rem] border overflow-hidden relative" style={{
      background: isDark ? t.surface : "#FFFFFF",
      borderColor: isDark ? t.border : "rgba(0,0,0,0.04)",
      boxShadow: isDark ? "0 8px 28px rgba(0,0,0,0.3)" : "0 8px 28px rgba(15,23,42,0.06)",
      animation: `dx-panel-fade 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
    }}>
      <style>{`@keyframes dx-panel-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${iconColor}, transparent)` }} />
      <div className="p-5 pb-3 relative">
        <div className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full blur-[60px] opacity-30 pointer-events-none" style={{ background: iconColor }} />
        <div className="relative flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}12`, border: `1px solid ${iconColor}20` }}>
                <Icon size={14} style={{ color: iconColor }} />
              </div>
            )}
            <div>
              <h3 className="text-[14px] font-bold font-['Space_Grotesk'] tracking-tight" style={{ color: t.textPrimary }}>{title}</h3>
              <p className="text-[10px]" style={{ color: t.textMuted }}>{subtitle}</p>
            </div>
          </div>
          {badge && (
            <div className="px-2.5 py-1 rounded-lg text-[10px] font-black" style={{ background: `${iconColor}10`, color: iconColor, border: `1px solid ${iconColor}20` }}>
              {badge}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Animated progress bar (local) ───────────────────────────────────── */
function AnimatedBar({ percent, color, delay = 0 }) {
  const [width, setWidth] = React.useState(0);
  const target = Math.max(2, Math.min(percent, 100));
  React.useEffect(() => {
    setWidth(0);
    const timer = setTimeout(() => setWidth(target), delay);
    return () => clearTimeout(timer);
  }, [target, delay]);
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: `${color}15` }}>
      <div className="absolute inset-y-0 left-0 rounded-full" style={{
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        width: `${width}%`,
        transition: "width 1.4s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: `0 0 8px ${color}60`,
      }} />
    </div>
  );
}

/* ─── Global Reach Map ─────────────────────────────────────────────────── */
export function GlobalReachPanel({ users, t, isDark }) {
  const accentColor = isDark ? "#00CFFF" : "#0B3FD9";

  // equirectangular projection: lng [-180,180] → x [0,100], lat [90,-90] → y [0,100]
  const project = (lat, lng) => ({ x: ((lng + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 });

  const countryPoints = useMemo(() => {
    const counts = {};
    users.forEach(u => { if (u.country) counts[u.country] = (counts[u.country] || 0) + 1; });
    return Object.entries(counts)
      .map(([country, count]) => {
        const coords = countryCoordinates[country];
        if (!coords) return null;
        const pt = project(coords[0], coords[1]);
        return { country, count, ...pt };
      })
      .filter(Boolean);
  }, [users]);

  const maxCount = Math.max(...countryPoints.map(p => p.count), 1);
  const totalCountries = countryPoints.length;
  const totalWarriors = countryPoints.reduce((s, p) => s + p.count, 0);

  return (
    <PanelShell title="Global Reach" subtitle="Live warrior distribution" icon={Globe2} iconColor={accentColor} t={t} isDark={isDark} delay={0}
      badge={<><AnimatedNumber value={totalCountries} duration={1400} /> countries</>}>
      <div className="px-5 pb-5">
        {/* Map */}
        <div className="relative rounded-2xl overflow-hidden" style={{
          aspectRatio: "2 / 1",
          background: isDark
            ? "radial-gradient(ellipse at center, rgba(0,207,255,0.08) 0%, rgba(11,15,26,0.8) 70%)"
            : "radial-gradient(ellipse at center, rgba(11,63,217,0.06) 0%, #F4F7FE 70%)",
          border: `1px solid ${isDark ? "rgba(0,207,255,0.1)" : "rgba(11,63,217,0.08)"}`,
        }}>
          {/* Grid lines */}
          <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0">
            <defs>
              <pattern id="gr-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke={isDark ? "rgba(0,207,255,0.06)" : "rgba(11,63,217,0.05)"} strokeWidth="0.1" />
              </pattern>
            </defs>
            <rect width="100" height="50" fill="url(#gr-grid)" />
            {/* Equator */}
            <line x1="0" y1="25" x2="100" y2="25" stroke={isDark ? "rgba(0,207,255,0.2)" : "rgba(11,63,217,0.15)"} strokeWidth="0.1" strokeDasharray="0.5,0.5" />
          </svg>

          {/* Animated pulse dots */}
          {countryPoints.map((p, i) => {
            const intensity = (p.count / maxCount);
            const radius = 0.8 + intensity * 2.2;
            return (
              <div key={p.country} className="absolute" style={{
                left: `${p.x}%`,
                top: `${(p.y / 100) * 50 * 2}%`,
                transform: "translate(-50%, -50%)",
                animation: `dx-dot-appear 0.6s cubic-bezier(0.22,1,0.36,1) ${200 + i * 40}ms both`,
              }}>
                <div className="relative group cursor-pointer">
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-full" style={{
                    width: `${radius * 8}px`,
                    height: `${radius * 8}px`,
                    transform: "translate(-50%, -50%)",
                    background: accentColor,
                    opacity: 0.3,
                    animation: `dx-pulse 2s ease-in-out ${i * 200}ms infinite`,
                  }} />
                  {/* Core dot */}
                  <div className="rounded-full" style={{
                    width: `${radius * 3.5}px`,
                    height: `${radius * 3.5}px`,
                    background: `radial-gradient(circle, ${accentColor}, ${accentColor}cc)`,
                    boxShadow: `0 0 ${radius * 4}px ${accentColor}`,
                  }} />
                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-7 px-2 py-1 rounded-md text-[9px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10" style={{
                    background: isDark ? "rgba(18,24,38,0.95)" : "#fff",
                    color: t.textPrimary,
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                  }}>
                    {p.country}: {p.count}
                  </div>
                </div>
              </div>
            );
          })}
          <style>{`
            @keyframes dx-pulse { 0%,100% { transform: translate(-50%,-50%) scale(0.9); opacity: 0.4; } 50% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; } }
            @keyframes dx-dot-appear { from { opacity: 0; transform: translate(-50%,-50%) scale(0); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
          `}</style>

          {/* Corner stats overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md" style={{
            background: isDark ? "rgba(11,15,26,0.6)" : "rgba(255,255,255,0.85)",
            border: `1px solid ${isDark ? "rgba(0,207,255,0.15)" : "rgba(11,63,217,0.08)"}`,
          }}>
            <MapPin size={11} style={{ color: accentColor }} />
            <span className="text-[10px] font-bold" style={{ color: t.textPrimary }}>
              <AnimatedNumber value={totalWarriors} duration={1400} /> warriors live
            </span>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

/* ─── Leading Countries ────────────────────────────────────────────────── */
export function LeadingCountriesPanel({ users, drops, t, isDark }) {
  const goldColor = isDark ? "#FFD000" : "#d97706";

  const ranked = useMemo(() => {
    const map = {};
    users.forEach(u => {
      if (!u.country) return;
      if (!map[u.country]) map[u.country] = { country: u.country, users: 0, drops: 0, emails: new Set() };
      map[u.country].users++;
      map[u.country].emails.add(u.email);
    });
    drops.forEach(d => {
      const owner = users.find(u => u.email === d.user_email);
      if (owner?.country && map[owner.country]) map[owner.country].drops++;
    });
    return Object.values(map)
      .map(c => ({ ...c, score: c.users * 2 + c.drops }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [users, drops]);

  const maxScore = Math.max(...ranked.map(r => r.score), 1);
  const flagEmoji = (country) => {
    const map = { Kenya: "🇰🇪", Tanzania: "🇹🇿", Uganda: "🇺🇬", Rwanda: "🇷🇼", Burundi: "🇧🇮", Ethiopia: "🇪🇹", Nigeria: "🇳🇬", Ghana: "🇬🇭", "South Africa": "🇿🇦", USA: "🇺🇸", Canada: "🇨🇦", Brazil: "🇧🇷", India: "🇮🇳", Philippines: "🇵🇭", Australia: "🇦🇺", "DR Congo": "🇨🇩", "Democratic Republic of the Congo": "🇨🇩", Sudan: "🇸🇩", "South Sudan": "🇸🇸", Somalia: "🇸🇴", Djibouti: "🇩🇯", Eritrea: "🇪🇷" };
    return map[country] || "🌍";
  };

  return (
    <PanelShell title="Leading Countries" subtitle="Ranked by movement score" icon={Crown} iconColor={goldColor} t={t} isDark={isDark} delay={120}
      badge={<><AnimatedNumber value={ranked.length} duration={1200} /> active</>}>
      {ranked.length === 0 ? (
        <p className="text-xs py-10 text-center" style={{ color: t.textMuted }}>No country data yet</p>
      ) : (
        <div className="px-4 pb-4 space-y-2">
          {ranked.map((c, i) => {
            const pct = (c.score / maxScore) * 100;
            const rankColors = ["#FFD000", "#9CA3AF", "#CD7F32"];
            const barColor = i < 3 ? rankColors[i] : (isDark ? "#00CFFF" : "#0B3FD9");
            return (
              <div key={c.country} className="relative rounded-xl p-2.5" style={{
                background: i < 3 ? `${barColor}08` : "transparent",
                border: `1px solid ${i < 3 ? `${barColor}20` : "transparent"}`,
                animation: `dx-panel-fade 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 80 + 300}ms both`,
              }}>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-[11px] font-black w-4 text-center shrink-0" style={{ color: i < 3 ? barColor : t.textMuted }}>#{i + 1}</span>
                  <span className="text-base shrink-0">{flagEmoji(c.country)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: t.textPrimary }}>{c.country}</p>
                    <p className="text-[9px]" style={{ color: t.textMuted }}>
                      <AnimatedNumber value={c.users} duration={1400} /> users · <AnimatedNumber value={c.drops} duration={1400} /> drops
                    </p>
                  </div>
                  <div className="text-[11px] font-black shrink-0" style={{ color: barColor }}>
                    <AnimatedNumber value={c.score} duration={1400} />
                  </div>
                </div>
                <AnimatedBar percent={pct} color={barColor} delay={i * 80 + 500} />
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}

/* ─── Challenge Impact ─────────────────────────────────────────────────── */
export function ChallengeImpactPanel({ t, isDark }) {
  const accentColor = isDark ? "#8A5CFF" : "#7e22ce";

  const { data: challenges = [] } = useQuery({ queryKey: ["dx_challenges"], queryFn: () => base44.entities.Challenge.list("-created_date", 20) });
  const { data: submissions = [] } = useQuery({ queryKey: ["dx_submissions"], queryFn: () => base44.entities.ChallengeSubmission.list("-created_date", 200) });

  const stats = useMemo(() => {
    const active = challenges.filter(c => c.active);
    const totalSubs = submissions.length;
    const totalPoints = submissions.reduce((s, x) => s + (x.points_awarded || 0), 0);
    const uniqueParticipants = new Set(submissions.map(s => s.user_email)).size;
    const topChallenges = active.map(c => {
      const subs = submissions.filter(s => s.challenge_id === c.id);
      return { ...c, subCount: subs.length, participantCount: new Set(subs.map(s => s.user_email)).size };
    }).sort((a, b) => b.subCount - a.subCount).slice(0, 4);
    return { activeCount: active.length, totalSubs, totalPoints, uniqueParticipants, topChallenges };
  }, [challenges, submissions]);

  const maxSubs = Math.max(...stats.topChallenges.map(c => c.subCount), 1);

  return (
    <PanelShell title="Challenge Impact" subtitle="Missions driving the movement" icon={Target} iconColor={accentColor} t={t} isDark={isDark} delay={240}
      badge={<><AnimatedNumber value={stats.activeCount} duration={1200} /> active</>}>
      {/* Top stats row */}
      <div className="grid grid-cols-3 px-5 pb-4 gap-2">
        {[
          { label: "Submissions", value: stats.totalSubs, icon: Zap, color: isDark ? "#00CFFF" : "#0B3FD9" },
          { label: "Participants", value: stats.uniqueParticipants, icon: Users2, color: isDark ? "#22c55e" : "#16a34a" },
          { label: "XP Awarded", value: stats.totalPoints, icon: Flame, color: isDark ? "#FFD000" : "#d97706" },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="rounded-xl p-2.5" style={{ background: `${m.color}0d`, border: `1px solid ${m.color}1a` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={10} style={{ color: m.color }} />
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>{m.label}</span>
              </div>
              <p className="text-lg font-black font-['Space_Grotesk'] leading-none" style={{ color: t.textPrimary }}>
                <AnimatedNumber value={m.value} duration={1400} />
              </p>
            </div>
          );
        })}
      </div>

      {/* Top challenges */}
      <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
        <p className="text-[9px] font-bold uppercase tracking-wider px-1 mb-2" style={{ color: t.textMuted }}>Top Active Challenges</p>
        {stats.topChallenges.length === 0 ? (
          <p className="text-xs py-6 text-center" style={{ color: t.textMuted }}>No active challenges</p>
        ) : (
          <div className="space-y-2">
            {stats.topChallenges.map((c, i) => {
              const pct = (c.subCount / maxSubs) * 100;
              return (
                <div key={c.id} className="rounded-lg p-2" style={{
                  background: isDark ? "rgba(138,92,255,0.05)" : "rgba(126,34,206,0.04)",
                  animation: `dx-panel-fade 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 80 + 300}ms both`,
                }}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-[11px] font-bold truncate flex-1" style={{ color: t.textPrimary }}>{c.title}</p>
                    <div className="flex items-center gap-2 shrink-0 text-[9px]" style={{ color: t.textMuted }}>
                      <span className="flex items-center gap-0.5"><Users2 size={9} /> <AnimatedNumber value={c.participantCount} duration={1200} /></span>
                      <span className="flex items-center gap-0.5" style={{ color: accentColor }}><Zap size={9} /> <AnimatedNumber value={c.subCount} duration={1200} /></span>
                    </div>
                  </div>
                  <AnimatedBar percent={pct} color={accentColor} delay={i * 80 + 400} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PanelShell>
  );
}

/* ─── Community Pulse (Prayer + Groups) ────────────────────────────────── */
export function CommunityPulsePanel({ scopedGroups, t, isDark }) {
  const accentColor = isDark ? "#f43f5e" : "#e11d48";

  const { data: prayers = [] } = useQuery({ queryKey: ["dx_prayers"], queryFn: () => base44.entities.PrayerRequest.list("-created_date", 200) });
  const { data: groupMembers = [] } = useQuery({ queryKey: ["dx_groupMembers"], queryFn: () => base44.entities.GlowGroupMember.list("-created_date", 500) });

  const stats = useMemo(() => {
    const answered = prayers.filter(p => p.answered).length;
    const pendingPrayers = prayers.length - answered;
    const categories = {};
    prayers.forEach(p => {
      const k = p.category || "Other";
      categories[k] = (categories[k] || 0) + 1;
    });
    const topCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Top groups by member count
    const groupCounts = {};
    groupMembers.forEach(m => { groupCounts[m.group_id] = (groupCounts[m.group_id] || 0) + 1; });
    const topGroups = scopedGroups
      .map(g => ({ ...g, memberCount: groupCounts[g.id] || 0 }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 3);

    return { totalPrayers: prayers.length, answered, pendingPrayers, topCategories, topGroups, totalGroups: scopedGroups.length };
  }, [prayers, groupMembers, scopedGroups]);

  const maxCatCount = Math.max(...stats.topCategories.map(c => c[1]), 1);
  const maxMemberCount = Math.max(...stats.topGroups.map(g => g.memberCount), 1);
  const answeredPct = stats.totalPrayers > 0 ? (stats.answered / stats.totalPrayers) * 100 : 0;

  const categoryColors = {
    Health: isDark ? "#22c55e" : "#16a34a",
    Family: isDark ? "#f43f5e" : "#e11d48",
    Finance: isDark ? "#FFD000" : "#d97706",
    Guidance: isDark ? "#00CFFF" : "#0B3FD9",
    Other: isDark ? "#8A5CFF" : "#7e22ce",
  };

  return (
    <PanelShell title="Community Pulse" subtitle="Prayers & groups activity" icon={HandHeart} iconColor={accentColor} t={t} isDark={isDark} delay={360}
      badge={<><AnimatedNumber value={stats.totalPrayers} duration={1400} /> prayers</>}>
      {/* Prayer hero: answered rate */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between gap-3 mb-2.5 p-3 rounded-xl" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}15` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}18` }}>
              <CheckCircle2 size={16} style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Answered Prayers</p>
              <p className="text-base font-black font-['Space_Grotesk'] leading-none mt-0.5" style={{ color: t.textPrimary }}>
                <AnimatedNumber value={stats.answered} duration={1400} /> <span className="text-[10px] font-normal" style={{ color: t.textMuted }}>/ {stats.totalPrayers}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black font-['Space_Grotesk']" style={{ color: accentColor }}>
              <AnimatedNumber value={answeredPct} duration={1600} decimals={0} suffix="%" />
            </p>
          </div>
        </div>

        {/* Categories breakdown */}
        <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>Prayer Categories</p>
        <div className="space-y-1.5 mb-4">
          {stats.topCategories.map(([cat, count], i) => {
            const pct = (count / maxCatCount) * 100;
            const color = categoryColors[cat] || accentColor;
            return (
              <div key={cat} style={{ animation: `dx-panel-fade 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 70 + 200}ms both` }}>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-bold" style={{ color: t.textSecondary }}>{cat}</span>
                  <span className="font-black" style={{ color }}><AnimatedNumber value={count} duration={1200} /></span>
                </div>
                <AnimatedBar percent={pct} color={color} delay={i * 70 + 300} />
              </div>
            );
          })}
          {stats.topCategories.length === 0 && (
            <p className="text-xs py-2 text-center" style={{ color: t.textMuted }}>No prayers yet</p>
          )}
        </div>

        {/* Top groups */}
        <div className="pt-3 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Top GlowGroups</p>
            <span className="text-[9px] font-bold" style={{ color: t.textMuted }}>
              <AnimatedNumber value={stats.totalGroups} duration={1200} /> total
            </span>
          </div>
          {stats.topGroups.length === 0 ? (
            <p className="text-xs py-2 text-center" style={{ color: t.textMuted }}>No groups yet</p>
          ) : (
            <div className="space-y-1.5">
              {stats.topGroups.map((g, i) => {
                const pct = (g.memberCount / maxMemberCount) * 100;
                const color = isDark ? "#00CFFF" : "#0B3FD9";
                return (
                  <div key={g.id} className="flex items-center gap-2" style={{ animation: `dx-panel-fade 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 80 + 400}ms both` }}>
                    <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                      {g.profile_picture_url ? (
                        <img src={g.profile_picture_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MessageCircle size={12} style={{ color }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold truncate" style={{ color: t.textPrimary }}>{g.name}</p>
                      <div className="mt-1"><AnimatedBar percent={pct} color={color} delay={i * 80 + 500} /></div>
                    </div>
                    <span className="text-[10px] font-black shrink-0" style={{ color }}>
                      <AnimatedNumber value={g.memberCount} duration={1200} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  );
}