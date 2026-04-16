import React, { useState } from "react";
import { Sparkles, ArrowRight, RefreshCw, Share2, Zap, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/* ─────────────── Quiz Data ─────────────── */
const questions = [
  {
    q: "When your friends are making a tough choice, you tend to…",
    options: [
      { label: "Speak up boldly with Scripture", style: "prophet" },
      { label: "Listen deeply, then encourage", style: "shepherd" },
      { label: "Make it fun while pointing to Christ", style: "creator" },
      { label: "Organize a way to help them practically", style: "builder" },
    ],
  },
  {
    q: "Your ideal way to share your faith online is…",
    options: [
      { label: "Powerful short videos or posts with truth", style: "creator" },
      { label: "Writing testimonies and long reflections", style: "prophet" },
      { label: "DM’ing friends one-on-one to talk & pray", style: "shepherd" },
      { label: "Starting a group or challenge", style: "builder" },
    ],
  },
  {
    q: "Which sounds most like you on a Sabbath afternoon?",
    options: [
      { label: "Leading a small Bible discussion", style: "prophet" },
      { label: "Visiting / calling someone who's struggling", style: "shepherd" },
      { label: "Creating content, music, or art for God", style: "creator" },
      { label: "Planning the next outreach event", style: "builder" },
    ],
  },
  {
    q: "The gift you feel God has wired you with is…",
    options: [
      { label: "Teaching truth clearly", style: "prophet" },
      { label: "Compassion & counsel", style: "shepherd" },
      { label: "Creativity & storytelling", style: "creator" },
      { label: "Leadership & organization", style: "builder" },
    ],
  },
  {
    q: "The best compliment someone could give you is…",
    options: [
      { label: "\"You helped me understand God better.\"", style: "prophet" },
      { label: "\"You really saw me when I was hurting.\"", style: "shepherd" },
      { label: "\"Your post inspired me to trust Jesus.\"", style: "creator" },
      { label: "\"You made something amazing happen for our community.\"", style: "builder" },
    ],
  },
];

const archetypes = {
  prophet: {
    name: "The Truth Bearer",
    emoji: "📖",
    color: "#00CFFF",
    glow: "rgba(0,207,255,0.35)",
    tagline: "You speak truth that wakes people up.",
    description: "You carry a fire for Scripture and are wired to proclaim what's real. Your glow shines brightest when you teach, write, or stand for God's truth in a culture full of noise.",
    recommendations: [
      "Start a weekly Scripture breakdown series on your socials",
      "Join a Bible Study leader track in your GlowGroup",
      "Write testimonies and post them as Glow Drops",
      "Mentor younger believers in doctrine",
    ],
    nextAction: "Submit Your First Glow Drop",
    nextLink: "Dashboard",
  },
  shepherd: {
    name: "The Soul Healer",
    emoji: "🫶",
    color: "#8A5CFF",
    glow: "rgba(138,92,255,0.35)",
    tagline: "You see people — and your presence heals.",
    description: "Your glow is quiet but deep. You notice the one who's hurting and walk with them. God has given you the ministry of presence, compassion, and prayer.",
    recommendations: [
      "Become a prayer partner on the Prayer Wall",
      "Lead a small Glow Group focused on care & check-ins",
      "Reach out weekly to someone who's drifted from faith",
      "Share vulnerable testimonies that make others feel seen",
    ],
    nextAction: "Join The Prayer Wall",
    nextLink: "PrayerWall",
  },
  creator: {
    name: "The Light Creative",
    emoji: "🎨",
    color: "#FFD000",
    glow: "rgba(255,208,0,0.35)",
    tagline: "Your creativity makes faith impossible to scroll past.",
    description: "You're wired to make Jesus visible through art, media, music, or storytelling. Your glow floods the feed with beauty that points back to Christ.",
    recommendations: [
      "Create short videos for the LightMode challenges",
      "Post weekly faith reels, reflections or designs",
      "Join the Media & Creators GlowGroup",
      "Use your craft to amplify Daily Truth Drops",
    ],
    nextAction: "Take The Daily Challenge",
    nextLink: "Challenges",
  },
  builder: {
    name: "The Movement Builder",
    emoji: "⚡",
    color: "#FFA500",
    glow: "rgba(255,165,0,0.35)",
    tagline: "You were made to gather people and light whole cities.",
    description: "You have the heart of a mobilizer. You see possibilities, organize people, and turn vision into action. Your glow multiplies every time others catch it.",
    recommendations: [
      "Launch or lead a GlowGroup in your city",
      "Run a LightMode Challenge on your campus/church",
      "Recruit 5 new youth onto the platform",
      "Coordinate outreach & evangelism events",
    ],
    nextAction: "Start A GlowGroup",
    nextLink: "GlowGroups",
  },
};

/* ─────────────── Component ─────────────── */
export default function LightModeQuotientQuiz() {
  const [step, setStep] = useState(-1); // -1 = intro, 0..N = questions, N+1 = result
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const startQuiz = () => { setStep(0); setAnswers([]); setResult(null); };

  const handleAnswer = (style) => {
    const newAnswers = [...answers, style];
    if (step + 1 < questions.length) {
      setAnswers(newAnswers);
      setStep(step + 1);
    } else {
      // Tally
      const counts = newAnswers.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {});
      const topStyle = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setResult(archetypes[topStyle]);
      setAnswers(newAnswers);
      setStep(questions.length);
    }
  };

  const resetQuiz = () => { setStep(-1); setAnswers([]); setResult(null); };

  const shareResult = async () => {
    if (!result) return;
    const text = `I just discovered my LightMode Quotient — I'm ${result.name} ${result.emoji}!\n\n"${result.tagline}"\n\nTake the quiz: ${window.location.origin}/#quiz`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(text); alert("Result copied to clipboard!"); } catch { /* ignore */ }
    }
  };

  const progress = step >= 0 && step < questions.length ? ((step + 1) / questions.length) * 100 : 0;

  return (
    <section id="quiz" style={{
      position: "relative", overflow: "hidden",
      padding: "clamp(70px, 10vw, 120px) clamp(20px, 5vw, 60px)",
      background: "linear-gradient(180deg, #0B0F1A 0%, #0D1424 50%, #0B0F1A 100%)",
    }}>
      {/* Ambient glows */}
      <div style={{ position: "absolute", top: "10%", left: "-5%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,207,255,0.08), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "5%", right: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,0,0.06), transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 820, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 18 }}>
            <Sparkles size={12} color="#FFD000" />
            <span style={{ color: "#FFD000", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>Interactive Quiz</span>
          </div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(30px, 4.5vw, 54px)", letterSpacing: "-0.02em", color: "#FFFFFF", marginBottom: 14, lineHeight: 1.05 }}>
            Discover Your{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000 0%, #00CFFF 60%, #8A5CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              LightMode Quotient
            </span>
          </h2>
          <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif", lineHeight: 1.6, maxWidth: 540, margin: "0 auto" }}>
            A 5-question quiz to reveal your unique 'glow style' — and how God has wired you to light up your community.
          </p>
        </div>

        {/* Quiz Body */}
        <div style={{
          background: "linear-gradient(160deg, rgba(18,24,38,0.85) 0%, rgba(11,15,26,0.95) 100%)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(0,207,255,0.15)",
          borderRadius: 24,
          padding: "clamp(26px, 4vw, 44px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 0 60px rgba(0,207,255,0.08)",
          minHeight: 380,
          position: "relative",
        }}>
          {/* ── INTRO ── */}
          {step === -1 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 58, marginBottom: 18, filter: "drop-shadow(0 0 20px rgba(255,208,0,0.5))" }}>✨</div>
              <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 26, color: "#FFFFFF", marginBottom: 12 }}>
                Ready to find your glow?
              </h3>
              <p style={{ color: "#C8D0E0", fontSize: 15, fontFamily: "Inter, sans-serif", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 32px" }}>
                5 quick questions. 1 personalized result. Unlock how you can best serve God in your generation.
              </p>
              <button onClick={startQuiz} style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A",
                fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 15,
                padding: "14px 32px", borderRadius: 999, border: "none", cursor: "pointer",
                boxShadow: "0 0 30px rgba(255,208,0,0.4)", transition: "all 0.3s",
              }}
                onMouseOver={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 0 45px rgba(255,208,0,0.6)"; }}
                onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(255,208,0,0.4)"; }}
              >
                <Zap size={16} /> Start The Quiz
              </button>
              <p style={{ color: "#4A5568", fontSize: 12, marginTop: 18, fontFamily: "Inter, sans-serif" }}>⏱ Takes about 60 seconds</p>
            </div>
          )}

          {/* ── QUESTIONS ── */}
          {step >= 0 && step < questions.length && (
            <div>
              {/* Progress */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <span style={{ color: "#00CFFF" }}>Question {step + 1} of {questions.length}</span>
                  <span style={{ color: "#8A9BB0" }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #00CFFF, #8A5CFF, #FFD000)", transition: "width 0.5s ease", boxShadow: "0 0 10px rgba(0,207,255,0.5)" }} />
                </div>
              </div>

              <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "clamp(18px, 2.3vw, 24px)", color: "#FFFFFF", marginBottom: 24, lineHeight: 1.35 }}>
                {questions[step].q}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {questions[step].options.map((opt, i) => (
                  <button key={i} onClick={() => handleAnswer(opt.style)} style={{
                    textAlign: "left",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#E0E8F0",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 15,
                    padding: "16px 20px",
                    borderRadius: 14,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: 12,
                  }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = "rgba(0,207,255,0.08)";
                      e.currentTarget.style.borderColor = "rgba(0,207,255,0.4)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,207,255,0.15)", border: "1px solid rgba(0,207,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 12, color: "#00CFFF", flexShrink: 0 }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── RESULT ── */}
          {step === questions.length && result && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{
                width: 96, height: 96, margin: "0 auto 20px",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${result.color}30, rgba(11,15,26,0.8))`,
                border: `2px solid ${result.color}60`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 44,
                boxShadow: `0 0 50px ${result.glow}`,
              }}>
                {result.emoji}
              </div>
              <div style={{ fontSize: 10, color: result.color, fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
                Your LightMode Style
              </div>
              <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(26px, 3.5vw, 38px)", color: "#FFFFFF", marginBottom: 10 }}>
                {result.name}
              </h3>
              <p style={{ color: result.color, fontSize: 15, fontFamily: "Inter, sans-serif", fontStyle: "italic", marginBottom: 22, fontWeight: 500 }}>
                "{result.tagline}"
              </p>
              <p style={{ color: "#C8D0E0", fontSize: 15, fontFamily: "Inter, sans-serif", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 28px" }}>
                {result.description}
              </p>

              {/* Recommendations */}
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${result.color}25`,
                borderRadius: 16, padding: "22px 24px",
                textAlign: "left", maxWidth: 560, margin: "0 auto 28px",
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: result.color, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif", marginBottom: 14 }}>
                  Personalized Recommendations
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.recommendations.map((rec, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <Check size={16} color={result.color} style={{ marginTop: 3, flexShrink: 0 }} />
                      <span style={{ color: "#E0E8F0", fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.5 }}>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <Link to={createPageUrl(result.nextLink)} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: `linear-gradient(135deg, ${result.color}, ${result.color}DD)`,
                  color: "#0B0F1A", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
                  fontSize: 14, padding: "13px 24px", borderRadius: 999, textDecoration: "none",
                  boxShadow: `0 0 24px ${result.glow}`, transition: "all 0.3s",
                }}
                  onMouseOver={e => e.currentTarget.style.transform = "scale(1.04)"}
                  onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  {result.nextAction} <ArrowRight size={14} />
                </Link>
                <button onClick={shareResult} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.06)", color: "#FFFFFF",
                  fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14,
                  padding: "12px 22px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer", transition: "all 0.3s",
                }}
                  onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                  onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                >
                  <Share2 size={14} /> Share
                </button>
                <button onClick={resetQuiz} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "transparent", color: "#8A9BB0",
                  fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13,
                  padding: "12px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer", transition: "all 0.3s",
                }}
                  onMouseOver={e => { e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                  onMouseOut={e => { e.currentTarget.style.color = "#8A9BB0"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                >
                  <RefreshCw size={13} /> Retake
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}