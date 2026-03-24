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
    if (age > 12 * 60 * 60 * 1000) return null; // 12h cache
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
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="bg-[#121826] border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
          <Home className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-2 text-[#00CFFF]">
          <Sparkles className="w-5 h-5" />
          <span className="font-bold text-sm font-['Space_Grotesk']">Light Reflections</span>
        </div>
        <div className="w-20" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#00CFFF]/10 border border-[#00CFFF]/20 px-4 py-2 rounded-full mb-5">
            <span className="w-2 h-2 rounded-full bg-[#00CFFF] animate-pulse" />
            <span className="text-[#00CFFF] text-xs font-bold tracking-wider uppercase">AI-Powered Daily Devotional</span>
          </div>
          <h1 className="text-4xl font-bold font-['Space_Grotesk'] mb-3">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]">Light Reflection</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Personalized daily insights based on your Glow Drops, challenges completed, and faith journey.
          </p>
        </div>

        {/* Loading State */}
        {generating && (
          <div className="bg-[#121826] border border-white/10 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00CFFF]/20 to-[#8A5CFF]/20 border border-[#00CFFF]/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,207,255,0.3)]">
              <Sparkles className="w-9 h-9 text-[#00CFFF] animate-pulse" />
            </div>
            <p className="text-white font-bold text-lg mb-2">Crafting your reflection...</p>
            <p className="text-gray-400 text-sm">Analyzing your journey and faith activity</p>
            <div className="flex justify-center gap-2 mt-6">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#00CFFF]" style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Reflection Card */}
        {!generating && reflection && (
          <div className="space-y-4">
            {/* Greeting + Theme */}
            <div className="bg-gradient-to-br from-[#00CFFF]/10 to-[#8A5CFF]/10 border border-[#00CFFF]/20 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,207,255,0.08)]">
              <p className="text-gray-300 text-sm mb-3">{reflection.greeting}</p>
              <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">{reflection.theme}</h2>
              <p className="text-gray-300 mt-4 leading-relaxed text-sm">{reflection.insight}</p>
            </div>

            {/* Verse */}
            {reflection.verse && (
              <div className="bg-[#121826] border border-[#8A5CFF]/30 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8A5CFF]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-[#8A5CFF]" />
                  <span className="text-[#8A5CFF] text-xs font-bold uppercase tracking-wider">Today's Verse</span>
                </div>
                <p className="text-white text-lg font-medium italic leading-relaxed mb-3">
                  "{reflection.verse.text}"
                </p>
                <p className="text-[#8A5CFF] font-bold text-sm">— {reflection.verse.reference}</p>
              </div>
            )}

            {/* Tasks */}
            {reflection.tasks && (
              <div className="bg-[#121826] border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-[#FFD000]" />
                  <span className="text-[#FFD000] text-xs font-bold uppercase tracking-wider">Your Faith Tasks Today</span>
                </div>
                <div className="space-y-3">
                  {reflection.tasks.map((task, i) => (
                    <button
                      key={i}
                      onClick={() => toggleTask(i)}
                      className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${
                        completedTasks.includes(i)
                          ? "border-green-500/40 bg-green-500/10"
                          : "border-white/5 bg-white/3 hover:border-white/15 hover:bg-white/5"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        completedTasks.includes(i) ? "border-green-400 bg-green-400" : "border-gray-500"
                      }`}>
                        {completedTasks.includes(i) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm leading-relaxed ${completedTasks.includes(i) ? "text-gray-400 line-through" : "text-gray-200"}`}>
                        {task}
                      </span>
                    </button>
                  ))}
                </div>
                {completedTasks.length > 0 && (
                  <p className="text-center text-xs text-green-400 mt-4 font-bold">
                    ✓ {completedTasks.length} of {reflection.tasks.length} completed today
                  </p>
                )}
              </div>
            )}

            {/* Encouragement */}
            {reflection.encouragement && (
              <div className="bg-gradient-to-r from-[#FFD000]/10 to-[#00CFFF]/10 border border-[#FFD000]/20 rounded-3xl p-6 text-center">
                <p className="text-white font-bold text-base leading-relaxed">{reflection.encouragement}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => generateReflection(true)}
                disabled={generating}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#00CFFF] transition font-medium"
              >
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
              <div className="text-xs text-gray-600">Refreshes every 12 hours</div>
              <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 text-sm font-bold text-[#00CFFF] hover:text-white transition">
                Share a Drop <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Empty state if no drops yet */}
        {!generating && !reflection && (
          <div className="bg-[#121826] border border-white/10 rounded-3xl p-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-[#00CFFF] opacity-40" />
            <p className="text-white font-bold text-lg mb-2">Ready for your reflection?</p>
            <p className="text-gray-400 text-sm mb-6">Post a few Glow Drops to unlock more personalized insights.</p>
            <button
              onClick={() => generateReflection(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold rounded-2xl hover:opacity-90 transition shadow-[0_0_20px_rgba(0,207,255,0.3)]"
            >
              Generate My Reflection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}