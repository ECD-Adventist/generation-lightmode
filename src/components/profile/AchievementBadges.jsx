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
  bronze: { bg: "linear-gradient(135deg, #FDF4E8 0%, #F7E6CF 100%)", border: "#E8C896", glow: "0 4px 16px rgba(205,127,50,0.12)", label: "Bronze", color: "#A16207" },
  silver: { bg: "linear-gradient(135deg, #F7F9FC 0%, #E8EEF5 100%)", border: "#CBD5E1", glow: "0 4px 16px rgba(148,163,184,0.15)", label: "Silver", color: "#64748B" },
  gold: { bg: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "#FFE4A0", glow: "0 4px 20px rgba(255,208,0,0.2)", label: "Gold", color: "#CC7A00" },
  platinum: { bg: "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)", border: "#C6D5FF", glow: "0 4px 20px rgba(11,63,217,0.15)", label: "Platinum", color: "#0B3FD9" },
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
          <h3 className="text-lg font-bold font-['Space_Grotesk'] mb-4 flex items-center gap-2" style={{ color: "#CC7A00" }}>
            <Award className="w-5 h-5" /> Glow Certificates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certificates.map(cert => (
              <div key={cert.id} className="p-5 rounded-[1.5rem] flex items-center gap-5" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0", boxShadow: "0 4px 20px rgba(255,208,0,0.15)" }}>
                <div className="text-4xl w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FFFFFF", border: "2px solid #FFD000", boxShadow: "0 2px 8px rgba(255,208,0,0.25)" }}>{cert.icon}</div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#CC7A00" }}>Official Milestone</div>
                  <h4 className="text-base font-bold font-['Space_Grotesk'] truncate" style={{ color: "#0B1B3D" }}>{cert.title}</h4>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#6B7FA0" }}>{cert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Bar */}
      <div className="flex items-center gap-6 rounded-[1.5rem] p-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
        <div className="text-center">
          <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: "#0B3FD9" }}>{earned.length}</div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "#6B7FA0" }}>Earned</div>
        </div>
        <div className="w-px h-10" style={{ background: "#E6ECF5" }} />
        <div className="text-center">
          <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: "#8A97B5" }}>{locked.length}</div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "#6B7FA0" }}>Locked</div>
        </div>
        <div className="w-px h-10" style={{ background: "#E6ECF5" }} />
        <div className="text-center">
          <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: "#CC7A00" }}>{BADGE_DEFINITIONS.length}</div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "#6B7FA0" }}>Total</div>
        </div>
        <div className="flex-1" />
        <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "#EEF3FF" }}>
          <div className="h-full rounded-full" style={{ width: `${(earned.length / BADGE_DEFINITIONS.length) * 100}%`, background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)" }} />
        </div>
        <span className="text-xs font-bold" style={{ color: "#4A5878" }}>{Math.round((earned.length / BADGE_DEFINITIONS.length) * 100)}%</span>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
            style={activeCategory === cat.key
              ? { background: "#0B3FD9", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.3)" }
              : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Earned Badges */}
      {filteredEarned.length > 0 && (
        <div>
          <h3 className="text-sm font-bold font-['Space_Grotesk'] mb-3 flex items-center gap-2 uppercase tracking-widest" style={{ color: "#0B3FD9" }}>
            <Sparkles className="w-4 h-4" /> Earned Badges
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredEarned.map(badge => {
              const style = tierStyles[badge.tier];
              return (
                <div key={badge.id} className="p-5 rounded-[1.25rem] text-center flex flex-col items-center transition-all hover:-translate-y-0.5" style={{ background: style.bg, border: `1px solid ${style.border}`, boxShadow: style.glow }}>
                  <div className="text-4xl mb-3">{badge.icon}</div>
                  <div className="font-bold text-sm leading-tight" style={{ color: "#0B1B3D" }}>{badge.name}</div>
                  <div className="text-xs mt-1.5 leading-relaxed" style={{ color: "#4A5878" }}>{badge.desc}</div>
                  <div className="mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ color: style.color, background: "#FFFFFF", border: `1px solid ${style.border}` }}>
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
          <h3 className="text-sm font-bold font-['Space_Grotesk'] mb-3 flex items-center gap-2 uppercase tracking-widest" style={{ color: "#8A97B5" }}>
            🔒 Locked — Keep Going!
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredLocked.map(badge => {
              const style = tierStyles[badge.tier];
              return (
                <div key={badge.id} className="p-5 rounded-[1.25rem] text-center flex flex-col items-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", opacity: 0.65 }}>
                  <div className="text-4xl mb-3 grayscale">{badge.icon}</div>
                  <div className="font-bold text-sm leading-tight" style={{ color: "#6B7FA0" }}>{badge.name}</div>
                  <div className="text-xs mt-1.5 leading-relaxed" style={{ color: "#8A97B5" }}>{badge.desc}</div>
                  <div className="mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ color: "#8A97B5", background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                    {style.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredEarned.length === 0 && filteredLocked.length === 0 && (
        <div className="text-center py-10 rounded-[1.25rem]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#8A97B5" }}>
          No badges in this category.
        </div>
      )}
    </div>
  );
}