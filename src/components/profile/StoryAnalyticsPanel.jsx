import React, { useMemo } from "react";
import { Eye, Heart, Flame, Sparkles, Hand, TrendingUp } from "lucide-react";

const reactionMeta = {
  like: { label: "Likes", icon: Heart, color: "#EF4444" },
  fire: { label: "Fire", icon: Flame, color: "#FF8A00" },
  pray: { label: "Prayer", icon: Hand, color: "#0B3FD9" },
  sparkle: { label: "Sparkle", icon: Sparkles, color: "#8A5CFF" },
  heart_eyes: { label: "Love", icon: Heart, color: "#EC4899" },
  clap: { label: "Claps", icon: Hand, color: "#14B8A6" },
};

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-[1.25rem] p-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: "#6B7FA0" }}>{label}</div>
          <div className="text-2xl font-black mt-1" style={{ color: "#0B1B3D" }}>{value}</div>
        </div>
        <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF", border: "1px solid #D6E4FF" }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

function StoryRow({ story, viewers, reactionCount, topReaction }) {
  return (
    <div className="rounded-[1rem] p-4 flex items-center gap-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0" style={{ background: story.story_type === "image" && story.media_url ? "#EEF3FF" : "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)" }}>
        {story.story_type === "image" && story.media_url ? (
          <img src={story.media_url} alt="Story" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">Aa</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm line-clamp-2" style={{ color: "#0B1B3D" }}>
          {story.story_type === "image" ? (story.text_content || "Image story") : (story.text_content || "Status story")}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs mt-2" style={{ color: "#6B7FA0" }}>
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {viewers}</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {reactionCount}</span>
          {topReaction && <span>Top reaction: {topReaction}</span>}
        </div>
      </div>
    </div>
  );
}

export default function StoryAnalyticsPanel({ stories = [], storyViews = [], storyReactions = [], allUsers = [] }) {
  const last30Days = useMemo(() => {
    const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return stories.filter((story) => new Date(story.created_date || 0).getTime() >= threshold);
  }, [stories]);

  const storyIds = new Set(last30Days.map((story) => story.id));
  const relevantViews = storyViews.filter((view) => storyIds.has(view.story_id));
  const relevantReactions = storyReactions.filter((reaction) => storyIds.has(reaction.story_id));

  const uniqueViewerEmails = Array.from(new Set(relevantViews.map((view) => view.viewer_email).filter(Boolean)));
  const viewerList = uniqueViewerEmails.map((email) => {
    const user = allUsers.find((item) => item.email === email);
    return user || { email, full_name: email.split("@")[0] };
  });

  const reactionCounts = relevantReactions.reduce((acc, reaction) => {
    acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
    return acc;
  }, {});

  const bestStories = last30Days
    .map((story) => {
      const storyViewCount = new Set(relevantViews.filter((view) => view.story_id === story.id).map((view) => view.viewer_email)).size;
      const storyReactionRecords = relevantReactions.filter((reaction) => reaction.story_id === story.id);
      const storyReactionCount = storyReactionRecords.length;
      const topReactionEntry = Object.entries(
        storyReactionRecords.reduce((acc, reaction) => {
          acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0];

      return {
        story,
        score: storyViewCount + storyReactionCount,
        viewers: storyViewCount,
        reactionCount: storyReactionCount,
        topReaction: topReactionEntry ? (reactionMeta[topReactionEntry[0]]?.label || topReactionEntry[0]) : null,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Stories (30d)" value={last30Days.length} icon={TrendingUp} accent="#0B3FD9" />
        <StatCard label="Unique Viewers" value={viewerList.length} icon={Eye} accent="#1FB8FF" />
        <StatCard label="Total Reactions" value={relevantReactions.length} icon={Heart} accent="#FF8A00" />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-[1.5rem] p-5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
          <div className="text-[11px] uppercase tracking-[0.25em] font-bold mb-4" style={{ color: "#6B7FA0" }}>Best Performing Stories</div>
          <div className="space-y-3">
            {bestStories.length === 0 ? (
              <div className="text-sm" style={{ color: "#8A97B5" }}>No story activity in the last 30 days yet.</div>
            ) : (
              bestStories.map((item) => (
                <StoryRow key={item.story.id} {...item} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] p-5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
            <div className="text-[11px] uppercase tracking-[0.25em] font-bold mb-4" style={{ color: "#6B7FA0" }}>Reaction Breakdown</div>
            <div className="space-y-3">
              {Object.keys(reactionCounts).length === 0 ? (
                <div className="text-sm" style={{ color: "#8A97B5" }}>No reactions yet.</div>
              ) : (
                Object.entries(reactionCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                  const meta = reactionMeta[type] || { label: type, icon: Heart, color: "#0B3FD9" };
                  const Icon = meta.icon;
                  return (
                    <div key={type} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" style={{ color: meta.color }} />
                        <span className="text-sm font-semibold" style={{ color: "#0B1B3D" }}>{meta.label}</span>
                      </div>
                      <span className="text-sm font-black" style={{ color: meta.color }}>{count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] p-5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
            <div className="text-[11px] uppercase tracking-[0.25em] font-bold mb-4" style={{ color: "#6B7FA0" }}>Recent Viewers</div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {viewerList.length === 0 ? (
                <div className="text-sm" style={{ color: "#8A97B5" }}>No viewers yet.</div>
              ) : (
                viewerList.map((viewer) => (
                  <div key={viewer.email} className="flex items-center gap-3">
                    <img src={viewer.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt={viewer.full_name} className="w-10 h-10 rounded-full object-cover border border-[#E6ECF5]" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "#0B1B3D" }}>{viewer.full_name}</div>
                      <div className="text-xs truncate" style={{ color: "#6B7FA0" }}>{viewer.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}