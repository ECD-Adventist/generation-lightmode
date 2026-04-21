import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, RefreshCw, ChevronRight } from "lucide-react";

export default function AIContentSuggestions({ user, drops, following, onSearchTag, userLikes = [], savedDropRecords = [] }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    setHasRequested(true);

    // Gather engagement data
    const likedDropIds = new Set(userLikes.map(l => l.drop_id));
    const savedDropIds = new Set(savedDropRecords.map(s => s.drop_id));
    const likedDrops = drops.filter(d => likedDropIds.has(d.id)).slice(0, 10);
    const savedDrops = drops.filter(d => savedDropIds.has(d.id)).slice(0, 5);
    const userDrops = drops.filter(d => d.user_email === user?.email).slice(0, 5);

    const likedCategories = likedDrops.map(d => d.category).filter(Boolean);
    const likedHashtags = likedDrops.flatMap(d => (d.hashtags || "").split(/[\s,]+/).filter(t => t.startsWith("#")));
    const savedCategories = savedDrops.map(d => d.category).filter(Boolean);
    const likedVerses = likedDrops.map(d => d.verse).filter(Boolean).slice(0, 5);

    const followingEmails = new Set(following.map(f => f.following_email));
    const followedCreators = drops
      .filter(d => followingEmails.has(d.user_email))
      .slice(0, 5)
      .map(d => ({ verse: d.verse, category: d.category, hashtags: d.hashtags }));

    // Find most engaging content (high likes)
    const trendingNow = [...drops].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 5).map(d => ({ verse: d.verse, category: d.category, likes: d.likes_count }));

    const context = {
      userPostedCategories: [...new Set(userDrops.map(d => d.category).filter(Boolean))],
      likedCategories: [...new Set(likedCategories)],
      likedHashtags: [...new Set(likedHashtags)].slice(0, 8),
      savedCategories: [...new Set(savedCategories)],
      likedVerseThemes: likedVerses,
      followedCreatorContent: followedCreators,
      trendingContent: trendingNow,
      totalLikes: userLikes.length,
      totalSaved: savedDropRecords.length,
    };

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI content recommender for "Generation LightMode", a Christian faith social platform. Based on this user's full engagement data, suggest 3 highly personalized content topics they'd love.

User engagement data:
${JSON.stringify(context, null, 2)}

RULES:
- Analyze what categories, hashtags, and Bible verse themes they engage with most
- Consider what they've saved (bookmarked) as strong interest signals
- Factor in trending content they haven't seen
- Suggest specific, actionable topics (not generic)
- Each suggestion should feel personally curated

Return JSON with "suggestions" array, each with "topic" (compelling short title, 3-6 words) and "description" (1 sentence explaining why this is for them based on their activity).`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                description: { type: "string" }
              }
            }
          }
        }
      }
    });

    setSuggestions(res.suggestions || []);
    setLoading(false);
  };

  if (!hasRequested) {
    return (
      <button
        onClick={generateSuggestions}
        className="w-full rounded-[24px] p-5 mb-6 flex items-center gap-4 transition-all hover:shadow-lg group"
        style={{ background: "linear-gradient(90deg, #FFF5D1 0%, #FFF9E5 100%)", border: "none", boxShadow: "0 4px 16px rgba(255, 208, 0, 0.05)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FFB400" }}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="text-left flex-1">
          <div className="font-bold text-sm" style={{ color: "#0B1B3D" }}>AI-Powered Suggestions</div>
          <div className="text-[10px] mt-0.5" style={{ color: "#6B7FA0" }}>Get personalized content picks based on your activity</div>
        </div>
        <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition" style={{ color: "#8A97B5" }} />
      </button>
    );
  }

  return (
    <div className="rounded-[24px] p-5 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(90deg, #FFF5D1 0%, #FFF9E5 100%)", border: "none", boxShadow: "0 4px 16px rgba(255, 208, 0, 0.05)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#FFB400" }} />
          <h3 className="font-black text-[11px] tracking-widest uppercase" style={{ color: "#0B1B3D" }}>For You</h3>
        </div>
        <button onClick={generateSuggestions} disabled={loading} className="p-1.5 rounded-lg transition hover:bg-white/50" style={{ color: "#8A97B5" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-sm" style={{ color: "#8A97B5" }}>
          <RefreshCw className="w-4 h-4 animate-spin" /> Thinking...
        </div>
      ) : suggestions && suggestions.length > 0 ? (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSearchTag(s.topic)}
              className="w-full text-left rounded-xl px-3 py-2.5 transition-all hover:bg-white/60 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{ background: i === 0 ? "#FFB400" : "#FFF0CC", color: i === 0 ? "#FFFFFF" : "#0B1B3D" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>{s.topic}</div>
                  <div className="text-[10px] truncate" style={{ color: "#6B7FA0" }}>{s.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-center py-4" style={{ color: "#8A97B5" }}>No suggestions available. Try again!</p>
      )}
    </div>
  );
}