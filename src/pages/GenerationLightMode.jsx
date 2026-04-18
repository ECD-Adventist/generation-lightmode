import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Globe, Heart, Sparkles, Bell, Users } from "lucide-react";

const ACCOUNT_EMAIL = "system@lightmode.com";
const ACCOUNT_NAME = "Generation LightMode";
const ACCOUNT_IMAGE = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg";

export default function GenerationLightMode() {
  const queryClient = useQueryClient();

  const { data: me } = useQuery({ queryKey: ["glmMe"], queryFn: () => base44.auth.me() });
  const { data: follows = [] } = useQuery({
    queryKey: ["glmFollowers"],
    queryFn: () => base44.entities.Follow.filter({ following_email: ACCOUNT_EMAIL })
  });
  const { data: myFollowing = [] } = useQuery({
    queryKey: ["glmMyFollowing", me?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: me?.email }),
    enabled: !!me?.email
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["glmPosts"],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: ACCOUNT_EMAIL }, "-created_date")
  });

  const isFollowing = myFollowing.some((f) => f.following_email === ACCOUNT_EMAIL);

  const followMutation = useMutation({
    mutationFn: async () => {
      const existing = myFollowing.find((f) => f.following_email === ACCOUNT_EMAIL);
      if (existing) return base44.entities.Follow.delete(existing.id);
      return base44.entities.Follow.create({ follower_email: me.email, following_email: ACCOUNT_EMAIL });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glmFollowers"] });
      queryClient.invalidateQueries({ queryKey: ["glmMyFollowing", me?.email] });
    }
  });

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#0B1B3D] font-['Inter']">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-[2rem] overflow-hidden border border-[#E6ECF5] bg-white shadow-[0_10px_40px_rgba(11,63,217,0.08)] mb-8">
          <div className="h-56 bg-[linear-gradient(135deg,#0B3FD9_0%,#1FB8FF_45%,#FFD000_100%)] relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%)]" />
          </div>
          <div className="px-6 pb-6 -mt-16 relative">
            <div className="w-32 h-32 rounded-full p-1 bg-white shadow-lg">
              <img src={ACCOUNT_IMAGE} alt={ACCOUNT_NAME} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl font-black font-['Space_Grotesk']">{ACCOUNT_NAME}</h1>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EEF3FF] text-[#0B3FD9] border border-[#D6E4FF]">Official Account</span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A5878]">The official Generation LightMode profile for daily drops, movement announcements, campaign highlights, and platform updates.</p>
                <div className="flex items-center gap-5 mt-4 text-sm text-[#6B7FA0] flex-wrap">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {follows.length} followers</span>
                  <span className="flex items-center gap-1"><Sparkles className="w-4 h-4" /> {posts.length} posts</span>
                  <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> Global movement</span>
                </div>
              </div>
              {me?.email && me.email !== ACCOUNT_EMAIL && (
                <button onClick={() => followMutation.mutate()} className="px-6 py-3 rounded-full font-bold" style={isFollowing ? { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" } : { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF" }}>
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-[#E6ECF5] bg-white p-5"><Bell className="w-5 h-5 text-[#0B3FD9] mb-3" /><h3 className="font-bold mb-1">Official Updates</h3><p className="text-sm text-[#6B7FA0]">Platform notices and movement-wide messages.</p></div>
          <div className="rounded-2xl border border-[#E6ECF5] bg-white p-5"><Sparkles className="w-5 h-5 text-[#CC7A00] mb-3" /><h3 className="font-bold mb-1">Daily Drops</h3><p className="text-sm text-[#6B7FA0]">Daily Codes of Truth and Keep It 100 posts.</p></div>
          <div className="rounded-2xl border border-[#E6ECF5] bg-white p-5"><Heart className="w-5 h-5 text-[#1FB8FF] mb-3" /><h3 className="font-bold mb-1">Movement Highlights</h3><p className="text-sm text-[#6B7FA0]">Stories worth sharing across the community.</p></div>
        </div>

        <div className="rounded-[2rem] border border-[#E6ECF5] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-['Space_Grotesk']">Latest Posts</h2>
            <Link to={createPageUrl("DailyTruthFeed")} className="text-sm font-bold text-[#0B3FD9] hover:underline">Open Daily Drops</Link>
          </div>
          <div className="space-y-4">
            {posts.slice(0, 8).map((post) => (
              <div key={post.id} className="rounded-2xl border border-[#E6ECF5] bg-[#F8FAFF] p-4">
                <p className="text-sm font-bold text-[#0B3FD9] mb-1">{post.verse}</p>
                <p className="text-sm text-[#4A5878] whitespace-pre-line">{post.reflection}</p>
              </div>
            ))}
            {posts.length === 0 && <p className="text-sm text-[#6B7FA0]">No posts yet.</p>}
          </div>
        </div>
      </div>
      </div>
      </div>
      );
      }