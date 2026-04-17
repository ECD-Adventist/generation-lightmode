import React, { useState, useMemo } from "react";
import { Award, Flame, Zap, Heart, Users, MessageCircle, Target, Star, Globe, BookOpen, Shield, Crown, Sparkles, TrendingUp } from "lucide-react";

// Badge definitions with milestone-based criteria
const BADGE_DEFINITIONS = [
  // Streak Badges
  { id: "streak_3", name: "3-Day Streak", desc: "Posted drops 3 days in a row", icon: "🔥", category: "streak", check: (ctx) => ctx.streak >= 3, tier: "bronze" },
  { id: "streak_7", name: "7-Day Streak", desc: "A full week of consistent posting", icon: "🔥", category: "streak", check: (ctx) => ctx.streak >= 7, tier: "silver" },
  { id: "streak_30", name: "30-Day Glow Streak", desc: "A full month of daily drops — legendary consistency!", icon: "🔥", category: "streak", check: (ctx) => ctx.streak >= 30, tier: "gold" },
  { id: "streak_90", name: "Quarterly Fire", desc: "90 consecutive days of faith sharing", icon: "💎", category: "streak", check: (ctx) => ctx.streak >= 90, tier: "platinum" },

  // Engagement / Influencer Badges
  { id: "first_drop", name: "First Light", desc: "Shared your first Glow Drop", icon: "✨", category: "content", check: (ctx) => ctx.drops >= 1, tier: "bronze" },
  { id: "drops_10", name: "Consistent Sharer", desc: "Shared 10 Glow Drops", icon: "📝", category: "content", check: (ctx) => ctx.drops >= 10, tier: "silver" },
  { id: "drops_50", name: "Prolific Creator", desc: "Shared 50 Glow Drops — a true content creator", icon: "🌟", category: "content", check: (ctx) => ctx.drops >= 50, tier: "gold" },
  { id: "drops_100", name: "Century Missionary", desc: "100 Glow Drops shared with the world", icon: "💯", category: "content", check: (ctx) => ctx.drops >= 100, tier: "platinum" },
  { id: "influencer", name: "Community Influencer", desc: "Your drops have received 50+ total likes", icon: "⭐", category: "content", check: (ctx) => ctx.totalLikes >= 50, tier: "gold" },
  { id: "viral", name: "Viral Light", desc: "One of your drops got 20+ likes", icon: "🚀", category: "content", check: (ctx) => ctx.maxLikesOnDrop >= 20, tier: "gold" },
  { id: "monthly_evangelist", name: "Monthly Evangelist", desc: "Posted 20+ drops in a single calendar month", icon: "📅", category: "content", check: (ctx) => ctx.bestMonthDrops >= 20, tier: "gold" },

  // Prayer Badges
  { id: "prayer_5", name: "Prayer Supporter", desc: "Supported 5 prayer requests", icon: "🙏", category: "prayer", check: (ctx) => ctx.prayerSupports >= 5, tier: "bronze" },
  { id: "prayer_10", name: "10 Prayer Answers", desc: "Stood in prayer for 10 requests", icon: "🙏", category: "prayer", check: (ctx) => ctx.prayerSupports >= 10, tier: "silver" },
  { id: "prayer_50", name: "Prayer Warrior", desc: "Supported 50+ prayer requests — a mighty intercessor", icon: "🛡️", category: "prayer", check: (ctx) => ctx.prayerSupports >= 50, tier: "gold" },

  // Social Badges
  { id: "follow_5", name: "Social Butterfly", desc: "Following 5+ people", icon: "🦋", category: "social", check: (ctx) => ctx.following >= 5, tier: "bronze" },
  { id: "follow_20", name: "Network Builder", desc: "Following 20+ people", icon: "🌐", category: "social", check: (ctx) => ctx.following >= 20, tier: "silver" },
  { id: "followers_10", name: "Rising Star", desc: "Gained 10+ followers", icon: "⭐", category: "social", check: (ctx) => ctx.followers >= 10, tier: "silver" },
  { id: "followers_50", name: "Light Magnet", desc: "50+ people follow your journey", icon: "🧲", category: "social", check: (ctx) => ctx.followers >= 50, tier: "gold" },

  // Community Badges
  { id: "group_member", name: "Community Member", desc: "Joined your first GlowGroup", icon: "🤝", category: "community", check: (ctx) => ctx.groups >= 1, tier: "bronze" },
  { id: "group_3", name: "Group Enthusiast", desc: "Joined 3+ GlowGroups", icon: "👥", category: "community", check: (ctx) => ctx.groups >= 3, tier: "silver" },

  // XP Badges
  { id: "xp_100", name: "Spark", desc: "Reached 100 XP", icon: "⚡", category: "xp", check: (ctx) => ctx.xp >= 100, tier: "bronze" },
  { id: "xp_500", name: "Flame", desc: "Reached 500 XP", icon: "🔥", category: "xp", check: (ctx) => ctx.xp >= 500, tier: "silver" },
  { id: "xp_1000", name: "Beacon", desc: "Reached 1000 XP — a true beacon of light", icon: "🏆", category: "xp", check: (ctx) => ctx.xp >= 1000, tier: "gold" },
  { id: "xp_5000", name: "Radiance", desc: "5000 XP — blinding light!", icon: "💎", category: "xp", check: (ctx) => ctx.xp >= 5000, tier: "platinum" },

  // Challenge Badges
  { id: "challenge_1", name: "Challenge Accepted", desc: "Completed your first challenge", icon: "🎯", category: "challenges", check: (ctx) => ctx.challenges >= 1, tier: "bronze" },
  { id: "challenge_5", name: "Mission Driven", desc: "Completed 5 challenges", icon: "🎯", category: "challenges", check: (ctx) => ctx.challenges >= 5, tier: "silver" },
  { id: "challenge_20", name: "Challenge Champion", desc: "Completed 20 challenges — unstoppable!", icon: "🏅", category: "challenges", check: (ctx) => ctx.challenges >= 20, tier: "gold" },

  // Special Badges
  { id: "early_riser", name: "Early Riser", desc: "Posted a drop between 4 AM and 7 AM", icon: "🌅", category: "special", check: (ctx) => ctx.hasEarlyDrop, tier: "silver" },
  { id: "pledge_signer", name: "Pledge Keeper", desc: "Signed the LightMode Pledge", icon: "✋", category: "special", check: (ctx) => ctx.pledgeSigned, tier: "bronze" },
];

