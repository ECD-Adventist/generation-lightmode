import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import MilestoneCard from "@/components/milestones/MilestoneCard";
import { Link } from "react-router-dom";
import { Home, Zap, Globe, Bell, User } from "lucide-react";
import LifetimeAchievementBoard from "@/components/milestones/LifetimeAchievementBoard";

export default function Milestones() {
  const [user, setUser] = useState(null);
  const [isAwarding, setIsAwarding] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: prayerSupports = [] } = useQuery({
    queryKey: ["milestonePrayerSupports", user?.email],
    queryFn: () => base44.entities.PrayerSupport.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const { data: glowDrops = [] } = useQuery({
    queryKey: ["milestoneDrops", user?.email],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: user?.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["milestoneFollowing", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user,
  });

  const { data: earnedMilestones = [] } = useQuery({
    queryKey: ["userMilestones", user?.email],
    queryFn: () => base44.entities.UserMilestone.filter({ user_email: user?.email }, "-created_date"),
    enabled: !!user,
  });

  const uniquePostingDays = useMemo(() => new Set(glowDrops.map((drop) => drop.created_date?.split("T")[0]).filter(Boolean)).size, [glowDrops]);

  const milestones = useMemo(() => [
    {
      key: "100_prayers_prayed",
      title: "100 Prayers Prayed",
      description: "Pray for 100 requests on the Prayer Wall.",
      value: prayerSupports.length,
      target: 100,
      rewardXp: 120,
    },
    {
      key: "10_days_consistent_posting",
      title: "10 Days of Consistent Posting",
      description: "Share Glow Drops on 10 different days.",
      value: uniquePostingDays,
      target: 10,
      rewardXp: 100,
    },
    {
      key: "10_drops_shared",
      title: "10 Public Drops Shared",
      description: "Post 10 Glow Drops to inspire others.",
      value: glowDrops.length,
      target: 10,
      rewardXp: 80,
    },
    {
      key: "25_people_followed",
      title: "25 People Followed",
      description: "Follow 25 believers and build your faith network.",
      value: following.length,
      target: 25,
      rewardXp: 60,
    },
  ], [prayerSupports.length, uniquePostingDays, glowDrops.length, following.length]);

  const lifetimeAchievements = useMemo(() => [
    {
      key: "prayer_warrior",
      title: "Prayer Warrior",
      description: "Support 250 prayer requests over your lifetime.",
      value: prayerSupports.length,
      target: 250,
      icon: "🙏",
    },
    {
      key: "consistent_light",
      title: "Consistent Light",
      description: "Post on 30 different days.",
      value: uniquePostingDays,
      target: 30,
      icon: "💡",
    },
    {
      key: "social_builder",
      title: "Social Builder",
      description: "Follow 50 believers.",
      value: following.length,
      target: 50,
      icon: "🤝",
    },
    {
      key: "master_publisher",
      title: "Master Publisher",
      description: "Share 100 Glow Drops.",
      value: glowDrops.length,
      target: 100,
      icon: "✨",
    },
    {
      key: "checkin_flame",
      title: "Check-in Flame",
      description: "Reach a 30 day daily check-in streak.",
      value: user?.daily_checkin_streak || 0,
      target: 30,
      icon: "🔥",
    },
    {
      key: "posting_streak",
      title: "Posting Streak Legend",
      description: "Keep a 14 day posting streak alive.",
      value: user?.posting_streak_count || 0,
      target: 14,
      icon: "🚀",
    },
  ], [prayerSupports.length, uniquePostingDays, following.length, glowDrops.length, user?.daily_checkin_streak, user?.posting_streak_count]);

  useEffect(() => {
    if (!user || isAwarding) return;
    const earnedKeys = new Set(earnedMilestones.map((milestone) => milestone.milestone_key));
    const newlyCompleted = milestones.filter((milestone) => milestone.value >= milestone.target && !earnedKeys.has(milestone.key));
    if (newlyCompleted.length === 0) return;

    setIsAwarding(true);
    const totalXp = newlyCompleted.reduce((sum, milestone) => sum + milestone.rewardXp, 0);

    Promise.all([
      base44.entities.UserMilestone.bulkCreate(newlyCompleted.map((milestone) => ({
        user_email: user.email,
        milestone_key: milestone.key,
        title: milestone.title,
        reward_xp: milestone.rewardXp,
      }))),
      ...newlyCompleted.map((milestone) => base44.entities.Notification.create({
        user_email: user.email,
        type: "milestone",
        message: `Milestone unlocked: ${milestone.title} (+${milestone.rewardXp} XP)`,
        link: createPageUrl("Milestones"),
      })),
      base44.auth.updateMe({ glow_score: (user.glow_score || 0) + totalXp }),
    ]).then(async () => {
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["userMilestones", user.email] });
    }).finally(() => setIsAwarding(false));
  }, [user, milestones, earnedMilestones, isAwarding, queryClient]);

  if (!user) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">Loading milestones...</div>;

  const earnedKeys = new Set(earnedMilestones.map((milestone) => milestone.milestone_key));
  const currentLevelProgress = (((user.glow_score || 0) % 50) / 50) * 100;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
              alt="LightMode"
              style={{ height: 96, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Globe className="w-4 h-4" /><span className="hidden sm:inline">Reach</span>
            </Link>
            <Link to={createPageUrl("Notifications")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Bell className="w-4 h-4" /><span className="hidden sm:inline">Alerts</span>
            </Link>
            <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
            </Link>
            <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-sm font-medium border border-white/5">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-[#121826] border border-white/10 rounded-3xl p-6">
          <h1 className="text-3xl font-bold">Milestones</h1>
          <p className="text-gray-400 mt-2">Track your faith journey, unlock rewards, and grow your Glow XP.</p>
          <div className="mt-6 flex flex-wrap items-end gap-8">
            <div>
              <div className="text-4xl font-black text-[#FFD000]">{user.glow_score || 0}</div>
              <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">Total XP</div>
            </div>
            <div className="flex-1 min-w-[240px]">
              <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]" style={{ width: `${currentLevelProgress}%` }} />
              </div>
              <div className="text-sm text-gray-400">{50 - ((user.glow_score || 0) % 50)} XP to next level</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {milestones.map((milestone) => (
            <MilestoneCard key={milestone.key} milestone={milestone} earned={earnedKeys.has(milestone.key)} />
          ))}
        </div>

        <LifetimeAchievementBoard achievements={lifetimeAchievements} />
      </div>
    </div>
  );
}