import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trophy, Star, ChevronRight, RotateCcw, Home, Zap, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import AppTopNav from "@/components/AppTopNav";
import AppFooter from "@/components/AppFooter";

// Quiz questions generated from Keep It 100 content
const QUIZ_QUESTIONS = [
  { id: "q1", question: "What does 'Keeping It 100' mean in the context of faith?", options: ["Being 100% perfect", "Being completely honest, real and authentic with God", "Scoring 100% on Bible tests", "Attending church 100 times"], correct: 1, slogan: "Keeping it 100 means being real, honest, and true—no pretending, no fakeness.", reference: "John 8:32" },
  { id: "q2", question: "Which Bible verse says 'Do not conform to the pattern of this world'?", options: ["John 3:16", "Philippians 4:13", "Romans 12:2", "Proverbs 4:23"], correct: 2, slogan: "Stand Out, Don't Blend In!", reference: "Romans 12:2" },
  { id: "q3", question: "\"Purity is Power\" is about...", options: ["Physical strength", "Honoring God with your body and living set apart", "Being better than others", "Following strict rules"], correct: 1, slogan: "Honor God with your body and live set apart for Him.", reference: "1 Corinthians 6:18-20" },
  { id: "q4", question: "According to 'Guard Your Heart', what does Proverbs 4:23 say you should guard?", options: ["Your money", "Your reputation", "Your heart", "Your words"], correct: 2, slogan: "Your purity today shapes your future tomorrow.", reference: "Proverbs 4:23" },
  { id: "q5", question: "What is your body described as in 1 Corinthians 3:16?", options: ["A house of sin", "God's Temple", "A borrowed vessel", "A temporary shell"], correct: 1, slogan: "God dwells in you—honor Him in every way.", reference: "1 Corinthians 3:16" },
  { id: "q6", question: "\"True Love Waits\" encourages youth to...", options: ["Wait for the perfect person", "Wait on God's plan for love and not settle for less", "Take time before dating", "Find love in church only"], correct: 1, slogan: "God's plan for love is worth the wait—don't settle for less.", reference: "1 Thessalonians 4:3-5" },
  { id: "q7", question: "What does 'Iron Sharpens Iron' (Proverbs 27:17) mean?", options: ["You need to be tough like iron", "Real friends help you grow spiritually", "Competition makes you better", "Hard work pays off"], correct: 1, slogan: "Real friends help you grow spiritually.", reference: "Proverbs 27:17" },
  { id: "q8", question: "\"Victory Begins in the Mind\" — what should you guard according to Philippians 4:8?", options: ["Your schedule", "Your finances", "Your thoughts", "Your friendships"], correct: 2, slogan: "Guard your thoughts, and you will guard your actions.", reference: "Philippians 4:8" },
  { id: "q9", question: "In 2 Corinthians 5:17, what happens to anyone who is in Christ?", options: ["They become perfect", "They become a new creation", "They get all blessings", "They never face trouble"], correct: 1, slogan: "God redeems, restores, and makes all things new.", reference: "2 Corinthians 5:17" },
  { id: "q10", question: "What does 'Think Before You Click' remind us about social media?", options: ["Protect your privacy", "Words have power—use them wisely", "Avoid all social media", "Post more inspirational content"], correct: 1, slogan: "Words have power—use them wisely.", reference: "Proverbs 18:21" },
];