const tierStyles = {
  bronze: { border: "border-[#CD7F32]/30", bg: "from-[#CD7F32]/15 to-[#8B5C2A]/5", glow: "shadow-[0_0_12px_rgba(205,127,50,0.15)]", label: "Bronze", color: "#CD7F32" },
  silver: { border: "border-[#C0C0C0]/30", bg: "from-[#C0C0C0]/15 to-[#8A8A8A]/5", glow: "shadow-[0_0_12px_rgba(192,192,192,0.15)]", label: "Silver", color: "#C0C0C0" },
  gold: { border: "border-[#FFD000]/30", bg: "from-[#FFD000]/15 to-[#FF9F1A]/5", glow: "shadow-[0_0_16px_rgba(255,208,0,0.2)]", label: "Gold", color: "#FFD000" },
  platinum: { border: "border-[#A8C0FF]/30", bg: "from-[#A8C0FF]/15 to-[#8A5CFF]/5", glow: "shadow-[0_0_20px_rgba(168,192,255,0.2)]", label: "Platinum", color: "#A8C0FF" },
};

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "streak", label: "Streaks" },
  { key: "content", label: "Content" },
  { key: "prayer", label: "Prayer" },
  { key: "social", label: "Social" },
  { key: "community", label: "Community" },
  { key: "xp", label: "XP Levels" },
  { key: "challenges", label: "Challenges" },
  { key: "special", label: "Special" },
];

