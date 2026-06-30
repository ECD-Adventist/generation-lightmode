import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Award, MapPin, PlusCircle, Target, MessageSquare, ListOrdered, Share2, Bookmark, Heart, MessageCircle, ChevronRight, Zap, Bell, Sparkles, Globe, Image } from "lucide-react";
import { sanitizeRichHtml, containsHtml } from "@/lib/sanitizeHtml";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import SubmitDropModal from "../feed/SubmitDropModal";
import LevelProgressCard from "./LevelProgressCard";
import StreakSummaryCard from "./StreakSummaryCard";
import ShareProgressModal from "./ShareProgressModal";

export default function OverviewTab({ user }) {
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const { data: glowDrops = [] } = useQuery({ queryKey: ["myGlowDrops", user.email], queryFn: () => base44.entities.GlowDrop.filter({ user_email: user.email }) });
  const { data: myMemberships = [] } = useQuery({ queryKey: ["myMemberships", user.email], queryFn: () => base44.entities.GlowGroupMember.filter({ user_email: user.email }) });
  const { data: communityFeed = [] } = useQuery({ queryKey: ["communityFeedOverview"], queryFn: () => base44.entities.GlowDrop.filter({ status: 'approved' }, '-created_date', 5) });
  const communityAuthorEmails = useMemo(() => Array.from(new Set(communityFeed.map(drop => drop.user_email).filter(email => email && email !== "system@lightmode.com"))), [communityFeed]);
  const { data: publicUsers = [] } = useQuery({
    queryKey: ["overviewPublicUsers", communityAuthorEmails.join("|")],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", { emails: communityAuthorEmails, limit: communityAuthorEmails.length || 1 });
      return Array.isArray(res.data) ? res.data : (res.data?.users || []);
    },
    enabled: communityAuthorEmails.length > 0,
  });
  const { data: allGroups = [] } = useQuery({ queryKey: ["allGroups"], queryFn: () => base44.entities.GlowGroup.list(), enabled: myMemberships.length > 0 });
  const { data: challenges = [] } = useQuery({ queryKey: ["activeChallenges"], queryFn: () => base44.entities.Challenge.filter({ active: true }, '-created_date', 3) });
  const { data: certificates = [] } = useQuery({ queryKey: ["myCertificates", user.email], queryFn: () => base44.entities.Certificate.filter({ user_email: user.email }) });
  const { data: unreadNotifications = [] } = useQuery({ queryKey: ["unreadNotifications", user.id], queryFn: () => base44.entities.Notification.filter({ user_id: user.id, read: false }, '-created_date', 5), enabled: !!user.id });
  const { data: dailyCodes = [] } = useQuery({ queryKey: ["overviewDailyCodesLatest"], queryFn: () => base44.entities.DailyCode.list('-date_published', 1) });
  const { data: dailyCodeEntries = [] } = useQuery({ queryKey: ["overviewCodeOfTruth", dailyCodes[0]?.code_id], queryFn: () => base44.entities.CodeOfTruth.filter({ id: dailyCodes[0]?.code_id }), enabled: !!dailyCodes[0]?.code_id });

  const dailyCode = dailyCodeEntries[0];
  const myGroup = myMemberships.length > 0 ? allGroups.find(g => g.id === myMemberships[0].group_id) : null;
  const score = user.glow_score || 0;

  const userMap = useMemo(() => {
    const map = new Map();
    publicUsers.forEach((entry) => map.set(entry.email, entry));
    return map;
  }, [publicUsers]);

  const getDisplayName = (email) => email === "system@lightmode.com" ? "Generation LightMode" : (userMap.get(email)?.full_name || email?.split('@')[0] || "Community Member");
  const getProfilePicture = (email) => email === "system@lightmode.com" ? "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg" : (userMap.get(email)?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png");
  const getProfileSummary = (email) => email === "system@lightmode.com" ? "Official Generation LightMode account" : (userMap.get(email)?.bio || userMap.get(email)?.country || "LightMode member");

  const getRepostOwner = (reflection) => {
    const matches = Array.from(reflection?.matchAll(/\[Reposted from (.+?)\]\s*/gi) || []);
    if (!matches.length) return null;
    const name = matches[matches.length - 1][1];
    if (name.toLowerCase() === "system") return "Generation LightMode";
    return name;
  };

  const cleanReflection = (reflection) => reflection?.replace(/^(\[Reposted from .+?\]\s*)+/i, "").trim() || "";

  let rank = "Glow Starter", rankColor = "#1FB8FF", bgClass = "bg-blue-500/10";
  if (score >= 500) { rank = "Glow Champion"; rankColor = "#CC7A00"; bgClass = "bg-amber-500/10"; }
  else if (score >= 200) { rank = "Trendsetter"; rankColor = "#0B3FD9"; bgClass = "bg-blue-600/10"; }
  else if (score >= 50) { rank = "Light Warrior"; rankColor = "#1FB8FF"; bgClass = "bg-cyan-500/10"; }

  const cardClass = "rounded-[1.75rem] p-6";
  const cardStyle = { background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };
  const statBoxClass = "rounded-xl p-3 text-center";
  const statBoxStyle = { background: "#F6F8FC", border: "1px solid #E0EAF5" };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-['Inter']">
      <SubmitDropModal isOpen={isDropModalOpen} onClose={() => setIsDropModalOpen(false)} user={user} />
      <ShareProgressModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} user={user} />

      {/* TOP: USER OVERVIEW & STREAK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6 ${cardClass}`} style={cardStyle}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none bg-cyan-500/10" />
          <div className="relative shrink-0">
            <div className={`absolute inset-[-4px] rounded-full blur-sm opacity-40 ${bgClass}`} />
            <img src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-24 h-24 rounded-full relative z-10 object-cover shadow-sm" style={{ border: "4px solid #FFFFFF" }} alt="Profile" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider z-20 shadow-sm" style={{ background: "#0B1B3D", color: "#FFFFFF" }}>
              {rank}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left z-10 w-full">
            <h2 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{user.full_name}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm mt-1 mb-4" style={{ color: "#6B7FA0" }}>
              <MapPin size={14} style={{ color: "#0B3FD9" }} /> {user.country || "Global Citizen"}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: score, label: "XP", color: "#CC7A00" },
                { val: glowDrops.length, label: "Drops", color: "#0B3FD9" },
                { val: myMemberships.length, label: myMemberships.length === 1 ? "Group" : "Groups", color: "#1FB8FF" },
              ].map((s, i) => (
                <div key={i} className={statBoxClass} style={statBoxStyle}>
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "#6B7FA0" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <StreakSummaryCard user={user} />
      </div>

      {/* QUICK ACTION PANEL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Create Drop", icon: <PlusCircle size={24} />, iconColor: "#0B3FD9", iconBg: "rgba(11, 63, 217, 0.08)", iconBorder: "#D6E4FF", onClick: () => setIsDropModalOpen(true) },
          { label: "Join Challenge", icon: <Target size={24} />, iconColor: "#CC7A00", iconBg: "rgba(255, 159, 26, 0.1)", iconBorder: "#FFE4A0", to: createPageUrl("Dashboard")+"?tab=challenges" },
          { label: "AI Assistant", icon: <Sparkles size={24} />, iconColor: "#1FB8FF", iconBg: "rgba(31, 184, 255, 0.1)", iconBorder: "#B8E5FF", to: createPageUrl("Assistant") },
          { label: "Share Progress", icon: <Image size={24} />, iconColor: "#0B3FD9", iconBg: "rgba(11, 63, 217, 0.08)", iconBorder: "#D6E4FF", onClick: () => setIsShareOpen(true) },
        ].map((item, i) => {
          const inner = (
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: item.iconBg, border: `1px solid ${item.iconBorder}`, color: item.iconColor }}>{item.icon}</div>
          );
          const cls = "p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-0.5 cursor-pointer hover:shadow-md";
          const btnStyle = { background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#0B1B3D", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" };
          if (item.to) return <Link key={i} to={item.to} className={cls} style={btnStyle}>{inner}<span className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{item.label}</span></Link>;
          return <button key={i} onClick={item.onClick} className={cls} style={btnStyle}>{inner}<span className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{item.label}</span></button>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Truth */}
          <div className="rounded-[1.75rem] p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0", boxShadow: "0 4px 16px rgba(255, 159, 26, 0.1)" }}>
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none" style={{ color: "#FF9F1A" }}><Zap size={120} /></div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded" style={{ background: "linear-gradient(90deg, #FFD60A, #FF9F1A)", color: "#0B1B3D" }}>Daily Truth</span>
              {dailyCode?.bible_reference && <span className="text-xs font-medium" style={{ color: "#CC7A00" }}>{dailyCode.bible_reference}</span>}
            </div>
            <h3 className="text-2xl font-bold font-['Space_Grotesk'] mb-3 relative z-10 leading-snug" style={{ color: "#0B1B3D" }}>
              {dailyCode?.title || dailyCode?.slogan_text || "No live daily truth yet."}
            </h3>
            <p className="text-sm leading-relaxed mb-6 relative z-10" style={{ color: "#6B5A14" }}>
              {dailyCode?.title ? `"${dailyCode.slogan_text}"` : dailyCode?.slogan_text || "Publish a Daily Code to show live truth here."}
            </p>
            <div className="flex flex-wrap gap-3 relative z-10">
              <Button onClick={() => setIsDropModalOpen(true)} className="font-bold text-xs hover:opacity-90" style={{ background: "#FFFFFF", color: "#0B1B3D", border: "1px solid #E0EAF5" }}>
                <Share2 size={14} className="mr-2" /> Post as Glow Drop
              </Button>
              <Link to={createPageUrl("KeepIt100")} className="inline-flex items-center justify-center text-xs rounded-md px-3 py-2 font-medium transition" style={{ background: "#FFFFFF", border: "1px solid #FFD60A", color: "#CC7A00" }}>
                <Bookmark size={14} className="mr-2" /> Open Truth Library
              </Link>
            </div>
          </div>

          {/* Community Pulse */}
          <div className={cardClass} style={cardStyle}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-['Space_Grotesk'] flex items-center gap-2" style={{ color: "#0B1B3D" }}><Globe size={20} style={{ color: "#0B3FD9" }} /> Community Pulse</h3>
              <Link to={createPageUrl("Feed")} className="text-xs font-bold flex items-center" style={{ color: "#0B3FD9" }}>View all <ChevronRight size={14}/></Link>
            </div>
            <div className="space-y-4">
              {communityFeed.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: "#8A97B5" }}>No recent community drops.</div>
              ) : communityFeed.map(drop => {
                const repostOwner = getRepostOwner(drop.reflection);
                const visibleReflection = cleanReflection(drop.reflection);
                return (
                  <div key={drop.id} className="p-4 rounded-2xl flex gap-4" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5" }}>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} className="w-10 h-10 rounded-full shrink-0 overflow-hidden block" style={{ border: "1px solid #E0EAF5", background: "#FFFFFF" }}>
                          <img src={getProfilePicture(drop.user_email)} alt={getDisplayName(drop.user_email)} className="w-full h-full object-cover" />
                        </Link>
                      </HoverCardTrigger>
                      <HoverCardContent className="shadow-xl rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5" }} align="start">
                        <div className="flex items-start gap-3">
                          <img src={getProfilePicture(drop.user_email)} alt={getDisplayName(drop.user_email)} className="w-12 h-12 rounded-full object-cover" />
                          <div className="min-w-0">
                            <p className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{getDisplayName(drop.user_email)}</p>
                            <p className="text-xs mt-1" style={{ color: "#8A97B5" }}>{getProfileSummary(drop.user_email)}</p>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} className="font-bold text-sm truncate hover:underline" style={{ color: "#0B1B3D" }}>{getDisplayName(drop.user_email)}</Link>
                          </HoverCardTrigger>
                          <HoverCardContent className="shadow-xl rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5" }} align="start">
                            <div className="flex items-start gap-3">
                              <img src={getProfilePicture(drop.user_email)} alt={getDisplayName(drop.user_email)} className="w-12 h-12 rounded-full object-cover" />
                              <div className="min-w-0">
                                <p className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{getDisplayName(drop.user_email)}</p>
                                <p className="text-xs mt-1" style={{ color: "#8A97B5" }}>{getProfileSummary(drop.user_email)}</p>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                        <span className="text-[10px] shrink-0" style={{ color: "#8A97B5" }}>{new Date(drop.created_date).toLocaleDateString()}</span>
                      </div>
                      {repostOwner && (
                        <p className="text-xs mb-1" style={{ color: "#8A97B5" }}>
                          Reposted from <Link to={repostOwner === "Generation LightMode" ? createPageUrl("GenerationLightMode") : createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} className="font-semibold hover:underline" style={{ color: "#0B3FD9" }}>{repostOwner}</Link>
                        </p>
                      )}
                      <p className="text-xs font-bold mb-1 break-words" style={{ color: "#0B3FD9" }}>{drop.verse}</p>
                      {visibleReflection && (
                        containsHtml(visibleReflection) ? (
                          <div className="text-sm mb-3 overflow-hidden break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:break-all" style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", color: "#4A5878" }} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(visibleReflection) }} />
                        ) : (
                          <p className="text-sm mb-3 break-words" style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", color: "#4A5878" }}>{visibleReflection}</p>
                        )
                      )}
                      <div className="flex items-center gap-4" style={{ color: "#8A97B5" }}>
                        <button className="flex items-center gap-1.5 text-xs transition"><Heart size={14} /> {drop.likes_count || 0}</button>
                        <button className="flex items-center gap-1.5 text-xs transition"><MessageCircle size={14} /> Reply</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <LevelProgressCard user={user} />

          {/* Badges */}
          <div className={cardClass} style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-['Space_Grotesk'] uppercase tracking-widest flex items-center gap-2" style={{ color: "#0B1B3D" }}>
                <Award size={16} style={{ color: "#0B3FD9" }} /> Achievements
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { emoji: "💡", unlocked: true, title: "Glow Starter", bg: "rgba(11, 63, 217, 0.08)", border: "#D6E4FF" },
                { emoji: "🔥", unlocked: (user.daily_checkin_streak || user.streak_count || 0) >= 7, title: "7 Day Streak", bg: "rgba(255, 159, 26, 0.1)", border: "#FFE4A0" },
                { emoji: "🌊", unlocked: glowDrops.length >= 10, title: "10 Drops", bg: "rgba(31, 184, 255, 0.1)", border: "#B8E5FF" },
                { emoji: "🤝", unlocked: myMemberships.length > 0, title: "Community Member", bg: "rgba(11, 63, 217, 0.08)", border: "#D6E4FF" },
              ].map((b, i) => (
                <div key={i} className="aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1" title={b.title}
                  style={b.unlocked
                    ? { background: b.bg, border: `1px solid ${b.border}` }
                    : { background: "#F6F8FC", border: "1px solid #E0EAF5", opacity: 0.4, filter: "grayscale(1)" }}>
                  <span className="text-xl mb-1">{b.emoji}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GlowGroup */}
          <div className={cardClass} style={cardStyle}>
            <h3 className="text-sm font-bold font-['Space_Grotesk'] uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#0B1B3D" }}>
              <MessageSquare size={16} style={{ color: "#0B3FD9" }} /> My GlowGroup
            </h3>
            {myGroup ? (
              <div className="rounded-2xl p-4" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5" }}>
                <h4 className="font-bold text-sm mb-1" style={{ color: "#0B1B3D" }}>{myGroup.name}</h4>
                <p className="text-xs mb-3 line-clamp-1" style={{ color: "#6B7FA0" }}>{myGroup.description}</p>
                <Link to={createPageUrl("GlowGroups")} className="w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center" style={{ background: "rgba(11, 63, 217, 0.08)", color: "#0B3FD9", border: "1px solid #D6E4FF" }}>
                  Enter Group Room
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs mb-3" style={{ color: "#6B7FA0" }}>You haven't joined a group yet. Grow together with peers!</p>
                <Link to={createPageUrl("GlowGroups")} className="w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center" style={{ background: "rgba(11, 63, 217, 0.08)", color: "#0B3FD9", border: "1px solid #D6E4FF" }}>
                  Find a Group
                </Link>
              </div>
            )}
          </div>

          {/* Active Missions */}
          <div className={cardClass} style={cardStyle}>
            <h3 className="text-sm font-bold font-['Space_Grotesk'] uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#0B1B3D" }}>
              <Target size={16} style={{ color: "#CC7A00" }} /> Active Missions
            </h3>
            <div className="space-y-3">
              {challenges.length === 0 ? (
                <p className="text-xs text-center py-2" style={{ color: "#8A97B5" }}>No active missions right now.</p>
              ) : challenges.map(c => (
                <div key={c.id} className="rounded-xl p-3 flex justify-between items-center transition hover:-translate-y-0.5" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.04)" }}>
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-sm font-bold truncate" style={{ color: "#0B1B3D" }}>{c.title}</p>
                    <p className="text-[10px] truncate" style={{ color: "#6B7FA0" }}>{c.description}</p>
                  </div>
                  <span className="text-xs font-black shrink-0" style={{ color: "#CC7A00" }}>+{c.points_reward} XP</span>
                </div>
              ))}
            </div>
            <Link to={createPageUrl("Dashboard")+"?tab=challenges"} className="block text-center text-xs font-bold mt-4 hover:underline" style={{ color: "#0B3FD9" }}>View all missions</Link>
          </div>

          {/* Notifications */}
          {unreadNotifications.length > 0 && (
            <div className="rounded-[1.75rem] p-4 flex items-start gap-3" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
              <Bell className="mt-1 shrink-0" size={18} style={{ color: "#EF4444" }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#DC2626" }}>You have {unreadNotifications.length} new alerts!</p>
                <Link to={createPageUrl("Notifications")} className="text-xs underline mt-1 inline-block" style={{ color: "#EF4444" }}>View notifications</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}