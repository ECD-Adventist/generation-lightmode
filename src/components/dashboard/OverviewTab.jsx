import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Flame, Trophy, Award, MapPin, PlusCircle, Target, MessageSquare, ListOrdered, Share2, Bookmark, Heart, MessageCircle, ChevronRight, Zap, Bell, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import SubmitDropModal from "../feed/SubmitDropModal";

export default function OverviewTab({ user }) {
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);

  // Queries for dashboard data
  const { data: glowDrops = [] } = useQuery({
    queryKey: ["myGlowDrops", user.email],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: user.email })
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myMemberships", user.email],
    queryFn: () => base44.entities.GlowGroupMember.filter({ user_email: user.email })
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ["allGroups"],
    queryFn: () => base44.entities.GlowGroup.list(),
    enabled: myMemberships.length > 0
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["activeChallenges"],
    queryFn: () => base44.entities.Challenge.filter({ active: true }, '-created_date', 3)
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["myCertificates", user.email],
    queryFn: () => base44.entities.Certificate.filter({ user_email: user.email })
  });

  const { data: communityFeed = [] } = useQuery({
    queryKey: ["communityFeedOverview"],
    queryFn: () => base44.entities.GlowDrop.filter({ status: 'approved' }, '-created_date', 5)
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ["unreadNotifications", user.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email, read: false }, '-created_date', 5)
  });

  const myGroup = myMemberships.length > 0 ? allGroups.find(g => g.id === myMemberships[0].group_id) : null;
  const streak = user.streak_count || 1;
  const longestStreak = Math.max(streak, 7);

  // Rank calculation
  let rank = "Glow Starter";
  let rankColor = "#00CFFF";
  const score = user.glow_score || 0;
  if (score >= 500) { rank = "Glow Champion"; rankColor = "#FFD000"; }
  else if (score >= 200) { rank = "Trendsetter"; rankColor = "#8A5CFF"; }
  else if (score >= 50) { rank = "Light Warrior"; rankColor = "#1DA1FF"; }

  const nextRankScore = score >= 500 ? 1000 : score >= 200 ? 500 : score >= 50 ? 200 : 50;
  const progressPercent = Math.min(100, Math.max(0, (score / nextRankScore) * 100));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <SubmitDropModal isOpen={isDropModalOpen} onClose={() => setIsDropModalOpen(false)} user={user} />

      {/* TOP: USER OVERVIEW & STREAK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Overview Panel */}
        <div className="lg:col-span-2 bg-[#121826]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00CFFF]/10 to-[#8A5CFF]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative shrink-0">
            <div className={`absolute inset-[-4px] rounded-full blur-sm opacity-70 animate-pulse-glow`} style={{ background: rankColor }}></div>
            <img src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} 
                 className="w-24 h-24 rounded-full border-4 border-[#0B0F1A] relative z-10 object-cover" alt="Profile" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#0B0F1A] z-20 shadow-lg" style={{ background: rankColor }}>
              {rank}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left z-10 w-full">
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">{user.full_name}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-400 mt-1 mb-4">
              <MapPin size={14} className="text-[#00CFFF]" /> {user.country || "Global Citizen"}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#0B0F1A] rounded-xl p-3 border border-white/5 text-center">
                <div className="text-xl font-bold text-[#FFD000]">{score}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">XP</div>
              </div>
              <div className="bg-[#0B0F1A] rounded-xl p-3 border border-white/5 text-center">
                <div className="text-xl font-bold text-[#00CFFF]">{glowDrops.length}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Drops</div>
              </div>
              <div className="bg-[#0B0F1A] rounded-xl p-3 border border-white/5 text-center">
                <div className="text-xl font-bold text-[#8A5CFF]">{myMemberships.length > 0 ? "1" : "0"}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Group</div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Streak Card */}
        <div className="bg-gradient-to-br from-[#1A1500] to-[#121826] border border-[#FFD000]/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(255,208,0,0.1)] relative overflow-hidden flex flex-col justify-center items-center text-center group">
          <div className="absolute inset-0 bg-[#FFD000]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Flame size={48} className="text-[#FFD000] mb-3 drop-shadow-[0_0_15px_rgba(255,208,0,0.5)] animate-pulse" />
          <h3 className="text-4xl font-black font-['Space_Grotesk'] text-white mb-1">{streak} <span className="text-xl text-gray-400">Days</span></h3>
          <p className="text-sm text-[#FFD000] font-bold tracking-wide uppercase mb-3">Light Streak</p>
          <p className="text-xs text-gray-400">Longest: {longestStreak} days</p>
          <div className="mt-4 px-4 py-2 rounded-full bg-[#FFD000]/10 border border-[#FFD000]/20 text-[#FFD000] text-xs font-semibold">
            Keep shining! You're on fire. 🔥
          </div>
        </div>
      </div>

      {/* QUICK ACTION PANEL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setIsDropModalOpen(true)} className="bg-[#00CFFF]/10 border border-[#00CFFF]/30 hover:bg-[#00CFFF]/20 hover:scale-[1.02] transition-all p-4 rounded-2xl flex flex-col items-center justify-center gap-3 text-[#00CFFF] group">
          <div className="w-12 h-12 rounded-full bg-[#00CFFF]/20 flex items-center justify-center group-hover:bg-[#00CFFF]/30 transition-colors">
            <PlusCircle size={24} />
          </div>
          <span className="font-bold text-sm">Create Drop</span>
        </button>
        <Link to={createPageUrl("Dashboard")+"?tab=challenges"} className="bg-[#FFD000]/10 border border-[#FFD000]/30 hover:bg-[#FFD000]/20 hover:scale-[1.02] transition-all p-4 rounded-2xl flex flex-col items-center justify-center gap-3 text-[#FFD000] group">
          <div className="w-12 h-12 rounded-full bg-[#FFD000]/20 flex items-center justify-center group-hover:bg-[#FFD000]/30 transition-colors">
            <Target size={24} />
          </div>
          <span className="font-bold text-sm">Join Challenge</span>
        </Link>
        <Link to={createPageUrl("Assistant")} className="bg-[#8A5CFF]/10 border border-[#8A5CFF]/30 hover:bg-[#8A5CFF]/20 hover:scale-[1.02] transition-all p-4 rounded-2xl flex flex-col items-center justify-center gap-3 text-[#8A5CFF] group">
          <div className="w-12 h-12 rounded-full bg-[#8A5CFF]/20 flex items-center justify-center group-hover:bg-[#8A5CFF]/30 transition-colors">
            <Sparkles size={24} />
          </div>
          <span className="font-bold text-sm">AI Assistant</span>
        </Link>
        <Link to={createPageUrl("Dashboard")+"?tab=leaderboard"} className="bg-[#1DA1FF]/10 border border-[#1DA1FF]/30 hover:bg-[#1DA1FF]/20 hover:scale-[1.02] transition-all p-4 rounded-2xl flex flex-col items-center justify-center gap-3 text-[#1DA1FF] group">
          <div className="w-12 h-12 rounded-full bg-[#1DA1FF]/20 flex items-center justify-center group-hover:bg-[#1DA1FF]/30 transition-colors">
            <ListOrdered size={24} />
          </div>
          <span className="font-bold text-sm">Leaderboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Daily Drop & Community Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Glow Drop Devotional */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Zap size={120} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[#FFD000] text-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Daily Word</span>
              <span className="text-gray-400 text-xs font-medium">Matthew 5:16</span>
            </div>
            <h3 className="text-2xl font-bold font-['Space_Grotesk'] text-white mb-3 relative z-10 leading-snug">
              "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven."
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 relative z-10">
              Don't hide your faith today. Your actions online and offline are a reflection of God's love. How will you shine your light in your community today?
            </p>
            <div className="flex flex-wrap gap-3 relative z-10">
              <Button onClick={() => setIsDropModalOpen(true)} className="bg-white text-black hover:bg-gray-200 font-bold text-xs">
                <Share2 size={14} className="mr-2" /> Post as Glow Drop
              </Button>
              <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300 text-xs">
                <Bookmark size={14} className="mr-2" /> Save for later
              </Button>
            </div>
          </div>

          {/* Community Activity Feed Preview */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-['Space_Grotesk'] flex items-center gap-2"><Globe className="text-[#00CFFF]" size={20} /> Community Pulse</h3>
              <Link to={createPageUrl("Feed")} className="text-xs text-[#00CFFF] hover:underline flex items-center">View all <ChevronRight size={14}/></Link>
            </div>
            <div className="space-y-4">
              {communityFeed.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No recent community drops.</div>
              ) : (
                communityFeed.map(drop => (
                  <div key={drop.id} className="bg-[#0B0F1A] border border-white/5 p-4 rounded-2xl flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#121826] border border-white/10 shrink-0 flex items-center justify-center font-bold text-gray-400 text-sm">
                      {drop.user_email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm text-white truncate">{drop.user_email}</p>
                        <span className="text-[10px] text-gray-500">{new Date(drop.created_date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-bold text-[#8A5CFF] mb-1">{drop.verse}</p>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{drop.reflection}</p>
                      <div className="flex items-center gap-4 text-gray-500">
                        <button className="flex items-center gap-1.5 text-xs hover:text-[#00CFFF] transition"><Heart size={14} /> {drop.likes_count || 0}</button>
                        <button className="flex items-center gap-1.5 text-xs hover:text-white transition"><MessageCircle size={14} /> Reply</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Badges, Leaderboard, Groups, Challenges */}
        <div className="space-y-6">
          
          {/* Leaderboard Progress */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-bold font-['Space_Grotesk'] text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-[#FFD000]" /> Rank Progress
            </h3>
            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-black text-white">{score} <span className="text-sm text-gray-500 font-medium">XP</span></span>
              <span className="text-xs text-gray-400 font-bold uppercase">{rank}</span>
            </div>
            <div className="w-full h-2 bg-[#0B0F1A] rounded-full overflow-hidden mb-2 border border-white/5">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%`, background: rankColor }}></div>
            </div>
            <p className="text-[10px] text-gray-500 text-right">{nextRankScore - score} XP to next rank</p>
          </div>

          {/* Badges & Achievements */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-['Space_Grotesk'] text-gray-300 uppercase tracking-widest flex items-center gap-2">
                <Award size={16} className="text-[#8A5CFF]" /> Achievements
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="aspect-square rounded-xl bg-gradient-to-br from-[#00CFFF]/20 to-transparent border border-[#00CFFF]/30 flex flex-col items-center justify-center text-center p-1" title="Glow Starter">
                <span className="text-xl mb-1 drop-shadow-md">💡</span>
              </div>
              <div className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1 border ${streak >= 7 ? 'bg-gradient-to-br from-[#FFD000]/20 to-transparent border-[#FFD000]/30' : 'bg-white/5 border-white/5 opacity-40 grayscale'}`} title="7 Day Streak">
                <span className="text-xl mb-1 drop-shadow-md">🔥</span>
              </div>
              <div className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1 border ${glowDrops.length >= 10 ? 'bg-gradient-to-br from-[#1DA1FF]/20 to-transparent border-[#1DA1FF]/30' : 'bg-white/5 border-white/5 opacity-40 grayscale'}`} title="10 Drops">
                <span className="text-xl mb-1 drop-shadow-md">🌊</span>
              </div>
              <div className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1 border ${myMemberships.length > 0 ? 'bg-gradient-to-br from-[#8A5CFF]/20 to-transparent border-[#8A5CFF]/30' : 'bg-white/5 border-white/5 opacity-40 grayscale'}`} title="Community Member">
                <span className="text-xl mb-1 drop-shadow-md">🤝</span>
              </div>
            </div>
          </div>

          {/* GlowGroup Panel */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-bold font-['Space_Grotesk'] text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-[#00CFFF]" /> My GlowGroup
            </h3>
            {myGroup ? (
              <div className="bg-[#0B0F1A] border border-white/5 rounded-2xl p-4">
                <h4 className="font-bold text-white text-sm mb-1">{myGroup.name}</h4>
                <p className="text-xs text-gray-400 mb-3 line-clamp-1">{myGroup.description}</p>
                <Link to={createPageUrl("GlowGroups")} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition flex items-center justify-center">
                  Enter Group Room
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400 mb-3">You haven't joined a group yet. Grow together with peers!</p>
                <Link to={createPageUrl("GlowGroups")} className="w-full py-2 bg-[#00CFFF]/10 border border-[#00CFFF]/30 text-[#00CFFF] hover:bg-[#00CFFF]/20 rounded-lg text-xs font-bold transition flex items-center justify-center">
                  Find a Group
                </Link>
              </div>
            )}
          </div>

          {/* Active Challenges Preview */}
          <div className="bg-[#121826] border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-bold font-['Space_Grotesk'] text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target size={16} className="text-[#FFD000]" /> Active Missions
            </h3>
            <div className="space-y-3">
              {challenges.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">No active missions right now.</p>
              ) : (
                challenges.map(c => (
                  <div key={c.id} className="bg-[#0B0F1A] border border-white/5 rounded-xl p-3 flex justify-between items-center group cursor-pointer hover:border-white/20 transition">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-sm font-bold text-white truncate">{c.title}</p>
                      <p className="text-[10px] text-gray-400 truncate">{c.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-black text-[#FFD000]">+{c.points_reward} XP</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link to={createPageUrl("Dashboard")+"?tab=challenges"} className="block text-center text-xs text-[#00CFFF] font-bold mt-4 hover:underline">View all missions</Link>
          </div>

          {/* Notifications Mini Panel */}
          {unreadNotifications.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-4 flex items-start gap-3">
              <Bell className="text-red-400 mt-1 shrink-0" size={18} />
              <div>
                <p className="text-sm font-bold text-red-400">You have {unreadNotifications.length} new alerts!</p>
                <Link to={createPageUrl("Notifications")} className="text-xs text-red-300 underline mt-1 inline-block">View notifications</Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}