export default function AchievementBadges({ user, myDrops, myFollowing, myFollowers, myMemberships, mySupports, challengeSubmissions, certificates }) {
  const [activeCategory, setActiveCategory] = React.useState("all");

  // Build context for badge evaluation
  const badgeContext = useMemo(() => {
    const totalLikes = myDrops.reduce((sum, d) => sum + (d.likes_count || 0), 0);
    const maxLikesOnDrop = myDrops.reduce((max, d) => Math.max(max, d.likes_count || 0), 0);

    // Calculate best month drops
    const monthCounts = {};
    myDrops.forEach(d => {
      if (d.created_date) {
        const key = d.created_date.substring(0, 7); // YYYY-MM
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      }
    });
    const bestMonthDrops = Math.max(0, ...Object.values(monthCounts));

    const hasEarlyDrop = myDrops.some(d => {
      if (!d.created_date) return false;
      const h = new Date(d.created_date).getHours();
      return h >= 4 && h <= 7;
    });

    return {
      xp: user?.glow_score || 0,
      streak: user?.faith_streak_count || 0,
      drops: myDrops.length,
      totalLikes,
      maxLikesOnDrop,
      bestMonthDrops,
      following: myFollowing.length,
      followers: myFollowers.length,
      groups: myMemberships.length,
      prayerSupports: mySupports.length,
      challenges: challengeSubmissions.length,
      hasEarlyDrop,
      pledgeSigned: !!user?.pledge_signed,
    };
  }, [user, myDrops, myFollowing, myFollowers, myMemberships, mySupports, challengeSubmissions]);

  // Evaluate which badges are earned and which are locked
  const { earned, locked } = useMemo(() => {
    const e = [];
    const l = [];
    BADGE_DEFINITIONS.forEach(badge => {
      if (badge.check(badgeContext)) {
        e.push(badge);
      } else {
        l.push(badge);
      }
    });
    return { earned: e, locked: l };
  }, [badgeContext]);

  const filteredEarned = activeCategory === "all" ? earned : earned.filter(b => b.category === activeCategory);
  const filteredLocked = activeCategory === "all" ? locked : locked.filter(b => b.category === activeCategory);

  return (
    <div className="py-6 px-4 space-y-8">
      {/* Certificates Section */}
      {certificates.length > 0 && (
        <div>
          <h3 className="text-lg font-bold font-['Space_Grotesk'] text-[#FFD000] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" /> Glow Certificates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-gradient-to-r from-[#121826] to-[#0B0F1A] p-5 rounded-2xl border border-[#FFD000]/30 shadow-[0_0_20px_rgba(255,208,0,0.15)] flex items-center gap-5">
                <div className="text-4xl drop-shadow-lg bg-black/30 w-16 h-16 rounded-full flex items-center justify-center border-2 border-[#FFD000]/50 shrink-0">{cert.icon}</div>
                <div className="min-w-0">
                  <div className="text-[10px] text-[#FFD000] font-bold uppercase tracking-widest mb-0.5">Official Milestone</div>
                  <h4 className="text-base font-bold text-white font-['Space_Grotesk'] truncate">{cert.title}</h4>
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{cert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Bar */}
      <div className="flex items-center gap-6 bg-[#121826] rounded-2xl p-4 border border-white/5">
        <div className="text-center">
          <div className="text-2xl font-black text-[#00CFFF] font-['Space_Grotesk']">{earned.length}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Earned</div>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="text-center">
          <div className="text-2xl font-black text-gray-500 font-['Space_Grotesk']">{locked.length}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Locked</div>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="text-center">
          <div className="text-2xl font-black text-[#FFD000] font-['Space_Grotesk']">{BADGE_DEFINITIONS.length}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total</div>
        </div>
        <div className="flex-1" />
        <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] rounded-full" style={{ width: `${(earned.length / BADGE_DEFINITIONS.length) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-400 font-bold">{Math.round((earned.length / BADGE_DEFINITIONS.length) * 100)}%</span>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.key
                ? "bg-[#00CFFF]/20 text-[#00CFFF] border border-[#00CFFF]/30"
                : "bg-white/5 text-gray-400 border border-white/10 hover:text-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Earned Badges */}
      {filteredEarned.length > 0 && (
        <div>
          <h3 className="text-sm font-bold font-['Space_Grotesk'] text-[#00CFFF] mb-3 flex items-center gap-2 uppercase tracking-widest">
            <Sparkles className="w-4 h-4" /> Earned Badges
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredEarned.map(badge => {
              const style = tierStyles[badge.tier];
              return (
                <div key={badge.id} className={`bg-gradient-to-br ${style.bg} p-5 rounded-2xl border ${style.border} ${style.glow} text-center flex flex-col items-center`}>
                  <div className="text-4xl mb-3 drop-shadow-md">{badge.icon}</div>
                  <div className="font-bold text-white text-sm leading-tight">{badge.name}</div>
                  <div className="text-xs text-gray-400 mt-1.5 leading-relaxed">{badge.desc}</div>
                  <div className="mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ color: style.color, background: `${style.color}18`, border: `1px solid ${style.color}30` }}>
                    {style.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {filteredLocked.length > 0 && (
        <div>
          <h3 className="text-sm font-bold font-['Space_Grotesk'] text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-widest">
            🔒 Locked — Keep Going!
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredLocked.map(badge => {
              const style = tierStyles[badge.tier];
              return (
                <div key={badge.id} className="bg-[#121826]/40 p-5 rounded-2xl border border-white/5 text-center flex flex-col items-center opacity-50">
                  <div className="text-4xl mb-3 grayscale">{badge.icon}</div>
                  <div className="font-bold text-gray-400 text-sm leading-tight">{badge.name}</div>
                  <div className="text-xs text-gray-600 mt-1.5 leading-relaxed">{badge.desc}</div>
                  <div className="mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 border border-white/10">
                    {style.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredEarned.length === 0 && filteredLocked.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-[#121826]/50 rounded-2xl border border-white/5">
          No badges in this category.
        </div>
      )}
    </div>
  );
}