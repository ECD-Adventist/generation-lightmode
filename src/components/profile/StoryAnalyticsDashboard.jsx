import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Eye, Heart, Flame, Sparkles, Trophy, ChevronDown, ChevronUp, Users } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

const REACTION_META = {
  like: { emoji: "❤️", label: "Likes" },
  fire: { emoji: "🔥", label: "Fire" },
  pray: { emoji: "🙏", label: "Pray" },
  sparkle: { emoji: "✨", label: "Sparkle" },
  heart_eyes: { emoji: "😍", label: "Love" },
  clap: { emoji: "👏", label: "Clap" },
};

export default function StoryAnalyticsDashboard({ profileEmail, allUsers = [] }) {
  const [expandedStory, setExpandedStory] = useState(null);

  const { data: stories = [] } = useQuery({
    queryKey: ["profileStories30d", profileEmail],
    queryFn: () => base44.entities.Story.filter({ user_email: profileEmail }, "-created_date", 100),
    enabled: !!profileEmail,
  });

  const { data: allReactions = [] } = useQuery({
    queryKey: ["profileStoryReactions", profileEmail],
    queryFn: async () => {
      const ids = stories.map(s => s.id);
      if (!ids.length) return [];
      const all = await Promise.all(ids.map(id => base44.entities.StoryReaction.filter({ story_id: id })));
      return all.flat();
    },
    enabled: stories.length > 0,
  });

  const { data: allViews = [] } = useQuery({
    queryKey: ["profileStoryViews", profileEmail],
    queryFn: async () => {
      const ids = stories.map(s => s.id);
      if (!ids.length) return [];
      const all = await Promise.all(ids.map(id => base44.entities.StoryView.filter({ story_id: id })));
      return all.flat();
    },
    enabled: stories.length > 0,
  });

  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentStories = useMemo(() =>
    stories.filter(s => {
      const d = new Date(s.created_date?.endsWith("Z") ? s.created_date : (s.created_date || "") + "Z");
      return isAfter(d, thirtyDaysAgo);
    }), [stories, thirtyDaysAgo]);

  // Aggregate
  const totalViews = useMemo(() => new Set(allViews.map(v => v.viewer_email)).size, [allViews]);
  const totalReactions = allReactions.length;

  const reactionsByType = useMemo(() => {
    const counts = {};
    allReactions.forEach(r => { counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allReactions]);

  // Best performing stories
  const storyPerformance = useMemo(() => {
    return recentStories.map(s => {
      const views = allViews.filter(v => v.story_id === s.id);
      const reactions = allReactions.filter(r => r.story_id === s.id);
      const uniqueViewers = new Set(views.map(v => v.viewer_email));
      return { ...s, viewCount: uniqueViewers.size, reactionCount: reactions.length, score: uniqueViewers.size + reactions.length * 2, viewers: [...uniqueViewers], reactions };
    }).sort((a, b) => b.score - a.score);
  }, [recentStories, allViews, allReactions]);

  const getUserInfo = (email) => allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0], email };

  if (recentStories.length === 0) {
    return (
      <div className="text-center py-16 rounded-[1.5rem]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
        <Eye className="w-10 h-10 mx-auto mb-3" style={{ color: "#8A97B5" }} />
        <p className="font-bold text-lg" style={{ color: "#0B1B3D" }}>No stories in the last 30 days</p>
        <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Post stories to see your engagement analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
          <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: "rgba(31,184,255,0.1)" }}>
            <Eye className="w-5 h-5" style={{ color: "#0B3FD9" }} />
          </div>
          <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: "#0B3FD9" }}>{totalViews}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold mt-0.5" style={{ color: "#6B7FA0" }}>Total Viewers</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
          <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: "rgba(255,208,0,0.1)" }}>
            <Heart className="w-5 h-5" style={{ color: "#CC7A00" }} />
          </div>
          <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: "#CC7A00" }}>{totalReactions}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold mt-0.5" style={{ color: "#6B7FA0" }}>Reactions</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
          <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: "rgba(138,92,255,0.1)" }}>
            <Sparkles className="w-5 h-5" style={{ color: "#8A5CFF" }} />
          </div>
          <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: "#8A5CFF" }}>{recentStories.length}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold mt-0.5" style={{ color: "#6B7FA0" }}>Stories (30d)</div>
        </div>
      </div>

      {/* Reaction Breakdown */}
      {reactionsByType.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
          <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#0B3FD9" }}>
            <Flame className="w-4 h-4" /> Reactions Breakdown
          </h3>
          <div className="flex flex-wrap gap-3">
            {reactionsByType.map(([type, count]) => {
              const meta = REACTION_META[type] || { emoji: "❓", label: type };
              const pct = totalReactions > 0 ? Math.round((count / totalReactions) * 100) : 0;
              return (
                <div key={type} className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                  <span className="text-xl">{meta.emoji}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#0B1B3D" }}>{count}</div>
                    <div className="text-[10px]" style={{ color: "#6B7FA0" }}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Best Performing Stories */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
        <div className="p-5 pb-3 border-b" style={{ borderColor: "#E6ECF5" }}>
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "#CC7A00" }}>
            <Trophy className="w-4 h-4" /> Top Stories (Last 30 Days)
          </h3>
        </div>
        <div className="divide-y" style={{ borderColor: "#F0F4FA" }}>
          {storyPerformance.slice(0, 10).map((s, idx) => {
            const isExpanded = expandedStory === s.id;
            const postedDate = s.created_date ? new Date(s.created_date.endsWith("Z") ? s.created_date : s.created_date + "Z") : null;
            return (
              <div key={s.id}>
                <button
                  onClick={() => setExpandedStory(isExpanded ? null : s.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition hover:bg-[#FAFBFE]"
                >
                  <div className="w-7 text-center shrink-0">
                    {idx < 3 ? (
                      <span className="text-lg">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                    ) : (
                      <span className="text-xs font-bold" style={{ color: "#8A97B5" }}>#{idx + 1}</span>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: s.media_url ? "#000" : "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
                    {s.media_url ? (
                      <img src={s.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold px-1 text-center leading-tight">
                        {(s.text_content || "").slice(0, 20)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "#0B1B3D" }}>
                      {s.text_content ? s.text_content.slice(0, 40) + (s.text_content.length > 40 ? "..." : "") : "Photo story"}
                    </div>
                    <div className="text-[11px]" style={{ color: "#8A97B5" }}>
                      {postedDate ? format(postedDate, "MMM d, yyyy") : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="flex items-center gap-1" style={{ color: "#0B3FD9" }}><Eye className="w-3.5 h-3.5" /> {s.viewCount}</span>
                    <span className="flex items-center gap-1" style={{ color: "#CC7A00" }}><Heart className="w-3.5 h-3.5" /> {s.reactionCount}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: "#8A97B5" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#8A97B5" }} />}
                  </div>
                </button>

                {/* Expanded viewer list */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1">
                    {s.viewers.length > 0 ? (
                      <div className="rounded-xl p-3" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "#6B7FA0" }}>
                          <Users className="w-3 h-3" /> {s.viewers.length} Viewer{s.viewers.length !== 1 ? "s" : ""}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.viewers.map(email => {
                            const vu = getUserInfo(email);
                            return (
                              <Link key={email} to={createPageUrl("Profile") + `?user=${encodeURIComponent(email)}`} className="flex items-center gap-1.5 px-2 py-1 rounded-full no-underline transition hover:bg-white" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #E6ECF5" }}>
                                <img src={vu.profile_picture_url || defaultAvatar} className="w-5 h-5 rounded-full object-cover" />
                                <span className="text-[11px] font-semibold truncate max-w-[80px]" style={{ color: "#0B1B3D" }}>{vu.full_name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-center py-3" style={{ color: "#8A97B5" }}>No viewers yet</p>
                    )}
                    {/* Reaction details */}
                    {s.reactions.length > 0 && (
                      <div className="mt-2 rounded-xl p-3" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#6B7FA0" }}>Reactions</div>
                        <div className="flex flex-wrap gap-2">
                          {s.reactions.map(r => {
                            const ru = getUserInfo(r.user_email);
                            const meta = REACTION_META[r.reaction_type] || { emoji: "❓" };
                            return (
                              <div key={r.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #E6ECF5" }}>
                                <span className="text-sm">{meta.emoji}</span>
                                <span className="text-[11px] font-semibold truncate max-w-[80px]" style={{ color: "#0B1B3D" }}>{ru.full_name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}