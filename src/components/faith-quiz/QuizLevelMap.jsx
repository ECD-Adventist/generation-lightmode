import React from "react";
import { Lock, Star, Zap, Play, Check } from "lucide-react";
import { QUIZ_LEVELS } from "./quizLevels";

export default function QuizLevelMap({ unlockedLevel, starsByLevel, onPlay }) {
  return (
    <div className="flex flex-col gap-3">
      {QUIZ_LEVELS.map(level => {
        const locked = level.level > unlockedLevel;
        const stars = starsByLevel[String(level.level)] || 0;
        const cleared = stars > 0;

        return (
          <button
            key={level.level}
            type="button"
            disabled={locked}
            onClick={() => onPlay(level.level)}
            className="flex w-full min-w-0 items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.99] md:p-4"
            style={{
              background: locked ? "#F1F4F9" : cleared ? "linear-gradient(135deg, #FFFFFF 0%, #F4FAFF 100%)" : "#FFFFFF",
              border: `1px solid ${locked ? "#E3E8F0" : cleared ? "#B8E5FF" : "#E6ECF5"}`,
              opacity: locked ? 0.75 : 1,
              cursor: locked ? "not-allowed" : "pointer",
              boxShadow: locked ? "none" : "0 4px 14px rgba(11, 63, 217, 0.07)",
            }}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
              style={{
                background: locked ? "#E3E8F0" : "linear-gradient(135deg, #1FB8FF, #0B3FD9)",
                color: "#FFFFFF",
              }}
            >
              {locked ? <Lock size={18} /> : level.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 15, color: locked ? "#8A97B5" : "#0B1B3D" }}>
                  Level {level.level} · {level.title}
                </span>
                {cleared && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A", fontSize: 10, fontWeight: 800 }}>
                    <Check size={10} /> CLEARED
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#6B7FA0", marginTop: 2 }}>
                {locked
                  ? `Score ${QUIZ_LEVELS[level.level - 2]?.passScore}+ on Level ${level.level - 1} to unlock`
                  : `${level.subtitle} · ${level.questions.length} questions`}
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="inline-flex items-center gap-1" style={{ color: "#CC7A00", fontSize: 11, fontWeight: 800 }}>
                  <Zap size={11} /> {level.xpPerQuestion} XP / answer
                </span>
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3].map(s => (
                    <Star key={s} size={12} color={s <= stars ? "#FFC107" : "#D9E1EC"} fill={s <= stars ? "#FFC107" : "#D9E1EC"} />
                  ))}
                </span>
              </div>
            </div>

            {!locked && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(31,184,255,0.12)", color: "#0B3FD9" }}>
                <Play size={14} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}