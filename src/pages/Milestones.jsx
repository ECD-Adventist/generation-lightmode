import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import MilestoneCard from "@/components/milestones/MilestoneCard";

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
    <div className="min-h-screen bg-[#0B0F1A] text-white px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
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
      </div>
    </div>
  );
}