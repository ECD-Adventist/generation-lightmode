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
            scripture_encouragements: { type: "array", items: { type: "object", properties: { verse: { type: "string" }, reference: { type: "string" }, personal_note: { type: "string" } } } },
            recommended_challenges: { type: "array", items: { type: "object", properties: { title: { type: "string" }, reason: { type: "string" } } } },
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

  const cardStyle = { background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };

  return (
    <div className="space-y-6 font-['Inter']">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: "rgba(11, 63, 217, 0.08)", border: "1px solid #D6E4FF" }}>
          <Brain className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0B3FD9" }}>AI Spiritual Coach</span>
        </div>
        <h1 className="text-3xl font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Your Faith Journey Coach</h1>
        <p className="mt-1 max-w-xl" style={{ color: "#6B7FA0" }}>
          Our AI coach analyzes your Glow Drops to identify emotional and spiritual patterns, then offers personalized scripture encouragement and challenge recommendations.
        </p>
      </div>

      {/* Banner */}
      <div className="rounded-[1.5rem] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={cardStyle}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "#EEF3FF", border: "1px solid #D6E4FF" }}>
            <Sparkles className="w-5 h-5" style={{ color: "#0B3FD9" }} />
          </div>
          <div>
            <p className="font-bold" style={{ color: "#0B1B3D" }}>{myDrops.length} Glow Drop{myDrops.length !== 1 ? "s" : ""} available for analysis</p>
            <p className="text-sm" style={{ color: "#6B7FA0" }}>The coach analyzes up to your last 20 approved drops</p>
          </div>
        </div>
        <Button onClick={runAnalysis} disabled={loading} className="font-bold rounded-xl px-6 h-11 shrink-0" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", border: "none", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>)
            : analysis ? (<><RefreshCw className="w-4 h-4 mr-2" /> Re-analyze</>)
            : (<><Brain className="w-4 h-4 mr-2" /> Analyze My Journey</>)}
        </Button>
      </div>

      {loading && (
        <div className="rounded-[1.5rem] p-10 text-center" style={{ background: "#FFFFFF", border: "1px solid #D6E4FF" }}>
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "#0B3FD9" }} />
          <p className="font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Coach is reading your heart...</p>
          <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Analyzing patterns across your Glow Drops</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm" style={{ color: "#6B7FA0" }}>Overall spiritual tone:</span>
            <span className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ background: "rgba(11, 63, 217, 0.1)", border: "1px solid #D6E4FF", color: "#0B3FD9" }}>
              {analysis.emotional_tone}
            </span>
          </div>

          <div className="rounded-[1.5rem] p-6" style={cardStyle}>
            <h2 className="font-black font-['Space_Grotesk'] text-lg mb-3 flex items-center gap-2" style={{ color: "#0B1B3D" }}>
              <span className="text-xl">🔍</span> Spiritual Pattern Analysis
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#3A4A6B" }}>{analysis.patterns_summary}</p>

            {analysis.growth_areas?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#8A97B5" }}>Growth Areas Identified</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.growth_areas.map((area, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF", color: "#0B3FD9" }}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] p-6" style={cardStyle}>
            <h2 className="font-black font-['Space_Grotesk'] text-lg mb-4 flex items-center gap-2" style={{ color: "#0B1B3D" }}>
              <span className="text-xl">📖</span> Personalized Scripture for You
            </h2>
            <div className="space-y-4">
              {analysis.scripture_encouragements?.map((item, i) => (
                <div key={i} className="border-l-2 pl-4 py-1" style={{ borderColor: "#FFD000" }}>
                  <p className="font-bold text-sm mb-1" style={{ color: "#CC7A00" }}>"{item.verse}"</p>
                  <p className="text-xs mb-2 font-semibold" style={{ color: "#8A97B5" }}>— {item.reference}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#3A4A6B" }}>{item.personal_note}</p>
                </div>
              ))}
            </div>
          </div>

          {analysis.recommended_challenges?.length > 0 && (
            <div className="rounded-[1.5rem] p-6" style={cardStyle}>
              <h2 className="font-black font-['Space_Grotesk'] text-lg mb-4 flex items-center gap-2" style={{ color: "#0B1B3D" }}>
                <span className="text-xl">🎯</span> Recommended Next Steps
              </h2>
              <div className="space-y-3">
                {analysis.recommended_challenges.map((ch, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl p-4" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5" }}>
                    <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#0B3FD9" }} />
                    <div>
                      <p className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{ch.title}</p>
                      <p className="text-xs mt-1" style={{ color: "#6B7FA0" }}>{ch.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[1.5rem] p-6 text-center" style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)", border: "1px solid #D6E4FF" }}>
            <div className="text-3xl mb-3">💙</div>
            <h2 className="font-black font-['Space_Grotesk'] text-lg mb-3" style={{ color: "#0B1B3D" }}>A Word for You</h2>
            <p className="text-sm leading-relaxed max-w-lg mx-auto italic" style={{ color: "#3A4A6B" }}>"{analysis.personal_message}"</p>
          </div>
        </div>
      )}

      {!analysis && !loading && (
        <div className="rounded-[1.5rem] p-12 text-center" style={{ background: "#FFFFFF", border: "2px dashed #D6E4FF" }}>
          <Brain className="w-12 h-12 mx-auto mb-4" style={{ color: "#B8E5FF" }} />
          <p className="text-sm max-w-sm mx-auto" style={{ color: "#6B7FA0" }}>
            Click <strong style={{ color: "#0B1B3D" }}>"Analyze My Journey"</strong> above and your AI coach will study your Glow Drops to reveal your spiritual patterns and next steps.
          </p>
        </div>
      )}
    </div>
  );
}