import { useState, useRef, useEffect } from "react";
import { Send, Zap, RefreshCw } from "lucide-react";
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

export default function Assistant() {
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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

    const conversationHistory = newMessages
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

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

  const reset = () => {
    setMessages([initialMessage]);
    setInput("");
  };

  return (
    <div style={{ background: "#0B0F1A", minHeight: "calc(100vh - 72px)", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <section style={{ padding: "60px 24px 40px", textAlign: "center", background: "linear-gradient(180deg, #121826 0%, #0B0F1A 100%)", borderBottom: "1px solid rgba(0,207,255,0.1)" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0,207,255,0.3), rgba(138,92,255,0.3))",
            border: "2px solid rgba(0,207,255,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 30px rgba(0,207,255,0.4)",
            margin: "0 auto",
          }}>
            <Zap size={36} color="#00CFFF" fill="#00CFFF" style={{ filter: "drop-shadow(0 0 8px #00CFFF)" }} />
          </div>
          <div style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 10px #00CFFF", border: "2px solid #0B0F1A" }} />
        </div>
        <h1 className="glm-headline" style={{ fontSize: "clamp(24px, 4vw, 42px)", marginBottom: 10 }}>
          LightMode <span className="glm-gradient-text">Assistant</span>
        </h1>
        <p className="glm-body" style={{ fontSize: 15, maxWidth: 500, margin: "0 auto" }}>
          Your AI guide to the movement — ask about challenges, GlowGroups, Bible verses, and more.
        </p>
      </section>

      {/* CHAT */}
      <div style={{ flex: 1, maxWidth: 800, width: "100%", margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column" }}>
        {/* Messages */}
        <div style={{ flex: 1, padding: "32px 0", display: "flex", flexDirection: "column", gap: 20, minHeight: 400 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 12 }}>
              {msg.role === "assistant" && (
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(0,207,255,0.3), rgba(138,92,255,0.3))",
                  border: "1px solid rgba(0,207,255,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Zap size={16} color="#00CFFF" />
                </div>
              )}
              <div style={{
                maxWidth: "75%",
                padding: "14px 18px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #00CFFF, #8A5CFF)"
                  : "#121826",
                border: msg.role === "user" ? "none" : "1px solid rgba(0,207,255,0.15)",
                color: "#FFFFFF",
                fontSize: 15,
                lineHeight: 1.6,
                fontFamily: "Inter, sans-serif",
                whiteSpace: "pre-wrap",
                boxShadow: msg.role === "user" ? "0 0 20px rgba(0,207,255,0.3)" : "none",
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,207,255,0.3), rgba(138,92,255,0.3))", border: "1px solid rgba(0,207,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={16} color="#00CFFF" />
              </div>
              <div style={{ background: "#121826", border: "1px solid rgba(0,207,255,0.15)", borderRadius: "18px 18px 18px 4px", padding: "16px 20px", display: "flex", gap: 6, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#00CFFF", animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ paddingBottom: 24 }}>
            <p className="glm-body" style={{ fontSize: 13, marginBottom: 12, textAlign: "center" }}>Try asking:</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  padding: "8px 16px", borderRadius: 50,
                  background: "rgba(0,207,255,0.06)", border: "1px solid rgba(0,207,255,0.2)",
                  color: "#C8D0E0", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif",
                  transition: "all 0.2s",
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(0,207,255,0.5)"; e.currentTarget.style.color = "#00CFFF"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(0,207,255,0.2)"; e.currentTarget.style.color = "#C8D0E0"; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ paddingBottom: 32, display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={reset} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: "#C8D0E0", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(0,207,255,0.4)"; e.currentTarget.style.color = "#00CFFF"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#C8D0E0"; }}>
            <RefreshCw size={16} />
          </button>
          <div style={{ flex: 1, display: "flex", background: "#121826", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 50, overflow: "hidden", transition: "border-color 0.2s" }}
            onFocusCapture={e => e.currentTarget.style.borderColor = "rgba(0,207,255,0.6)"}
            onBlurCapture={e => e.currentTarget.style.borderColor = "rgba(0,207,255,0.2)"}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask the LightMode Assistant..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#FFFFFF", fontSize: 15, padding: "14px 20px", fontFamily: "Inter, sans-serif" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() ? "linear-gradient(90deg, #00CFFF, #8A5CFF)" : "transparent",
                border: "none", borderRadius: "0 50px 50px 0",
                padding: "0 20px", cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
              <Send size={18} color={input.trim() ? "#0B0F1A" : "#C8D0E0"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}