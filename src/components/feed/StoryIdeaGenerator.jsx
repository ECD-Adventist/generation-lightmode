import React, { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PROMPT_CATEGORIES = [
  { id: "faith", label: "🙏 Faith", color: "#0B3FD9" },
  { id: "gratitude", label: "💛 Gratitude", color: "#CC7A00" },
  { id: "motivation", label: "🔥 Motivation", color: "#DC2626" },
  { id: "trending", label: "📈 Trending", color: "#7C3AED" },
  { id: "daily", label: "☀️ Daily Prompt", color: "#059669" },
];

export default function StoryIdeaGenerator({ onSelectIdea, mode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("faith");

  const generateIdeas = async () => {
    setLoading(true);
    setIdeas([]);

    const categoryPrompts = {
      faith: "inspiring Bible-based faith declarations, short scripture reflections, or bold spiritual affirmations",
      gratitude: "heartfelt gratitude statements, thankfulness prompts, or blessings to count",
      motivation: "powerful motivational quotes rooted in Christian values, encouraging words for young believers",
      trending: "trending Christian youth culture topics, viral faith challenges, or current events with a faith perspective",
      daily: "a creative daily prompt for today — could be a reflection question, a mini-challenge, or a thought-provoking statement about living faith boldly",
    };

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a creative content assistant for Generation LightMode, a Christian youth movement.

Generate 4 short story ideas for a 24-hour status post. The category is: ${selectedCategory}.
Focus on: ${categoryPrompts[selectedCategory]}.

Each idea should be:
- Short (under 120 characters) — perfect for a status card
- Bold, punchy, and shareable
- Relevant to young Christians (ages 16-30)
- ${mode === "image" ? "Also suggest a brief image description (what photo would pair well)" : "Written to look great as text on a colorful background"}

Return as JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          ideas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string", description: "The status text (under 120 chars)" },
                image_hint: { type: "string", description: "Brief image suggestion if applicable" },
                theme: { type: "string", enum: ["ocean", "violet", "sunrise", "midnight"], description: "Suggested background theme" },
              },
              required: ["text", "theme"],
            },
          },
        },
        required: ["ideas"],
      },
    });

    setIdeas(res.ideas || []);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => { setIsOpen(true); generateIdeas(); }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-md"
        style={{
          background: "linear-gradient(90deg, rgba(31,184,255,0.08) 0%, rgba(138,92,255,0.08) 100%)",
          border: "1px solid #D6E4FF",
          color: "#0B3FD9",
        }}
      >
        <Sparkles className="w-4 h-4" /> AI Story Ideas
      </button>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: "#E6ECF5" }}>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
          <span className="text-xs font-bold" style={{ color: "#0B1B3D" }}>AI Story Ideas</span>
        </div>
        <button type="button" onClick={() => setIsOpen(false)} className="text-[10px] font-bold px-2 py-1 rounded-md hover:bg-white transition" style={{ color: "#6B7FA0" }}>
          Close
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto hide-scrollbar">
        {PROMPT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => { setSelectedCategory(cat.id); }}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all"
            style={selectedCategory === cat.id
              ? { background: cat.color, color: "#FFFFFF" }
              : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Generate / Refresh */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={generateIdeas}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition"
          style={{ background: "#FFFFFF", border: "1px solid #D6E4FF", color: "#0B3FD9" }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {loading ? "Generating..." : ideas.length > 0 ? "Regenerate" : "Generate Ideas"}
        </button>
      </div>

      {/* Ideas list */}
      {ideas.length > 0 && (
        <div className="px-3 pb-3 space-y-2">
          {ideas.map((idea, i) => {
            const themeMap = {
              ocean: "from-[#00CFFF] to-[#1DA1FF]",
              violet: "from-[#8A5CFF] to-[#3B1E70]",
              sunrise: "from-[#FFD000] to-[#F97316]",
              midnight: "from-[#121826] to-[#0B0F1A]",
            };
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelectIdea({ text: idea.text, theme: idea.theme, imageHint: idea.image_hint })}
                className="w-full text-left rounded-xl overflow-hidden transition-all hover:scale-[1.01] hover:shadow-md group"
                style={{ border: "1px solid #E6ECF5" }}
              >
                <div className={`bg-gradient-to-br ${themeMap[idea.theme] || themeMap.ocean} px-4 py-3 relative`}>
                  <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                  <p className="text-white text-sm font-bold leading-snug relative z-10 drop-shadow-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    {idea.text}
                  </p>
                  {idea.image_hint && mode === "image" && (
                    <p className="text-white/70 text-[10px] mt-1.5 relative z-10">📸 {idea.image_hint}</p>
                  )}
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}