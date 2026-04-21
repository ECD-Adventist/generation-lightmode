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
  const { data: publicUsers = [] } = useQuery({
    queryKey: ["overviewPublicUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    }
  });
  const { data: allGroups = [] } = useQuery({ queryKey: ["allGroups"], queryFn: () => base44.entities.GlowGroup.list(), enabled: myMemberships.length > 0 });
  const { data: challenges = [] } = useQuery({ queryKey: ["activeChallenges"], queryFn: () => base44.entities.Challenge.filter({ active: true }, '-created_date', 3) });
  const { data: certificates = [] } = useQuery({ queryKey: ["myCertificates", user.email], queryFn: () => base44.entities.Certificate.filter({ user_email: user.email }) });
  const { data: communityFeed = [] } = useQuery({ queryKey: ["communityFeedOverview"], queryFn: () => base44.entities.GlowDrop.filter({ status: 'approved' }, '-created_date', 5) });
  const { data: unreadNotifications = [] } = useQuery({ queryKey: ["unreadNotifications", user.email], queryFn: () => base44.entities.Notification.filter({ user_email: user.email, read: false }, '-created_date', 5) });
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

  const getDisplayName = (email) => userMap.get(email)?.full_name || email?.split('@')[0] || "Community Member";
  const getProfilePicture = (email) => userMap.get(email)?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";
  const getProfileSummary = (email) => userMap.get(email)?.bio || userMap.get(email)?.country || "LightMode member";

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

  const cardClass = "bg-card border border-border shadow-sm rounded-[1.75rem] p-6";
  const statBoxClass = "bg-muted border border-border rounded-xl p-3 text-center";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-['Inter']">
      <SubmitDropModal isOpen={isDropModalOpen} onClose={() => setIsDropModalOpen(false)} user={user} />
      <ShareProgressModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} user={user} />

      {/* TOP: USER OVERVIEW & STREAK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6 ${cardClass}`}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none bg-cyan-500/10" />
          <div className="relative shrink-0">
            <div className={`absolute inset-[-4px] rounded-full blur-sm opacity-40 ${bgClass}`} />
            <img src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-24 h-24 rounded-full relative z-10 object-cover border-4 border-background shadow-sm" alt="Profile" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider z-20 bg-foreground text-background shadow-sm">
              {rank}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left z-10 w-full">
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">{user.full_name}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm mt-1 mb-4 text-muted-foreground">
              <MapPin size={14} className="text-blue-600 dark:text-blue-400" /> {user.country || "Global Citizen"}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: score, label: "XP", color: "text-amber-600 dark:text-amber-400" },
                { val: glowDrops.length, label: "Drops", color: "text-blue-600 dark:text-blue-400" },
                { val: myMemberships.length > 0 ? "1" : "0", label: "Group", color: "text-cyan-500" },
              ].map((s, i) => (
                <div key={i} className={statBoxClass}>
                  <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-[10px] uppercase tracking-widest mt-1 text-muted-foreground">{s.label}</div>
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
          { label: "Create Drop", icon: <PlusCircle size={24} />, colorClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/20", onClick: () => setIsDropModalOpen(true) },
          { label: "Join Challenge", icon: <Target size={24} />, colorClass: "text-amber-600 dark:text-amber-400", bgClass: "bg-amber-500/10", borderClass: "border-amber-500/20", to: createPageUrl("Dashboard")+"?tab=challenges" },
          { label: "AI Assistant", icon: <Sparkles size={24} />, colorClass: "text-cyan-500", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-500/20", to: createPageUrl("Assistant") },
          { label: "Share Progress", icon: <Image size={24} />, colorClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/20", onClick: () => setIsShareOpen(true) },
        ].map((item, i) => {
          const inner = (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 border ${item.bgClass} ${item.borderClass} ${item.colorClass}`}>{item.icon}</div>
          );
          const cls = "p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-0.5 cursor-pointer bg-card border border-border text-foreground hover:shadow-sm";
          if (item.to) return <Link key={i} to={item.to} className={cls}>{inner}<span className="font-bold text-sm text-foreground">{item.label}</span></Link>;
          return <button key={i} onClick={item.onClick} className={cls}>{inner}<span className="font-bold text-sm text-foreground">{item.label}</span></button>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Truth */}
          <div className="rounded-[1.75rem] p-6 relative overflow-hidden bg-amber-500/10 border border-amber-500/20 shadow-sm">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none text-amber-500"><Zap size={120} /></div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-gradient-to-r from-amber-400 to-amber-500 text-black">Daily Truth</span>
              {dailyCode?.bible_reference && <span className="text-xs font-medium text-amber-700 dark:text-amber-500">{dailyCode.bible_reference}</span>}
            </div>
            <h3 className="text-2xl font-bold font-['Space_Grotesk'] mb-3 relative z-10 leading-snug text-foreground">
              {dailyCode?.title || dailyCode?.slogan_text || "No live daily truth yet."}
            </h3>
            <p className="text-sm leading-relaxed mb-6 relative z-10 text-muted-foreground">
              {dailyCode?.title ? `"${dailyCode.slogan_text}"` : dailyCode?.slogan_text || "Publish a Daily Code to show live truth here."}
            </p>
            <div className="flex flex-wrap gap-3 relative z-10">
              <Button onClick={() => setIsDropModalOpen(true)} className="font-bold text-xs bg-foreground text-background hover:opacity-90">
                <Share2 size={14} className="mr-2" /> Post as Glow Drop
              </Button>
              <Link to={createPageUrl("KeepIt100")} className="inline-flex items-center justify-center text-xs rounded-md px-3 py-2 font-medium transition border border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10">
                <Bookmark size={14} className="mr-2" /> Open Truth Library
              </Link>
            </div>
          </div>

          {/* Community Pulse */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-['Space_Grotesk'] flex items-center gap-2 text-foreground"><Globe size={20} className="text-blue-600 dark:text-blue-400" /> Community Pulse</h3>
              <Link to={createPageUrl("Feed")} className="text-xs font-bold flex items-center text-blue-600 dark:text-blue-400">View all <ChevronRight size={14}/></Link>
            </div>
            <div className="space-y-4">
              {communityFeed.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No recent community drops.</div>
              ) : communityFeed.map(drop => {
                const repostOwner = getRepostOwner(drop.reflection);
                const visibleReflection = cleanReflection(drop.reflection);
                return (
                  <div key={drop.id} className="p-4 rounded-2xl flex gap-4 bg-muted border border-border">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} className="w-10 h-10 rounded-full shrink-0 overflow-hidden block border border-border bg-background">
                          <img src={getProfilePicture(drop.user_email)} alt={getDisplayName(drop.user_email)} className="w-full h-full object-cover" />
                        </Link>
                      </HoverCardTrigger>
                      <HoverCardContent className="bg-card border border-border shadow-xl rounded-2xl p-4" align="start">
                        <div className="flex items-start gap-3">
                          <img src={getProfilePicture(drop.user_email)} alt={getDisplayName(drop.user_email)} className="w-12 h-12 rounded-full object-cover" />
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground">{getDisplayName(drop.user_email)}</p>
                            <p className="text-xs mt-1 text-muted-foreground">{getProfileSummary(drop.user_email)}</p>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} className="font-bold text-sm truncate hover:underline text-foreground">{getDisplayName(drop.user_email)}</Link>
                          </HoverCardTrigger>
                          <HoverCardContent className="bg-card border border-border shadow-xl rounded-2xl p-4" align="start">
                            <div className="flex items-start gap-3">
                              <img src={getProfilePicture(drop.user_email)} alt={getDisplayName(drop.user_email)} className="w-12 h-12 rounded-full object-cover" />
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-foreground">{getDisplayName(drop.user_email)}</p>
                                <p className="text-xs mt-1 text-muted-foreground">{getProfileSummary(drop.user_email)}</p>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                        <span className="text-[10px] shrink-0 text-muted-foreground">{new Date(drop.created_date).toLocaleDateString()}</span>
                      </div>
                      {repostOwner && (
                        <p className="text-xs mb-1 text-muted-foreground">
                          Reposted from <Link to={repostOwner === "Generation LightMode" ? createPageUrl("GenerationLightMode") : createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} className="font-semibold hover:underline text-blue-600 dark:text-blue-400">{repostOwner}</Link>
                        </p>
                      )}
                      <p className="text-xs font-bold mb-1 break-words text-blue-600 dark:text-blue-400">{drop.verse}</p>
                      {visibleReflection && (
                        containsHtml(visibleReflection) ? (
                          <div className="text-sm mb-3 overflow-hidden break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:break-all text-muted-foreground" style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(visibleReflection) }} />
                        ) : (
                          <p className="text-sm mb-3 break-words text-muted-foreground" style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{visibleReflection}</p>
                        )
                      )}
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <button className="flex items-center gap-1.5 text-xs transition hover:text-blue-600 dark:hover:text-blue-400"><Heart size={14} /> {drop.likes_count || 0}</button>
                        <button className="flex items-center gap-1.5 text-xs transition hover:text-foreground"><MessageCircle size={14} /> Reply</button>
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
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-['Space_Grotesk'] uppercase tracking-widest flex items-center gap-2 text-foreground">
                <Award size={16} className="text-blue-600 dark:text-blue-400" /> Achievements
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { emoji: "💡", unlocked: true, color: "#0B3FD9", title: "Glow Starter", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/30" },
                { emoji: "🔥", unlocked: (user.daily_checkin_streak || user.streak_count || 0) >= 7, color: "#CC7A00", title: "7 Day Streak", bgClass: "bg-amber-500/10", borderClass: "border-amber-500/30" },
                { emoji: "🌊", unlocked: glowDrops.length >= 10, color: "#1FB8FF", title: "10 Drops", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-500/30" },
                { emoji: "🤝", unlocked: myMemberships.length > 0, color: "#0B3FD9", title: "Community Member", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/30" },
              ].map((b, i) => (
                <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1 ${b.unlocked ? `${b.bgClass} border ${b.borderClass}` : "bg-muted border border-border opacity-40 grayscale"}`} title={b.title}>
                  <span className="text-xl mb-1">{b.emoji}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GlowGroup */}
          <div className={cardClass}>
            <h3 className="text-sm font-bold font-['Space_Grotesk'] uppercase tracking-widest mb-4 flex items-center gap-2 text-foreground">
              <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" /> My GlowGroup
            </h3>
            {myGroup ? (
              <div className="rounded-2xl p-4 bg-muted border border-border">
                <h4 className="font-bold text-sm mb-1 text-foreground">{myGroup.name}</h4>
                <p className="text-xs mb-3 line-clamp-1 text-muted-foreground">{myGroup.description}</p>
                <Link to={createPageUrl("GlowGroups")} className="w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20">
                  Enter Group Room
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs mb-3 text-muted-foreground">You haven't joined a group yet. Grow together with peers!</p>
                <Link to={createPageUrl("GlowGroups")} className="w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20">
                  Find a Group
                </Link>
              </div>
            )}
          </div>

          {/* Active Missions */}
          <div className={cardClass}>
            <h3 className="text-sm font-bold font-['Space_Grotesk'] uppercase tracking-widest mb-4 flex items-center gap-2 text-foreground">
              <Target size={16} className="text-amber-600 dark:text-amber-400" /> Active Missions
            </h3>
            <div className="space-y-3">
              {challenges.length === 0 ? (
                <p className="text-xs text-center py-2 text-muted-foreground">No active missions right now.</p>
              ) : challenges.map(c => (
                <div key={c.id} className="rounded-xl p-3 flex justify-between items-center transition hover:-translate-y-0.5 bg-muted border border-border shadow-sm">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-sm font-bold truncate text-foreground">{c.title}</p>
                    <p className="text-[10px] truncate text-muted-foreground">{c.description}</p>
                  </div>
                  <span className="text-xs font-black shrink-0 text-amber-600 dark:text-amber-400">+{c.points_reward} XP</span>
                </div>
              ))}
            </div>
            <Link to={createPageUrl("Dashboard")+"?tab=challenges"} className="block text-center text-xs font-bold mt-4 hover:underline text-blue-600 dark:text-blue-400">View all missions</Link>
          </div>

          {/* Notifications */}
          {unreadNotifications.length > 0 && (
            <div className="rounded-[1.75rem] p-4 flex items-start gap-3 bg-red-500/10 border border-red-500/20">
              <Bell className="mt-1 shrink-0 text-red-500" size={18} />
              <div>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">You have {unreadNotifications.length} new alerts!</p>
                <Link to={createPageUrl("Notifications")} className="text-xs underline mt-1 inline-block text-red-500">View notifications</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}