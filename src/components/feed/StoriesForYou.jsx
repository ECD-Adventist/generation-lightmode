import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

const ITEMS_PER_PAGE = 8;

export default function StoriesForYou({ stories, currentUser, following, allUsers, onSelectStory }) {
  const [page, setPage] = useState(0);

  const suggestedStories = useMemo(() => {
    if (!currentUser || !stories.length) return [];
    const now = Date.now();
    const followingEmails = new Set((following || []).map(f => f.following_email));

    const active = stories.filter(s =>
      s.expires_at &&
      new Date(s.expires_at).getTime() > now &&
      s.user_email !== currentUser.email
    );

    // Score stories for relevance
    const scored = active.map(s => {
      let score = 0;
      // Following bonus
      if (followingEmails.has(s.user_email)) score += 10;
      // Same country bonus
      const storyUser = allUsers.find(u => u.email === s.user_email);
      if (storyUser?.country && storyUser.country === currentUser.country) score += 5;
      // Recency bonus (newer = higher)
      const ageHours = (now - new Date(s.created_date || 0).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 24 - ageHours);
      // Engagement bonus
      score += (s.likes_count || 0) * 2;
      score += (s.view_count || 0) * 0.5;
      return { ...s, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Deduplicate by user (show one story per user)
    const seen = new Set();
    return scored.filter(s => {
      if (seen.has(s.user_email)) return false;
      seen.add(s.user_email);
      return true;
    });
  }, [stories, currentUser, following, allUsers]);

  if (suggestedStories.length === 0) return null;

  const totalPages = Math.ceil(suggestedStories.length / ITEMS_PER_PAGE);
  const currentPageStories = suggestedStories.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const getUserInfo = (email) => allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0], email };

  return (
    <div className="mb-6 px-4 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#FFD60A" }} />
          <h3 className="text-sm font-bold" style={{ color: "#0B1B3D" }}>Stories For You</h3>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-6 h-6 rounded-full flex items-center justify-center disabled:opacity-30 transition"
              style={{ background: "#F0F4FA", color: "#4A5878" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold px-1" style={{ color: "#8A97B5" }}>
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-6 h-6 rounded-full flex items-center justify-center disabled:opacity-30 transition"
              style={{ background: "#F0F4FA", color: "#4A5878" }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        {currentPageStories.map((story) => {
          const storyUser = getUserInfo(story.user_email);
          const themeClass = story.background_theme === "violet"
            ? "from-[#8A5CFF] to-[#3B1E70]"
            : story.background_theme === "sunrise"
            ? "from-[#FFD000] to-[#F97316]"
            : story.background_theme === "midnight"
            ? "from-[#121826] to-[#0B0F1A]"
            : "from-[#00CFFF] to-[#1DA1FF]";

          return (
            <button
              key={story.id}
              onClick={() => onSelectStory(story)}
              className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
            >
              <div className="w-16 h-16 rounded-full p-[2px]" style={{ background: "linear-gradient(135deg, #FFD60A 0%, #1FB8FF 100%)" }}>
                <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF" }}>
                  {story.story_type === "image" && story.media_url ? (
                    <img src={story.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full rounded-full bg-gradient-to-br ${themeClass} flex items-center justify-center text-white font-black text-lg`}>
                      Aa
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-medium truncate w-16 text-center group-hover:text-[#0B3FD9] transition" style={{ color: "#4A5878" }}>
                {storyUser?.full_name?.split(" ")[0] || "User"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}