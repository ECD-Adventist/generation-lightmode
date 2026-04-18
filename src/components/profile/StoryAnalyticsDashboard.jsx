import React, { useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart3, Heart, Eye, TrendingUp, Clock, Target } from "lucide-react";
import { formatDistanceToNow, subDays } from "date-fns";

export default function StoryAnalyticsDashboard({ isOpen, onClose, user }) {
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
  
  const { data: stories = [], isLoading: loadingStories } = useQuery({
    queryKey: ["myStoriesAnalytics", user?.email],
    queryFn: () => base44.entities.Story.filter({ user_email: user?.email }, "-created_date", 100),
    enabled: !!user?.email && isOpen
  });

  const recentStories = stories.filter(s => s.created_date >= thirtyDaysAgo);

  const { data: allViews = [] } = useQuery({
    queryKey: ["myStoriesViews", user?.email],
    queryFn: async () => {
      if(recentStories.length === 0) return [];
      // Fetch all views for the user's stories efficiently
      // In a real app we'd fetch them in a single query if supported, but here we do parallel requests for recent stories
      const viewPromises = recentStories.map(s => base44.entities.StoryView.filter({ story_id: s.id }));
      const results = await Promise.all(viewPromises);
      return results.flat();
    },
    enabled: recentStories.length > 0 && isOpen
  });

  const { data: allReactions = [] } = useQuery({
    queryKey: ["myStoriesReactions", user?.email],
    queryFn: async () => {
      if(recentStories.length === 0) return [];
      const reactionPromises = recentStories.map(s => base44.entities.StoryReaction.filter({ story_id: s.id }));
      const results = await Promise.all(reactionPromises);
      return results.flat();
    },
    enabled: recentStories.length > 0 && isOpen
  });

  const totalViews = allViews.length;
  const uniqueViewers = new Set(allViews.map(v => v.viewer_email)).size;
  const totalReactions = allReactions.length;

  const reactionsByType = allReactions.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {});

  const storyPerformance = recentStories.map(story => {
    const views = allViews.filter(v => v.story_id === story.id).length;
    const reactions = allReactions.filter(r => r.story_id === story.id).length;
    return { ...story, views, reactions, engagement: views > 0 ? (reactions / views * 100).toFixed(1) : 0 };
  }).sort((a, b) => b.views - a.views);

  const topStory = storyPerformance[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white border-0 rounded-3xl" style={{ boxShadow: "0 24px 60px rgba(11, 63, 217, 0.15)" }}>
        <div className="p-6 sm:p-8 text-white" style={{ background: "linear-gradient(135deg, #0B1B3D 0%, #0B3FD9 100%)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#1FB8FF]" /> Story Analytics
            </h2>
          </div>
          <p className="text-sm sm:text-base text-white/80">Your engagement metrics for the last 30 days.</p>
        </div>

        <div className="p-6 sm:p-8 bg-[#F6F8FC] max-h-[70vh] overflow-y-auto">
          {loadingStories ? (
             <div className="py-12 text-center text-[#6B7FA0] font-medium">Loading analytics...</div>
          ) : recentStories.length === 0 ? (
             <div className="py-12 text-center text-[#6B7FA0] font-medium flex flex-col items-center">
                <Target className="w-12 h-12 mb-4 text-[#8A97B5] opacity-50" />
                No stories posted in the last 30 days.
             </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E6ECF5] transition hover:-translate-y-1">
                  <div className="text-[#6B7FA0] text-[10px] font-bold uppercase tracking-wider mb-1">Total Views</div>
                  <div className="text-3xl font-black text-[#0B1B3D]">{totalViews}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E6ECF5] transition hover:-translate-y-1">
                  <div className="text-[#6B7FA0] text-[10px] font-bold uppercase tracking-wider mb-1">Unique Viewers</div>
                  <div className="text-3xl font-black text-[#0B1B3D]">{uniqueViewers}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E6ECF5] transition hover:-translate-y-1">
                  <div className="text-[#6B7FA0] text-[10px] font-bold uppercase tracking-wider mb-1">Reactions</div>
                  <div className="text-3xl font-black text-[#0B3FD9]">{totalReactions}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E6ECF5] transition hover:-translate-y-1">
                  <div className="text-[#6B7FA0] text-[10px] font-bold uppercase tracking-wider mb-1">Stories</div>
                  <div className="text-3xl font-black text-[#0B1B3D]">{recentStories.length}</div>
                </div>
              </div>

              {/* Reaction Breakdown */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E6ECF5]">
                <h3 className="font-bold text-[#0B1B3D] mb-5 flex items-center gap-2 text-lg"><Heart className="w-5 h-5 text-red-500" /> Reaction Breakdown</h3>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(reactionsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3 bg-[#F6F8FC] px-4 py-2 rounded-xl border border-[#E0EAF5]">
                      <span className="text-2xl">{type === 'like' ? '❤️' : type === 'fire' ? '🔥' : type === 'pray' ? '🙏' : type === 'sparkle' ? '✨' : type === 'heart_eyes' ? '😍' : '👏'}</span>
                      <span className="font-bold text-lg text-[#0B1B3D]">{count}</span>
                    </div>
                  ))}
                  {Object.keys(reactionsByType).length === 0 && <span className="text-sm text-[#8A97B5] py-2">No reactions yet. Keep sharing!</span>}
                </div>
              </div>

              {/* Top Story */}
              {topStory && topStory.views > 0 && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E6ECF5]">
                  <h3 className="font-bold text-[#0B1B3D] mb-5 flex items-center gap-2 text-lg"><TrendingUp className="w-5 h-5 text-[#1FB8FF]" /> Top Performing Story</h3>
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="w-24 h-36 sm:w-32 sm:h-48 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-[#E6ECF5] shadow-inner">
                      {topStory.media_url ? (
                        <img src={topStory.media_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-3 text-center" style={{ background: `var(--${topStory.background_theme})`, backgroundColor: "#0B3FD9" }}>
                          <span className="text-[10px] text-white font-bold line-clamp-6 leading-tight">{topStory.text_content}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-[#F6F8FC] p-3 rounded-xl border border-[#E0EAF5]">
                          <div className="text-[10px] font-bold text-[#6B7FA0] uppercase tracking-wider mb-1">Views</div>
                          <div className="font-black text-xl text-[#0B1B3D] flex items-center gap-2"><Eye className="w-4 h-4 text-[#1FB8FF]" /> {topStory.views}</div>
                        </div>
                        <div className="bg-[#F6F8FC] p-3 rounded-xl border border-[#E0EAF5]">
                          <div className="text-[10px] font-bold text-[#6B7FA0] uppercase tracking-wider mb-1">Reactions</div>
                          <div className="font-black text-xl text-[#0B1B3D] flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> {topStory.reactions}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#0B3FD9] bg-[#EEF3FF] border border-[#D6E4FF] px-3 py-1.5 rounded-full inline-block">
                          Engagement Rate: {topStory.engagement}%
                        </div>
                        <div className="text-xs font-medium text-[#8A97B5] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(topStory.created_date.endsWith('Z') ? topStory.created_date : topStory.created_date + 'Z'))} ago
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}