export default function FaithQuiz() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home"); // home | quiz | result
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
    });
  }, []);

  const { data: leaderboard = [], isLoading: leaderLoading } = useQuery({
    queryKey: ["quizLeaderboard"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      const users = res.data || [];
      return users
        .filter(u => (u.quiz_score || 0) > 0)
        .sort((a, b) => (b.quiz_score || 0) - (a.quiz_score || 0))
        .slice(0, 10);
    },
  });

  const question = QUIZ_QUESTIONS[currentQ];

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === question.correct;
    setTimeout(() => {
      const newAnswers = [...answers, { qId: question.id, correct: isCorrect }];
      setAnswers(newAnswers);
      if (currentQ + 1 < QUIZ_QUESTIONS.length) {
        setCurrentQ(currentQ + 1);
        setSelected(null);
      } else {
        const finalScore = newAnswers.filter(a => a.correct).length;
        setScore(finalScore);
        setScreen("result");
        if (user) {
          const earnedXP = finalScore * 10;
          const newQuizScore = Math.max(user.quiz_score || 0, finalScore * 10);
          base44.auth.updateMe({ 
            glow_score: (user.glow_score || 0) + earnedXP,
            quiz_score: newQuizScore
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["quizLeaderboard"] });
          });
          if (finalScore === QUIZ_QUESTIONS.length) toast.success("🏆 Perfect Score! LightMode Champion!");
          else if (finalScore >= 7) toast.success(`⚡ Great job! +${earnedXP} XP earned!`);
        }
      }
    }, 900);
  };

  const resetQuiz = () => {
    setScreen("home");
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setScore(0);
  };

  const startQuiz = () => {
    setScreen("quiz");
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setScore(0);
  };

  const medalColors = ["#FFD000", "#C0C0C0", "#CD7F32"];

  return (
    <div style={{ background: "#F6F8FC", minHeight: "100vh", fontFamily: "Inter, sans-serif", color: "#0B1B3D" }}>
      <AppTopNav />
      {/* Sub-nav */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E6ECF5", padding: "12px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to={createPageUrl("Feed")} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#4A5878", fontSize: 14, fontWeight: 600 }}>
            <Home size={16} /> Back to Feed
          </Link>
          <span style={{ color: "#0B3FD9", fontWeight: 800, fontSize: 16, fontFamily: "Space Grotesk, sans-serif" }}>💯 Faith Quiz</span>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,208,0,0.12)", border: "1px solid #FFE4A0", borderRadius: 999, padding: "5px 14px" }}>
              <Zap size={14} color="#CC7A00" />
              <span style={{ color: "#CC7A00", fontWeight: 700, fontSize: 13 }}>{user.glow_score || 0} XP</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        {screen === "home" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
            {/* Left: Quiz intro */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.12)", border: "1px solid #FFE4A0", borderRadius: 999, padding: "7px 18px", marginBottom: 24 }}>
                <span style={{ color: "#CC7A00", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em" }}>💯 KEEPING IT 100 CHALLENGE</span>
              </div>
              <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.05, marginBottom: 16, color: "#0B1B3D" }}>
                Faith <span style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Quiz</span>
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 32, color: "#4A5878" }}>
                Test your knowledge on the "Keeping It 100" truths. 10 questions covering purity, identity, faith, and more. Each correct answer earns you <strong style={{ color: "#CC7A00" }}>10 XP</strong> towards the LightMode Champion leaderboard!
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
                {[
                  { label: "10 Questions", icon: "📖" },
                  { label: "10 XP per Answer", icon: "⚡" },
                  { label: "Bible-Based", icon: "✝️" },
                  { label: "Instant Results", icon: "🏆" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <span style={{ color: "#0B1B3D", fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={startQuiz}
                style={{ fontSize: 18, padding: "16px 40px", width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, borderRadius: 999, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}
              >
                Start the Quiz 🔥
              </button>
            </div>

            {/* Right: Leaderboard */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 24, padding: "28px", position: "sticky", top: 90, boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <Trophy size={20} color="#CC7A00" />
                <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 20, color: "#CC7A00" }}>LightMode Champions</h3>
              </div>
              {leaderLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Loader2 className="animate-spin" size={24} color="#1FB8FF" /></div>
              ) : leaderboard.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "#8A97B5" }}>
                  <Trophy size={36} style={{ margin: "0 auto 12px", display: "block" }} />
                  <p style={{ fontSize: 14 }}>No champions yet. Be the first!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {leaderboard.map((u, i) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: i < 3 ? "rgba(255,208,0,0.06)" : "#F6F8FC", border: `1px solid ${i < 3 ? "#FFE4A0" : "#E6ECF5"}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < 3 ? `${medalColors[i]}20` : "#EEF3FF", border: `2px solid ${i < 3 ? medalColors[i] : "#E6ECF5"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: i < 3 ? medalColors[i] : "#8A97B5", flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0B1B3D" }}>{u.full_name || "Anonymous"}</div>
                        <div style={{ fontSize: 11, color: "#6B7FA0" }}>{u.country || "Global"}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#CC7A00", fontWeight: 800, fontSize: 14, fontFamily: "Space Grotesk, sans-serif", flexShrink: 0 }}>
                        <Zap size={12} /> {u.quiz_score || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "quiz" && question && (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            {/* Progress */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "#4A5878", fontSize: 14, fontWeight: 600 }}>Question {currentQ + 1} of {QUIZ_QUESTIONS.length}</span>
                <span style={{ color: "#CC7A00", fontSize: 14, fontWeight: 700 }}>{answers.filter(a => a.correct).length} correct</span>
              </div>
              <div style={{ height: 6, background: "#EEF3FF", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((currentQ) / QUIZ_QUESTIONS.length) * 100}%`, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", borderRadius: 999, transition: "width 0.4s ease" }} />
              </div>
            </div>

            {/* Question Card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 24, padding: "36px 32px", marginBottom: 20, boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
              <div style={{ display: "inline-block", background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF", borderRadius: 999, padding: "5px 14px", marginBottom: 20 }}>
                <span style={{ color: "#0B3FD9", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>💯 Keep It 100</span>
              </div>
              <h2 style={{ color: "#0B1B3D", fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.3, marginBottom: 28 }}>
                {question.question}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {question.options.map((opt, idx) => {
                  let bg = "#F6F8FC";
                  let border = "#E6ECF5";
                  let color = "#0B1B3D";
                  if (selected !== null) {
                    if (idx === question.correct) { bg = "rgba(34,197,94,0.1)"; border = "rgba(34,197,94,0.5)"; color = "#16A34A"; }
                    else if (idx === selected && idx !== question.correct) { bg = "rgba(239,68,68,0.1)"; border = "rgba(239,68,68,0.5)"; color = "#DC2626"; }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selected !== null}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "16px 20px", borderRadius: 14,
                        background: bg, border: `1px solid ${border}`,
                        color, cursor: selected !== null ? "default" : "pointer",
                        textAlign: "left", fontSize: 15, fontWeight: 600, fontFamily: "Inter, sans-serif",
                        transition: "all 0.25s", width: "100%"
                      }}
                    >
                      <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFFFFF", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0, color: "#0B3FD9" }}>
                        {["A","B","C","D"][idx]}
                      </span>
                      {opt}
                      {selected !== null && idx === question.correct && <CheckCircle size={18} color="#16A34A" style={{ marginLeft: "auto" }} />}
                      {selected !== null && idx === selected && idx !== question.correct && <XCircle size={18} color="#DC2626" style={{ marginLeft: "auto" }} />}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 14, background: "rgba(255,208,0,0.06)", border: "1px solid #FFE4A0" }}>
                  <p style={{ color: "#CC7A00", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>💯 Keep It 100 Truth:</p>
                  <p style={{ color: "#4A5878", fontSize: 14, lineHeight: 1.6 }}>{question.slogan}</p>
                  <p style={{ color: "#0B3FD9", fontSize: 12, fontWeight: 700, marginTop: 6 }}>📖 {question.reference}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "result" && (
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 28, padding: "48px 40px", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>
                {score === QUIZ_QUESTIONS.length ? "🏆" : score >= 7 ? "🌟" : score >= 5 ? "⚡" : "📖"}
              </div>
              <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 36, color: "#0B3FD9", marginBottom: 8 }}>
                {score === QUIZ_QUESTIONS.length ? "LightMode Champion!" : score >= 7 ? "Faith Warrior!" : score >= 5 ? "Truth Seeker!" : "Keep Studying!"}
              </h2>
              <p style={{ color: "#4A5878", fontSize: 16, marginBottom: 28 }}>
                You got <strong style={{ color: "#0B1B3D" }}>{score}</strong> out of <strong style={{ color: "#0B1B3D" }}>{QUIZ_QUESTIONS.length}</strong> correct
              </p>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 32 }}>
                <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 14, padding: "16px 24px" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#16A34A", fontFamily: "Space Grotesk, sans-serif" }}>{score}</div>
                  <div style={{ fontSize: 11, color: "#6B7FA0", fontWeight: 700, textTransform: "uppercase" }}>Correct</div>
                </div>
                <div style={{ background: "rgba(255,208,0,0.08)", border: "1px solid #FFE4A0", borderRadius: 14, padding: "16px 24px" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#CC7A00", fontFamily: "Space Grotesk, sans-serif" }}>+{score * 10}</div>
                  <div style={{ fontSize: 11, color: "#6B7FA0", fontWeight: 700, textTransform: "uppercase" }}>XP Earned</div>
                </div>
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "16px 24px" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#DC2626", fontFamily: "Space Grotesk, sans-serif" }}>{QUIZ_QUESTIONS.length - score}</div>
                  <div style={{ fontSize: 11, color: "#6B7FA0", fontWeight: 700, textTransform: "uppercase" }}>Missed</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={resetQuiz} style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 999, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}>
                  <RotateCcw size={16} /> Try Again
                </button>
                <Link to={createPageUrl("KeepIt100")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 999, background: "rgba(31, 184, 255, 0.08)", border: "1px solid #B8E5FF", color: "#0B3FD9", fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "Inter, sans-serif" }}>
                  See All Slogans
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
}