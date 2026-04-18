import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Eye, Heart, Flame, Sparkles, Star, ThumbsUp, Users, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const REACTION_LABELS = {
  like: { emoji: "❤️", label: "Likes" },
  fire: { emoji: "🔥", label: "Fire" },
  pray: { emoji: "🙏", label: "Pray" },
  sparkle: { emoji: "✨", label: "Sparkle" },
  heart_eyes: { emoji: "😍", label: "Heart Eyes" },
  clap: { emoji: "👏", label: "Clap" },
};

export default function StoryAnalytics({ profileEmail, allUsers = [] }) {
  const [expandedStoryId, setExpandedStoryId] = useState(null);

  const { data: stories = [], isLoading: storiesLoading } = useQuery({
    queryKey: ["storyAnalyticsStories", profileEmail],
    queryFn: () => base44.entities.Story.filter({ user_email: profileEmail }, "-created_date", 100),
    enabled: !!profileEmail,
  });

  const { data: allReactions = [], isLoading: reactionsLoading } = useQuery({
    queryKey: ["storyAnalyticsReactions", profileEmail],
    queryFn: async () => {
      const storyIds = stories.map((s) => s.id);
      if (!storyIds.length) return [];
      const all = await Promise.all(storyIds.map((id) => base44.entities.StoryReaction.filter({ story_id: id })));
      return all.flat();
    },
    enabled: stories.length > 0,
  });

  const { data: allViews = [], isLoading: viewsLoading } = useQuery({
    queryKey: ["storyAnalyticsViews", profileEmail],
    queryFn: async () => {
      const storyIds = stories.map((s) => s.id);
      if (!storyIds.length) return [];
      const all = await Promise.all(storyIds.map((id) => base44.entities.StoryView.filter({ story_id: id })));
      return all.flat();
    },
    enabled: stories.length > 0,
  });

  const isLoading = storiesLoading || reactionsLoading || viewsLoading;

  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);

  const recentStories = useMemo(
    () => stories.filter((s) => s.created_date && isAfter(new Date(s.created_date.endsWith("Z") ? s.created_date : s.created_date + "Z"), thirtyDaysAgo)),
    [stories, thirtyDaysAgo]
  );

  // Reaction counts by type
  const reactionBreakdown = useMemo(() => {
    const counts = {};
    allReactions.forEach((r) => {
      counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type, count, ...(REACTION_LABELS[type] || { emoji: "❓", label: type }) }));
  }, [allReactions]);

  // Total unique viewers
  const totalUniqueViewers = useMemo(() => new Set(allViews.map((v) => v.viewer_email)).size, [allViews]);

  // Per-story stats
  const storyStats = useMemo(() => {
    return recentStories.map((s) => {
      const storyReactions = allReactions.filter((r) => r.story_id === s.id);
      const storyViews = allViews.filter((v) => v.story_id === s.id);
      const uniqueViewerEmails = [...new Set(storyViews.map((v) => v.viewer_email))];
      return {
        ...s,
        reactionCount: storyReactions.length,
        viewCount: uniqueViewerEmails.length,
        viewers: uniqueViewerEmails,
        reactions: storyReactions,
        engagement: storyReactions.length + uniqueViewerEmails.length,
      };
    }).sort((a, b) => b.engagement - a.engagement);
  }, [recentStories, allReactions, allViews]);

  const getUserInfo = (email) => allUsers.find((u) => u.email === email) || { full_name: email?.split("@")[0], email };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#E6ECF5] border-t-[#1FB8FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-16 rounded-[1.5rem]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
        <div className="text-4xl mb-3">📊</div>
        <p className="font-bold text-lg" style={{ color: "#0B1B3D" }}>No Stories Yet</p>
        <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Post stories to see your engagement analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Eye className="w-5 h-5" />, value: totalUniqueViewers, label: "Total Viewers", color: "#1FB8FF", bg: "rgba(31,184,255,0.08)" },
          { icon: <Heart className="w-5 h-5" />, value: allReactions.length, label: "Total Reactions", color: "#EF4444", bg: "rgba(239,68,68,0.08)" },
          { icon: <Sparkles className="w-5 h-5" />, value: recentStories.length, label: "Stories (30d)", color: "#8A5CFF", bg: "rgba(138,92,255,0.08)" },
          { icon: <TrendingUp className="w-5 h-5" />, value: recentStories.length > 0 ? Math.round((allReactions.length + totalUniqueViewers) / recentStories.length) : 0, label: "Avg Engagement", color: "#CC7A00", bg: "rgba(255,208,0,0.08)" },
        ].map((card, i) => (
          <div key={i} className="rounded-[1.25rem] p-4 text-center transition-all hover:-translate-y-0.5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11,63,217,0.04)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
            <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: card.color }}>{card.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "#6B7FA0" }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Reaction Breakdown */}
      {reactionBreakdown.length > 0 && (
        <div className="rounded-[1.5rem] p-5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11,63,217,0.04)" }}>
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#0B3FD9" }}>
            <Heart className="w-4 h-4" /> Reactions Breakdown
          </h3>
          <div className="flex flex-wrap gap-3">
            {reactionBreakdown.map((r) => (
              <div key={r.type} className="flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                <span className="text-xl">{r.emoji}</span>
                <span className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{r.count}</span>
                <span className="text-xs" style={{ color: "#6B7FA0" }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performing Stories */}
      <div className="rounded-[1.5rem] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11,63,217,0.04)" }}>
        <div className="p-5 pb-3 border-b" style={{ borderColor: "#E6ECF5" }}>
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "#CC7A00" }}>
            <TrendingUp className="w-4 h-4" /> Top Stories (Last 30 Days)
          </h3>
        </div>
        <div className="divide-y" style={{ borderColor: "#F0F4FA" }}>
          {storyStats.slice(0, 10).map((story, idx) => {
            const isExpanded = expandedStoryId === story.id;
            const postedDate = story.created_date ? new Date(story.created_date.endsWith("Z") ? story.created_date : story.created_date + "Z") : null;
            return (
              <div key={story.id}>
                <button
                  onClick={() => setExpandedStoryId(isExpanded ? null : story.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-[#FAFBFE] transition-colors"
                >
                  <div className="w-8 text-center shrink-0">
                    <span className="text-sm font-bold" style={{ color: idx < 3 ? "#CC7A00" : "#8A97B5" }}>#{idx + 1}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{
                    background: story.story_type === "image" && story.media_url ? "transparent" : `linear-gradient(135deg, ${story.background_theme === "violet" ? "#8A5CFF, #3B1E70" : story.background_theme === "sunrise" ? "#FFD000, #F97316" : story.background_theme === "midnight" ? "#121826, #0B0F1A" : "#00CFFF, #1DA1FF"})`
                  }}>
                    {story.story_type === "image" && story.media_url ? (
                      <img src={story.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-[10px] font-bold text-center px-1 line-clamp-2">{story.text_content?.slice(0, 30)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#0B1B3D" }}>
                      {story.story_type === "image" ? "Photo Story" : (story.text_content?.slice(0, 50) || "Status")}
                    </p>
                    <p className="text-[11px]" style={{ color: "#8A97B5" }}>
                      {postedDate ? format(postedDate, "MMM d, yyyy 'at' h:mm a") : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <div className="font-bold text-sm" style={{ color: "#1FB8FF" }}>{story.viewCount}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color: "#8A97B5" }}>Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm" style={{ color: "#EF4444" }}>{story.reactionCount}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ color: "#8A97B5" }}>Reacts</div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: "#8A97B5" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#8A97B5" }} />}
                  </div>
                </button>

                {/* Expanded — Viewer list */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="rounded-xl p-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "#0B3FD9" }}>
                        <Users className="w-3.5 h-3.5" /> {story.viewers.length} Viewer{story.viewers.length !== 1 ? "s" : ""}
                      </h4>
                      {story.viewers.length === 0 ? (
                        <p className="text-xs italic" style={{ color: "#8A97B5" }}>No viewers recorded yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                          {story.viewers.map((email) => {
                            const u = getUserInfo(email);
                            return (
                              <Link
                                key={email}
                                to={createPageUrl("Profile") + `?user=${encodeURIComponent(email)}`}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full no-underline transition hover:bg-white"
                                style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}
                              >
                                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                                  <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs font-semibold truncate max-w-[100px]" style={{ color: "#0B1B3D" }}>{u.full_name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Reaction details */}
                      {story.reactions.length > 0 && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: "#E6ECF5" }}>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#CC7A00" }}>Reactions</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {story.reactions.map((r) => {
                              const u = getUserInfo(r.user_email);
                              const rl = REACTION_LABELS[r.reaction_type] || { emoji: "❓" };
                              return (
                                <div key={r.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                                  <span>{rl.emoji}</span>
                                  <span className="font-medium truncate max-w-[80px]" style={{ color: "#0B1B3D" }}>{u.full_name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {storyStats.length === 0 && (
            <div className="p-8 text-center" style={{ color: "#8A97B5" }}>
              <p>No stories in the last 30 days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}