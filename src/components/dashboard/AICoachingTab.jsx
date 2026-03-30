import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Brain, RefreshCw, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AICoachingTab({ user }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: myDrops = [] } = useQuery({
    queryKey: ["myDrops", user?.email],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: user?.email, status: "approved" }, "-created_date", 30),
    enabled: !!user?.email
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["activeChallenges"],
    queryFn: () => base44.entities.Challenge.filter({ active: true }),
  });

  const runAnalysis = async () => {
    if (myDrops.length < 1) {
      toast.error("You need at least 1 approved Glow Drop for the coach to analyze.");
      return;
    }
    setLoading(true);
    try {
      const dropsContext = myDrops.slice(0, 20).map((d, i) =>
        `Drop ${i + 1} (${new Date(d.created_date).toLocaleDateString()}): Verse: "${d.verse || 'N/A'}" | Reflection: "${d.reflection || 'N/A'}" | Category: ${d.category || 'General'} | Hashtags: ${d.hashtags || 'none'}`
      ).join("\n");

      const challengesList = challenges.map(c => `- ${c.title}: ${c.description}`).join("\n");

      const result = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are a faith-based spiritual coach for Generation LightMode, a Christian youth movement in East Africa. Analyze the following Glow Drops posted by a user named ${user.full_name || "a young believer"}.

USER'S GLOW DROPS:
${dropsContext}

AVAILABLE CHALLENGES ON PLATFORM:
${challengesList || "No challenges currently active."}

Based on this analysis, provide:
1. A summary of their emotional and spiritual patterns (themes, recurring struggles, growth areas, faith tone)
2. 3 personalized scripture-based encouragements that speak directly to their patterns
3. 2-3 specific recommended challenges from the platform list above (or general suggestions if none match) to help them grow
4. A personal motivational message to keep them going

Keep the tone warm, encouraging, and Spirit-led — like a caring mentor, not a robot.`,
        response_json_schema: {
          type: "object",
          properties: {
            patterns_summary: { type: "string" },
            emotional_tone: { type: "string" },
            growth_areas: { type: "array", items: { type: "string" } },
            scripture_encouragements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  verse: { type: "string" },
                  reference: { type: "string" },
                  personal_note: { type: "string" }
                }
              }
            },
            recommended_challenges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            personal_message: { type: "string" }
          }
        }
      });

      setAnalysis(result);
    } catch (err) {
      toast.error("Coach analysis failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A5CFF]/10 border border-[#8A5CFF]/20 mb-3">
          <Brain className="w-3.5 h-3.5 text-[#8A5CFF]" />
          <span className="text-[#8A5CFF] text-xs font-bold uppercase tracking-widest">AI Spiritual Coach</span>
        </div>
        <h1 className="text-3xl font-black font-['Space_Grotesk'] text-white">Your Faith Journey Coach</h1>
        <p className="text-gray-400 mt-1 max-w-xl">
          Our AI coach analyzes your Glow Drops to identify emotional and spiritual patterns, then offers personalized scripture encouragement and challenge recommendations.
        </p>
      </div>

      {/* Drop Count Banner */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#8A5CFF]/10 border border-[#8A5CFF]/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#8A5CFF]" />
          </div>
          <div>
            <p className="text-white font-bold">{myDrops.length} Glow Drop{myDrops.length !== 1 ? "s" : ""} available for analysis</p>
            <p className="text-gray-400 text-sm">The coach analyzes up to your last 20 approved drops</p>
          </div>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={loading}
          className="bg-[#8A5CFF] hover:bg-[#8A5CFF]/80 text-white font-bold rounded-xl px-6 h-11 shrink-0"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
          ) : analysis ? (
            <><RefreshCw className="w-4 h-4 mr-2" /> Re-analyze</>
          ) : (
            <><Brain className="w-4 h-4 mr-2" /> Analyze My Journey</>
          )}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-[#121826] border border-[#8A5CFF]/20 rounded-2xl p-10 text-center">
          <Loader2 className="w-10 h-10 text-[#8A5CFF] animate-spin mx-auto mb-4" />
          <p className="text-white font-bold font-['Space_Grotesk']">Coach is reading your heart...</p>
          <p className="text-gray-400 text-sm mt-1">Analyzing patterns across your Glow Drops</p>
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="space-y-6">

          {/* Emotional Tone Badge */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-gray-400 text-sm">Overall spiritual tone:</span>
            <span className="px-4 py-1.5 rounded-full bg-[#8A5CFF]/15 border border-[#8A5CFF]/30 text-[#8A5CFF] text-sm font-bold">
              {analysis.emotional_tone}
            </span>
          </div>

          {/* Patterns Summary */}
          <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-black font-['Space_Grotesk'] text-lg mb-3 flex items-center gap-2">
              <span className="text-xl">🔍</span> Spiritual Pattern Analysis
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">{analysis.patterns_summary}</p>

            {analysis.growth_areas?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Growth Areas Identified</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.growth_areas.map((area, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 text-[#00CFFF] text-xs font-semibold">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scripture Encouragements */}
          <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-black font-['Space_Grotesk'] text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">📖</span> Personalized Scripture for You
            </h2>
            <div className="space-y-4">
              {analysis.scripture_encouragements?.map((item, i) => (
                <div key={i} className="border-l-2 border-[#FFD000]/50 pl-4 py-1">
                  <p className="text-[#FFD000] font-bold text-sm mb-1">"{item.verse}"</p>
                  <p className="text-gray-500 text-xs mb-2 font-semibold">— {item.reference}</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.personal_note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Challenges */}
          {analysis.recommended_challenges?.length > 0 && (
            <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-black font-['Space_Grotesk'] text-lg mb-4 flex items-center gap-2">
                <span className="text-xl">🎯</span> Recommended Next Steps
              </h2>
              <div className="space-y-3">
                {analysis.recommended_challenges.map((ch, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[#0B0F1A] rounded-xl p-4 border border-white/5">
                    <ChevronRight className="w-4 h-4 text-[#00CFFF] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-white font-bold text-sm">{ch.title}</p>
                      <p className="text-gray-400 text-xs mt-1">{ch.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Message */}
          <div className="bg-gradient-to-br from-[#8A5CFF]/10 to-[#00CFFF]/5 border border-[#8A5CFF]/20 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">💜</div>
            <h2 className="text-white font-black font-['Space_Grotesk'] text-lg mb-3">A Word for You</h2>
            <p className="text-gray-200 text-sm leading-relaxed max-w-lg mx-auto italic">"{analysis.personal_message}"</p>
          </div>

        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <div className="bg-[#121826] border border-dashed border-white/10 rounded-2xl p-12 text-center">
          <Brain className="w-12 h-12 text-[#8A5CFF]/40 mx-auto mb-4" />
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Click <strong className="text-white">"Analyze My Journey"</strong> above and your AI coach will study your Glow Drops to reveal your spiritual patterns and next steps.
          </p>
        </div>
      )}
    </div>
  );
}