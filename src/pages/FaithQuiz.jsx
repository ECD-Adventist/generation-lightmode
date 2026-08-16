import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trophy, Star, RotateCcw, Home, Zap, CheckCircle, XCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import AppTopNav from "@/components/AppTopNav";
import AppFooter from "@/components/AppFooter";
import QuizLevelMap from "@/components/faith-quiz/QuizLevelMap";
import { QUIZ_LEVELS, TOTAL_LEVELS, getLevel, starsForScore, parseStars } from "@/components/faith-quiz/quizLevels";

export default function FaithQuiz() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home"); // home | quiz | result
  const [activeLevelNumber, setActiveLevelNumber] = useState(1);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [starsByLevel, setStarsByLevel] = useState({});
  const [justUnlocked, setJustUnlocked] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (!isAuth) return;
      base44.auth.me().then(me => {
        setUser(me);
        setUnlockedLevel(Math.min(Math.max(me?.quiz_level || 1, 1), TOTAL_LEVELS));
        setStarsByLevel(parseStars(me?.quiz_stars));
      });
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

  const activeLevel = useMemo(() => getLevel(activeLevelNumber), [activeLevelNumber]);
  const questions = activeLevel.questions;
  const question = questions[currentQ];
  const earnedStars = starsForScore(score, activeLevel);
  const passed = score >= activeLevel.passScore;
  const totalStars = useMemo(
    () => Object.values(starsByLevel).reduce((sum, s) => sum + (Number(s) || 0), 0),
    [starsByLevel]
  );

  const finishLevel = (finalScore) => {
    setScore(finalScore);
    setScreen("result");

    const stars = starsForScore(finalScore, activeLevel);
    const didPass = finalScore >= activeLevel.passScore;
    const previousStars = Number(starsByLevel[String(activeLevel.level)] || 0);
    const improved = stars > previousStars;
    const nextLevel = didPass && activeLevel.level === unlockedLevel && activeLevel.level < TOTAL_LEVELS
      ? activeLevel.level + 1
      : unlockedLevel;

    setJustUnlocked(nextLevel > unlockedLevel);

    const nextStars = improved
      ? { ...starsByLevel, [String(activeLevel.level)]: stars }
      : starsByLevel;

    setStarsByLevel(nextStars);
    setUnlockedLevel(nextLevel);

    if (!user) return;

    const earnedXP = finalScore * activeLevel.xpPerQuestion;
    const updates = {
      glow_score: (user.glow_score || 0) + earnedXP,
      quiz_level: nextLevel,
      quiz_stars: JSON.stringify(nextStars),
    };
    // Leaderboard score only grows on a genuine personal best for the level.
    if (improved) updates.quiz_score = (user.quiz_score || 0) + earnedXP;

    base44.auth.updateMe(updates).then(() => {
      setUser(prev => ({ ...prev, ...updates }));
      queryClient.invalidateQueries({ queryKey: ["quizLeaderboard"] });
    });

    if (stars === 3) toast.success(`🏆 Perfect! Level ${activeLevel.level} mastered · +${earnedXP} XP`);
    else if (didPass) toast.success(`⚡ Level ${activeLevel.level} cleared · +${earnedXP} XP`);
    else toast.error(`Score ${activeLevel.passScore}+ to clear Level ${activeLevel.level}. Try again!`);
  };

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === question.correct;
    setTimeout(() => {
      const newAnswers = [...answers, { qId: question.id, correct: isCorrect }];
      setAnswers(newAnswers);
      if (currentQ + 1 < questions.length) {
        setCurrentQ(currentQ + 1);
        setSelected(null);
      } else {
        finishLevel(newAnswers.filter(a => a.correct).length);
      }
    }, 900);
  };

  const startLevel = (levelNumber) => {
    if (levelNumber > unlockedLevel) return;
    setActiveLevelNumber(levelNumber);
    setScreen("quiz");
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setScore(0);
    setJustUnlocked(false);
  };

  const backToMap = () => {
    setScreen("home");
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setScore(0);
    setJustUnlocked(false);
  };

  const medalColors = ["#FFD000", "#C0C0C0", "#CD7F32"];
  const nextLevelMeta = QUIZ_LEVELS.find(l => l.level === activeLevel.level + 1);

  return (
    <div style={{ background: "#F6F8FC", minHeight: "100vh", fontFamily: "Inter, sans-serif", color: "#0B1B3D" }}>
      <AppTopNav />
      {/* Sub-nav */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E6ECF5" }} className="px-4 py-3 md:px-6">
        <div style={{ maxWidth: 1100, margin: "0 auto" }} className="flex flex-wrap items-center justify-between gap-2">
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

      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-4 py-8 md:px-6 md:py-12">
        {screen === "home" && (
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-8">
            {/* Left: Level ladder */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.12)", border: "1px solid #FFE4A0", borderRadius: 999, padding: "7px 18px", marginBottom: 20 }}>
                <span style={{ color: "#CC7A00", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em" }}>💯 KEEPING IT 100 CHALLENGE</span>
              </div>
              <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.05, marginBottom: 12, color: "#0B1B3D" }}>
                Faith <span style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Quiz</span>
              </h1>
              <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20, color: "#4A5878" }}>
                {TOTAL_LEVELS} levels. Fresh questions every level, and each one gets harder — and pays more XP. Clear a level to unlock the next and climb the LightMode Champion ladder.
              </p>

              {/* Player progress strip */}
              <div className="mb-6 flex flex-wrap gap-2">
                <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 14, padding: "12px 16px", flex: "1 1 120px", minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#0B3FD9", fontFamily: "Space Grotesk, sans-serif" }}>{unlockedLevel}<span style={{ fontSize: 13, color: "#8A97B5" }}>/{TOTAL_LEVELS}</span></div>
                  <div style={{ fontSize: 10, color: "#6B7FA0", fontWeight: 800, textTransform: "uppercase" }}>Level Reached</div>
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 14, padding: "12px 16px", flex: "1 1 120px", minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#CC7A00", fontFamily: "Space Grotesk, sans-serif" }}>{totalStars}<span style={{ fontSize: 13, color: "#8A97B5" }}>/{TOTAL_LEVELS * 3}</span></div>
                  <div style={{ fontSize: 10, color: "#6B7FA0", fontWeight: 800, textTransform: "uppercase" }}>Stars Earned</div>
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 14, padding: "12px 16px", flex: "1 1 120px", minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#16A34A", fontFamily: "Space Grotesk, sans-serif" }}>{QUIZ_LEVELS.reduce((n, l) => n + l.questions.length, 0)}</div>
                  <div style={{ fontSize: 10, color: "#6B7FA0", fontWeight: 800, textTransform: "uppercase" }}>Questions</div>
                </div>
              </div>

              <QuizLevelMap unlockedLevel={unlockedLevel} starsByLevel={starsByLevel} onPlay={startLevel} />

              <button
                onClick={() => startLevel(unlockedLevel)}
                className="mt-6 w-full"
                style={{ fontSize: 17, padding: "16px 32px", justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, borderRadius: 999, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}
              >
                {unlockedLevel === 1 && totalStars === 0 ? "Start Level 1 🔥" : `Continue Level ${unlockedLevel} 🔥`}
              </button>
              {!user && (
                <p style={{ fontSize: 12, color: "#8A97B5", marginTop: 10, textAlign: "center" }}>
                  Sign in to save your level progress and earn XP.
                </p>
              )}
            </div>

            {/* Right: Leaderboard */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 24, boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }} className="w-full min-w-0 p-4 md:sticky md:top-[90px] md:p-7">
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
                        <div style={{ fontSize: 11, color: "#6B7FA0" }}>{u.country || "Global"}{u.quiz_level ? ` · Level ${u.quiz_level}` : ""}</div>
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
            <div style={{ marginBottom: 28 }}>
              <button onClick={backToMap} className="mb-3 inline-flex items-center gap-1.5" style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7FA0", fontSize: 13, fontWeight: 700, padding: 0 }}>
                <ArrowLeft size={14} /> Level map
              </button>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "#4A5878", fontSize: 14, fontWeight: 600 }}>
                  {activeLevel.icon} Level {activeLevel.level} · Q{currentQ + 1} of {questions.length}
                </span>
                <span style={{ color: "#CC7A00", fontSize: 14, fontWeight: 700 }}>{answers.filter(a => a.correct).length} correct · pass {activeLevel.passScore}</span>
              </div>
              <div style={{ height: 6, background: "#EEF3FF", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(currentQ / questions.length) * 100}%`, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", borderRadius: 999, transition: "width 0.4s ease" }} />
              </div>
            </div>

            {/* Question Card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 24, marginBottom: 20, boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }} className="p-5 md:p-9">
              <div style={{ display: "inline-block", background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF", borderRadius: 999, padding: "5px 14px", marginBottom: 20 }}>
                <span style={{ color: "#0B3FD9", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {activeLevel.title} · {activeLevel.xpPerQuestion} XP
                </span>
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
                        padding: "14px 16px", borderRadius: 14,
                        background: bg, border: `1px solid ${border}`,
                        color, cursor: selected !== null ? "default" : "pointer",
                        textAlign: "left", fontSize: 15, fontWeight: 600, fontFamily: "Inter, sans-serif",
                        transition: "background 0.25s, border-color 0.25s, color 0.25s", width: "100%",
                        minWidth: 0, overflowWrap: "anywhere"
                      }}
                    >
                      <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFFFFF", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0, color: "#0B3FD9" }}>
                        {["A","B","C","D"][idx]}
                      </span>
                      {opt}
                      {selected !== null && idx === question.correct && <CheckCircle size={18} color="#16A34A" style={{ marginLeft: "auto", flexShrink: 0 }} />}
                      {selected !== null && idx === selected && idx !== question.correct && <XCircle size={18} color="#DC2626" style={{ marginLeft: "auto", flexShrink: 0 }} />}
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
            <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 28, boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }} className="p-6 md:p-12">
              <div style={{ fontSize: 64, marginBottom: 8 }}>
                {earnedStars === 3 ? "🏆" : passed ? "🌟" : "📖"}
              </div>

              {/* Stars */}
              <div className="mb-4 flex justify-center gap-1.5">
                {[1, 2, 3].map(s => (
                  <Star key={s} size={30} color={s <= earnedStars ? "#FFC107" : "#E3E8F0"} fill={s <= earnedStars ? "#FFC107" : "#E3E8F0"} />
                ))}
              </div>

              <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(24px, 5vw, 34px)", color: "#0B3FD9", marginBottom: 8 }}>
                {earnedStars === 3 ? `Level ${activeLevel.level} Mastered!` : passed ? `Level ${activeLevel.level} Cleared!` : "Not quite — try again"}
              </h2>
              <p style={{ color: "#4A5878", fontSize: 15, marginBottom: 24 }}>
                You got <strong style={{ color: "#0B1B3D" }}>{score}</strong> of <strong style={{ color: "#0B1B3D" }}>{questions.length}</strong> · pass mark is {activeLevel.passScore}
              </p>

              <div className="mb-7 flex flex-wrap justify-center gap-3">
                <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 14, padding: "14px 22px" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#16A34A", fontFamily: "Space Grotesk, sans-serif" }}>{score}</div>
                  <div style={{ fontSize: 10, color: "#6B7FA0", fontWeight: 800, textTransform: "uppercase" }}>Correct</div>
                </div>
                <div style={{ background: "rgba(255,208,0,0.08)", border: "1px solid #FFE4A0", borderRadius: 14, padding: "14px 22px" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#CC7A00", fontFamily: "Space Grotesk, sans-serif" }}>+{score * activeLevel.xpPerQuestion}</div>
                  <div style={{ fontSize: 10, color: "#6B7FA0", fontWeight: 800, textTransform: "uppercase" }}>XP Earned</div>
                </div>
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "14px 22px" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#DC2626", fontFamily: "Space Grotesk, sans-serif" }}>{questions.length - score}</div>
                  <div style={{ fontSize: 10, color: "#6B7FA0", fontWeight: 800, textTransform: "uppercase" }}>Missed</div>
                </div>
              </div>

              {justUnlocked && nextLevelMeta && (
                <div className="mb-6 rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(31,184,255,0.1), rgba(255,208,0,0.12))", border: "1px solid #B8E5FF" }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#0B3FD9", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>🔓 New Level Unlocked</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#0B1B3D", fontFamily: "Space Grotesk, sans-serif" }}>
                    {nextLevelMeta.icon} Level {nextLevelMeta.level} · {nextLevelMeta.title}
                  </p>
                  <p style={{ fontSize: 12, color: "#4A5878", marginTop: 2 }}>{nextLevelMeta.subtitle} · {nextLevelMeta.xpPerQuestion} XP per answer</p>
                </div>
              )}

              {!passed && activeLevel.level === TOTAL_LEVELS && (
                <p style={{ fontSize: 13, color: "#8A97B5", marginBottom: 16 }}>You're on the final level — sharpen up and go again!</p>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                {justUnlocked && nextLevelMeta ? (
                  <button onClick={() => startLevel(nextLevelMeta.level)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 999, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}>
                    Play Level {nextLevelMeta.level} <ChevronRight size={16} />
                  </button>
                ) : (
                  <button onClick={() => startLevel(activeLevel.level)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 999, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}>
                    <RotateCcw size={16} /> Retry Level {activeLevel.level}
                  </button>
                )}
                <button onClick={backToMap} style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 999, background: "rgba(31, 184, 255, 0.08)", border: "1px solid #B8E5FF", color: "#0B3FD9", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  Level Map
                </button>
                <Link to={createPageUrl("KeepIt100")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 999, background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878", fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "Inter, sans-serif" }}>
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