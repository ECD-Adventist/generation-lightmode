import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, RefreshCw, ChevronRight } from "lucide-react";

export default function AIContentSuggestions({ user, drops, following, onSearchTag }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    setHasRequested(true);

    const userDrops = drops.filter(d => d.user_email === user?.email).slice(0, 5);
    const likedCategories = drops
      .filter(d => d.likes_count > 2)
      .map(d => d.category)
      .filter(Boolean);
    const topCategories = [...new Set(likedCategories)].slice(0, 3);
    const followingEmails = new Set(following.map(f => f.following_email));
    const followedCreators = drops
      .filter(d => followingEmails.has(d.user_email))
      .slice(0, 3)
      .map(d => d.verse || d.reflection?.slice(0, 50));

    const context = {
      userCategories: userDrops.map(d => d.category).filter(Boolean),
      trendingCategories: topCategories,
      followedContent: followedCreators,
    };

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on this user's activity on a Christian faith social platform, suggest 3 personalized content topics they might enjoy. Context: ${JSON.stringify(context)}. Return JSON with "suggestions" array, each with "topic" (short title) and "description" (1 sentence why). Be specific and faith-focused.`,
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
        className="w-full rounded-[20px] p-4 mb-6 flex items-center gap-3 transition-all hover:shadow-lg group"
        style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0", boxShadow: "0 4px 16px rgba(255, 159, 26, 0.1)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #FFD60A, #FF9F1A)" }}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="text-left flex-1">
          <div className="font-bold text-sm" style={{ color: "#0B1B3D" }}>AI-Powered Suggestions</div>
          <div className="text-[11px]" style={{ color: "#8A6A20" }}>Get personalized content picks based on your activity</div>
        </div>
        <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition" style={{ color: "#FF9F1A" }} />
      </button>
    );
  }

  return (
    <div className="rounded-[20px] p-5 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0", boxShadow: "0 4px 16px rgba(255, 159, 26, 0.1)" }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "#FFD60A" }} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#FF9F1A" }} />
          <h3 className="font-black text-xs tracking-widest uppercase" style={{ color: "#CC7A00" }}>For You</h3>
        </div>
        <button onClick={generateSuggestions} disabled={loading} className="p-1.5 rounded-lg transition hover:bg-white/50" style={{ color: "#CC7A00" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-sm" style={{ color: "#CC7A00" }}>
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
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{ background: i === 0 ? "linear-gradient(135deg, #FFD60A, #FF9F1A)" : "#FFF0CC", color: i === 0 ? "#FFFFFF" : "#CC7A00" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>{s.topic}</div>
                  <div className="text-[10px] truncate" style={{ color: "#8A6A20" }}>{s.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-center py-4" style={{ color: "#CC7A00" }}>No suggestions available. Try again!</p>
      )}
    </div>
  );
}