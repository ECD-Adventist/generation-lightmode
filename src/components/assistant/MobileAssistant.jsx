import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Send, Zap, RefreshCw, Menu, X, Sparkles, ChevronRight, LogOut, User, LayoutDashboard, Users, Flag, BarChart3, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const suggestions = [
  "What is Generation LightMode?",
  "How do I join a GlowGroup?",
  "What is a Glow Drop?",
  "Tell me a Key Code of Truth",
  "What is #LightOverLust?",
  "What happens at Switch It On Summit?",
];

const initialMessage = {
  role: "assistant",
  content: "Hey! I'm the LightMode Assistant ⚡\n\nI'm here to guide you through the movement — from challenges and GlowGroups to Bible verses and inspiration. What would you like to know?",
};

/**
 * Mobile-only Assistant page — branded LightMode chat experience.
 * Full-height chat with sticky header, suggestion chips, and bottom-docked input.
 */
export default function MobileAssistant() {
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser).catch(() => {});
    });
  }, []);

  const { data: knowledgeBase = [] } = useQuery({
    queryKey: ["assistant_knowledge_runtime"],
    queryFn: () => base44.entities.AssistantKnowledge.filter({ status: "active" }, "-created_date", 100),
    initialData: [],
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const conversationHistory = newMessages.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
    const knowledgeContext = knowledgeBase.length
      ? knowledgeBase.map((item, index) => `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}`).join("\n\n")
      : "";

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the LightMode Assistant — an AI for Generation LightMode, a global faith-based digital movement for youth in the East-Central Africa Division (ECD).

Your personality: Energetic, faith-filled, encouraging, youthful, and positive. You use occasional emojis (⚡💡🙏🌟🔥) but not excessively.

About Generation LightMode:
- A global youth faith movement mobilizing 1,000,000 believers to reach 10,000,000 peers across 12 nations.
- Focused on turning hidden faith into visible light.
- Core Activities:
  1. Glow Drops: Daily devotionals based on "Key Codes of Truth" (the 28 Fundamental Beliefs).
  2. Real Light Series: Weekly conversations rooted in "Keeping It 100" (authentic talk on real struggles).
  3. LightMode Challenges: Monthly campaigns like #LightOverLust, #GlowInTheDark, #FaithOnFridays, #LitForLife.
  4. GlowGroups: Micro discipleship hubs of 4-6 youth meeting weekly for prayer and accountability.
  5. Light Ambassadors: Local mentors and youth leaders.
- Tagline: "Faith. Always On."
- Scripture theme: Matthew 5:14 "You are the light of the world"

Conversation so far:
${conversationHistory}

Approved training Q&A:
${knowledgeContext || "No custom Q&A added yet."}

When a user's question matches or is clearly related to the approved training Q&A, prioritize that answer first and stay consistent with it.
Respond helpfully, inspirationally, and in a way that aligns with the LightMode brand. Keep responses concise but impactful. If asked about Bible verses, provide one from the NKJV translation relevant to light, faith, or courage. Answer questions about Glow Drops, GlowGroups, Switch It On Summit, and Challenges directly using the Core Activities info.`,
    });

    setMessages([...newMessages, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const reset = () => { setMessages([initialMessage]); setInput(""); };

  return (
    <div className="h-[100dvh] flex flex-col font-['Inter']" style={{ background: "linear-gradient(180deg, #0B0F1A 0%, #0D1220 100%)", color: "#FFFFFF" }}>
      <style>{`
        @keyframes ma-pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
        @keyframes ma-halo { 0%,100% { box-shadow: 0 0 20px rgba(0,207,255,0.4); } 50% { box-shadow: 0 0 35px rgba(0,207,255,0.7); } }
      `}</style>

      {/* HEADER — compact, branded */}
      <div className="shrink-0 safe-pt px-4 pb-3" style={{ background: "linear-gradient(180deg, #121826 0%, #0B0F1A 100%)", borderBottom: "1px solid rgba(0,207,255,0.12)" }}>
        <div className="flex items-center justify-between pt-2 mb-3">
          <Link to={createPageUrl("Home")} className="active:scale-95 transition">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="" className="h-8 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={reset} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.06)", color: "#C8D0E0", border: "1px solid rgba(255,255,255,0.1)" }} title="Reset">
              <RefreshCw className="w-[16px] h-[16px]" />
            </button>
            <button onClick={() => setMenuOpen(true)} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.06)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Menu className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>

        {/* Assistant identity */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0" style={{ animation: "ma-halo 2.5s ease-in-out infinite" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.3), rgba(138,92,255,0.3))", border: "2px solid rgba(0,207,255,0.5)" }}>
              <Zap className="w-5 h-5" style={{ color: "#00CFFF", fill: "#00CFFF", filter: "drop-shadow(0 0 6px #00CFFF)" }} />
            </div>
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full" style={{ background: "#00CFFF", border: "2px solid #0B0F1A", boxShadow: "0 0 8px #00CFFF" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-['Space_Grotesk'] font-black text-[16px] leading-tight">
              LightMode <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Assistant</span>
            </div>
            <div className="text-[11px] flex items-center gap-1.5" style={{ color: "#8A9BB0" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />
              Online · AI guide to the movement
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGES — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.3), rgba(138,92,255,0.3))", border: "1px solid rgba(0,207,255,0.4)" }}>
                <Zap className="w-3.5 h-3.5" style={{ color: "#00CFFF" }} />
              </div>
            )}
            <div
              className="max-w-[78%] px-3.5 py-2.5 text-[14px] leading-[1.55]"
              style={{
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "linear-gradient(135deg, #00CFFF, #8A5CFF)" : "#121826",
                border: msg.role === "user" ? "none" : "1px solid rgba(0,207,255,0.18)",
                color: "#FFFFFF",
                whiteSpace: "pre-wrap",
                boxShadow: msg.role === "user" ? "0 4px 16px rgba(0,207,255,0.25)" : "none",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.3), rgba(138,92,255,0.3))", border: "1px solid rgba(0,207,255,0.4)" }}>
              <Zap className="w-3.5 h-3.5" style={{ color: "#00CFFF" }} />
            </div>
            <div className="px-4 py-3 flex gap-1.5 items-center" style={{ background: "#121826", border: "1px solid rgba(0,207,255,0.18)", borderRadius: "16px 16px 16px 4px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#00CFFF", animation: `ma-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTIONS — only when new chat */}
      {messages.length <= 1 && !loading && (
        <div className="shrink-0 px-4 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3" style={{ color: "#FFD000" }} />
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#FFD000" }}>Try asking</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <style>{`.ma-sug::-webkit-scrollbar { display: none; }`}</style>
            <div className="ma-sug flex gap-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => sendMessage(s)} className="shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold active:scale-95 transition whitespace-nowrap" style={{ background: "rgba(0,207,255,0.08)", color: "#C8D0E0", border: "1px solid rgba(0,207,255,0.25)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INPUT — bottom docked */}
      <div className="shrink-0 px-4 pb-3 pt-2 safe-pb" style={{ background: "rgba(11,15,26,0.9)", borderTop: "1px solid rgba(0,207,255,0.08)", backdropFilter: "blur(12px)" }}>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2 rounded-full px-2 py-1.5" style={{ background: "#121826", border: "1px solid rgba(0,207,255,0.25)" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask the Assistant..."
            className="flex-1 bg-transparent border-none outline-none text-[14px] px-2"
            style={{ color: "#FFFFFF", fontFamily: "Inter, sans-serif", minWidth: 0 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition active:scale-95"
            style={{
              background: input.trim() && !loading ? "linear-gradient(135deg, #00CFFF, #8A5CFF)" : "rgba(255,255,255,0.06)",
              cursor: input.trim() && !loading ? "pointer" : "default",
              boxShadow: input.trim() && !loading ? "0 4px 14px rgba(0,207,255,0.35)" : "none",
            }}
          >
            <Send className="w-4 h-4" style={{ color: input.trim() && !loading ? "#0B0F1A" : "#8A9BB0" }} />
          </button>
        </form>
      </div>

      {/* MENU DRAWER */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[5000] overflow-y-auto safe-pb"
          style={{
            background: "linear-gradient(135deg, rgba(10,15,28,0.99) 0%, rgba(18,24,38,0.98) 50%, rgba(7,11,22,0.99) 100%)",
            backdropFilter: "blur(40px) saturate(1.8)",
            paddingTop: "env(safe-area-inset-top)",
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,207,255,0.08) 0%, transparent 100%)" }} />

          <div className="relative z-10 px-5 pt-6 pb-8">
            <div className="flex items-center justify-between mb-8">
              <p style={{ color: "#00CFFF", fontSize: 12, fontWeight: 900, letterSpacing: "0.2em", margin: 0 }}>MENU</p>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition hover:bg-white/20 active:scale-90"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFFFFF" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2.5 mb-7">
              {[
                { label: "About", page: "About" },
                { label: "Impact", page: "Impact" },
                { label: "Assistant", page: "Assistant" },
              ].map(item => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.06) 100%)",
                    border: "1px solid rgba(0,207,255,0.15)",
                    color: "#E8EEF8",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"
                  }}
                >
                  <span>{item.label}</span>
                  <ChevronRight size={18} style={{ color: "#8A9BB0" }} />
                </Link>
              ))}

              <Link to={createPageUrl("KeepIt100")} onClick={() => setMenuOpen(false)} className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.06) 100%)", border: "1px solid rgba(0,207,255,0.15)", color: "#E8EEF8", boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <span className="flex items-center gap-2.5"><span style={{ fontSize: 20 }}>💯</span> Keep It 100</span>
                <ChevronRight size={18} style={{ color: "#8A9BB0" }} />
              </Link>
              <Link to={createPageUrl("CodesOfTruth")} onClick={() => setMenuOpen(false)} className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.06) 100%)", border: "1px solid rgba(0,207,255,0.15)", color: "#E8EEF8", boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <span className="flex items-center gap-2.5"><span style={{ fontSize: 20 }}>🔐</span> Codes of Truth</span>
                <ChevronRight size={18} style={{ color: "#8A9BB0" }} />
              </Link>
              <Link to={createPageUrl("Resources")} onClick={() => setMenuOpen(false)} className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.06) 100%)", border: "1px solid rgba(0,207,255,0.15)", color: "#E8EEF8", boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <span className="flex items-center gap-2.5"><span style={{ fontSize: 20 }}>🌍</span> Resources</span>
                <ChevronRight size={18} style={{ color: "#8A9BB0" }} />
              </Link>
              <Link to={createPageUrl("Challenges")} onClick={() => setMenuOpen(false)} className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.06) 100%)", border: "1px solid rgba(0,207,255,0.15)", color: "#E8EEF8", boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <span className="flex items-center gap-2.5"><span style={{ fontSize: 20 }}>🎯</span> Challenges</span>
                <ChevronRight size={18} style={{ color: "#8A9BB0" }} />
              </Link>
              <Link to={createPageUrl("GlowGroups")} onClick={() => setMenuOpen(false)} className="group flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.06) 100%)", border: "1px solid rgba(0,207,255,0.15)", color: "#E8EEF8", boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <span className="flex items-center gap-2.5"><span style={{ fontSize: 20 }}>🌐</span> GlowGroups</span>
                <ChevronRight size={18} style={{ color: "#8A9BB0" }} />
              </Link>
              </div>

            {user ? (
              <div className="space-y-4">
                <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg, rgba(18,24,38,0.95) 0%, rgba(12,17,30,0.98) 100%)", border: "1px solid rgba(0,207,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(0,207,255,0.1)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #00CFFF, #5AC8FF)" }} />
                    <p style={{ color: "#8EA0B8", fontSize: 11, fontWeight: 900, letterSpacing: "0.16em", margin: 0 }}>MY ACCOUNT</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: <User size={16} />, label: "My Profile", to: createPageUrl("Profile") },
                      { icon: <Zap size={16} />, label: "Feed", to: createPageUrl("Feed") },
                      { icon: <Zap size={16} />, label: "Notifications", to: createPageUrl("Notifications") }
                    ].map(item => (
                      <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:bg-white/10" style={{ color: "#E8EEF8" }}>
                        <span className="flex items-center gap-3">
                          <span style={{ color: "#00CFFF" }}>{item.icon}</span> {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {(user?.role === "admin" || user?.role === "super_admin" || ["ecd_admin", "country_admin", "union_admin", "conference_field_admin", "church_admin", "moderator"].includes(user?.role)) && (
                  <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg, rgba(255,208,0,0.06) 0%, rgba(255,160,0,0.04) 100%)", border: "1px solid rgba(255,208,0,0.2)", boxShadow: "0 8px 32px rgba(255,208,0,0.1), inset 0 1px 0 rgba(255,208,0,0.12)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #FFD000, #FFA300)" }} />
                      <p style={{ color: "#FFDB58", fontSize: 11, fontWeight: 900, letterSpacing: "0.16em", margin: 0 }}>ADMIN PANEL</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { icon: <LayoutDashboard size={16} />, label: "Control Center", tab: "dashboard" },
                        { icon: <Users size={16} />, label: "User Management", tab: "users" },
                        { icon: <Flag size={16} />, label: "Moderation", tab: "drops" },
                        { icon: <BarChart3 size={16} />, label: "Analytics", tab: "analytics" },
                        { icon: <ShieldCheck size={16} />, label: "Settings", tab: "settings" },
                      ].map(item => (
                        <Link key={item.label} to={`${createPageUrl("AdminCenter")}?tab=${item.tab}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/10" style={{ color: "#E8EEF8" }}>
                          <span style={{ color: "#FFD000" }}>{item.icon}</span> {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => { setMenuOpen(false); base44.auth.logout(); }} className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold transition-all active:scale-[0.98]" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ff6b6b", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); window.location.href = createPageUrl("Feed"); }}
                className="w-full rounded-full py-4 font-black flex items-center justify-center gap-2.5 active:scale-[0.96] transition"
                style={{
                  background: "linear-gradient(135deg, #FFD000 0%, #FFA300 50%, #FF9F1A 100%)",
                  color: "#0B0F1A",
                  boxShadow: "0 12px 32px rgba(255,208,0,0.4), 0 0 24px rgba(255,208,0,0.2)",
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: "0.05em"
                }}
              >
                <Zap size={18} style={{ strokeWidth: 2.5 }} /> SWITCH IT ON
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}