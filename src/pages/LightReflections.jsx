import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Sparkles, RefreshCw, BookOpen, CheckCircle2, Zap, Home, ChevronRight, Loader2 } from "lucide-react";

const STORAGE_KEY = "lightReflections_cache";

function loadCached(email) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj.email !== email) return null;
    const age = Date.now() - obj.ts;
    if (age > 12 * 60 * 60 * 1000) return null;
    return obj.data;
  } catch { return null; }
}

function saveCache(email, data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, ts: Date.now(), data }));
  } catch {}
}

export default function LightReflections() {
  const [user, setUser] = useState(null);
  const [reflection, setReflection] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(u => {
        setUser(u);
        const cached = loadCached(u.email);
        if (cached) setReflection(cached);
      });
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: myDrops = [] } = useQuery({
    queryKey: ["myDropsForReflection", user?.email],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: myChallengeSubmissions = [] } = useQuery({
    queryKey: ["myChallengeSubsForReflection", user?.email],
    queryFn: () => base44.entities.ChallengeSubmission.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ["allChallengesForReflection"],
    queryFn: () => base44.entities.Challenge.list(),
    enabled: !!user,
  });

  const generateReflection = async (force = false) => {
    if (!user) return;
    if (!force) {
      const cached = loadCached(user.email);
      if (cached) { setReflection(cached); return; }
    }
    setGenerating(true);
    setReflection(null);
    setCompletedTasks([]);

    const recentDrops = myDrops.slice(0, 10);
    const completedChallengeIds = new Set(myChallengeSubmissions.map(s => s.challenge_id));
    const completedChallengeNames = allChallenges.filter(c => completedChallengeIds.has(c.id)).map(c => c.title);

    const dropsContext = recentDrops.length > 0
      ? recentDrops.map(d => `- Verse: "${d.verse || "(none)"}" | Reflection: "${d.reflection || "(none)"}" | Category: ${d.category || "General"}`).join("\n")
      : "No drops yet — this is a new user just getting started.";

    const challengesContext = completedChallengeNames.length > 0
      ? completedChallengeNames.join(", ")
      : "No challenges completed yet.";

    const prompt = `You are a personalized spiritual coach for Generation LightMode — a global Christian youth faith movement.

User Profile:
- Name: ${user.full_name || "Believer"}
- Country: ${user.country || "Unknown"}
- Glow Score (XP): ${user.glow_score || 0}
- Completed Challenges: ${challengesContext}

Their most recent Glow Drops (devotionals they've posted):
${dropsContext}

Based on their faith journey, interests, and activity, generate a deeply personalized "Light Reflection" for today. 

Return a JSON object with EXACTLY this structure:
{
  "greeting": "A warm, personalized 1-sentence greeting using their name",
  "theme": "A 3-5 word theme title for today's reflection (e.g. 'Walking in Bold Faith')",
  "insight": "A 2-3 sentence personalized spiritual insight connecting their recent drops and journey. Be specific to what they've been reflecting on.",
  "verse": {
    "reference": "Bible verse reference (e.g. Isaiah 41:10)",
    "text": "Full verse text in NKJV"
  },
  "tasks": [
    "A short, specific, actionable faith task tailored to their journey (max 15 words)",
    "Another specific task based on their activity or gaps",
    "A challenge-related or community-focused action"
  ],
  "encouragement": "A 1-sentence bold, energetic closing encouragement in the LightMode voice. Faith. Always On. ⚡"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          greeting: { type: "string" },
          theme: { type: "string" },
          insight: { type: "string" },
          verse: { type: "object", properties: { reference: { type: "string" }, text: { type: "string" } } },
          tasks: { type: "array", items: { type: "string" } },
          encouragement: { type: "string" },
        },
      },
    });

    setReflection(result);
    saveCache(user.email, result);
    setGenerating(false);
  };

  useEffect(() => {
    if (user && myDrops !== undefined && myChallengeSubmissions !== undefined && allChallenges !== undefined) {
      const cached = loadCached(user.email);
      if (!cached) generateReflection();
    }
  }, [user, myDrops.length, myChallengeSubmissions.length, allChallenges.length]);

  const toggleTask = (i) => {
    setCompletedTasks(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
    </div>
  );

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ background: "#FFFFFF", borderColor: "#E6ECF5" }}>
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 transition text-sm" style={{ color: "#4A5878" }}>
          <Home className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-2" style={{ color: "#0B3FD9" }}>
          <Sparkles className="w-5 h-5" />
          <span className="font-bold text-sm font-['Space_Grotesk']">Light Reflections</span>
        </div>
        <div className="w-20" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ background: "rgba(31, 184, 255, 0.08)", border: "1px solid #B8E5FF" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#1FB8FF" }} />
            <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "#0B3FD9" }}>AI-Powered Daily Devotional</span>
          </div>
          <h1 className="text-4xl font-bold font-['Space_Grotesk'] mb-3">
            Your <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #1FB8FF, #0B3FD9)" }}>Light Reflection</span>
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: "#6B7FA0" }}>
            Personalized daily insights based on your Glow Drops, challenges completed, and faith journey.
          </p>
        </div>

        {/* Loading State */}
        {generating && (
          <div className="rounded-3xl p-12 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(31, 184, 255, 0.08)", border: "1px solid #B8E5FF" }}>
              <Sparkles className="w-9 h-9 animate-pulse" style={{ color: "#1FB8FF" }} />
            </div>
            <p className="font-bold text-lg mb-2" style={{ color: "#0B1B3D" }}>Crafting your reflection...</p>
            <p className="text-sm" style={{ color: "#6B7FA0" }}>Analyzing your journey and faith activity</p>
            <div className="flex justify-center gap-2 mt-6">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: "#1FB8FF", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Reflection Card */}
        {!generating && reflection && (
          <div className="space-y-4">
            <div className="rounded-3xl p-6" style={{ background: "linear-gradient(135deg, rgba(31,184,255,0.06), rgba(11,63,217,0.06))", border: "1px solid #B8E5FF" }}>
              <p className="text-sm mb-3" style={{ color: "#4A5878" }}>{reflection.greeting}</p>
              <h2 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{reflection.theme}</h2>
              <p className="mt-4 leading-relaxed text-sm" style={{ color: "#3A4A6B" }}>{reflection.insight}</p>
            </div>

            {reflection.verse && (
              <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E4FF" }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(11, 63, 217, 0.04)" }} />
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4" style={{ color: "#0B3FD9" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0B3FD9" }}>Today's Verse</span>
                </div>
                <p className="text-lg font-medium italic leading-relaxed mb-3" style={{ color: "#0B1B3D" }}>
                  "{reflection.verse.text}"
                </p>
                <p className="font-bold text-sm" style={{ color: "#0B3FD9" }}>— {reflection.verse.reference}</p>
              </div>
            )}

            {reflection.tasks && (
              <div className="rounded-3xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4" style={{ color: "#CC7A00" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#CC7A00" }}>Your Faith Tasks Today</span>
                </div>
                <div className="space-y-3">
                  {reflection.tasks.map((task, i) => (
                    <button
                      key={i}
                      onClick={() => toggleTask(i)}
                      className="w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left"
                      style={completedTasks.includes(i)
                        ? { borderColor: "#86EFAC", background: "rgba(34, 197, 94, 0.06)" }
                        : { borderColor: "#E6ECF5", background: "#F6F8FC" }}
                    >
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all" style={completedTasks.includes(i) ? { borderColor: "#22C55E", background: "#22C55E" } : { borderColor: "#C0C8D8" }}>
                        {completedTasks.includes(i) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm leading-relaxed" style={completedTasks.includes(i) ? { color: "#8A97B5", textDecoration: "line-through" } : { color: "#3A4A6B" }}>
                        {task}
                      </span>
                    </button>
                  ))}
                </div>
                {completedTasks.length > 0 && (
                  <p className="text-center text-xs mt-4 font-bold" style={{ color: "#22C55E" }}>
                    ✓ {completedTasks.length} of {reflection.tasks.length} completed today
                  </p>
                )}
              </div>
            )}

            {reflection.encouragement && (
              <div className="rounded-3xl p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(255,208,0,0.06), rgba(31,184,255,0.06))", border: "1px solid #FFE4A0" }}>
                <p className="font-bold text-base leading-relaxed" style={{ color: "#0B1B3D" }}>{reflection.encouragement}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => generateReflection(true)} disabled={generating} className="flex items-center gap-2 text-sm transition font-medium" style={{ color: "#6B7FA0" }}>
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
              <div className="text-xs" style={{ color: "#8A97B5" }}>Refreshes every 12 hours</div>
              <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 text-sm font-bold transition" style={{ color: "#0B3FD9" }}>
                Share a Drop <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {!generating && !reflection && (
          <div className="rounded-3xl p-12 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-40" style={{ color: "#1FB8FF" }} />
            <p className="font-bold text-lg mb-2" style={{ color: "#0B1B3D" }}>Ready for your reflection?</p>
            <p className="text-sm mb-6" style={{ color: "#6B7FA0" }}>Post a few Glow Drops to unlock more personalized insights.</p>
            <button onClick={() => generateReflection(true)} className="px-6 py-3 font-bold rounded-2xl hover:opacity-90 transition" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}>
              Generate My Reflection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}