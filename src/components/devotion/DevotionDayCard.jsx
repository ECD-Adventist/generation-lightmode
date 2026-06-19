import React, { useState } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import DevotionShareButton from "@/components/devotion/DevotionShareButton";

export default function DevotionDayCard({ day, isCompleted, isActive, existingReflection, color, onToggle, onComplete, isSubmitting }) {
  const [reflection, setReflection] = useState(existingReflection || "");

  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={isCompleted ? { background: "#FFFFFF", border: "1px solid #E6ECF5", opacity: 0.8 } : { background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        {isCompleted ? (
          <CheckCircle className="w-6 h-6 shrink-0" style={{ color }} />
        ) : (
          <Circle className="w-6 h-6 shrink-0" style={{ color: "#C0C8D8" }} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Day {day.day}</span>
            <span className="text-sm font-bold" style={{ color: "#0B1B3D" }}>{day.verse}</span>
          </div>
          <p className="text-sm mt-1 line-clamp-1" style={{ color: "#6B7FA0" }}>{day.text}</p>
        </div>
        {isActive ? <ChevronUp className="w-5 h-5 shrink-0" style={{ color: "#8A97B5" }} /> : <ChevronDown className="w-5 h-5 shrink-0" style={{ color: "#8A97B5" }} />}
      </button>

      {isActive && (
        <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: "#E6ECF5" }}>
          <div className="rounded-xl p-4 mt-4 mb-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="text-sm font-bold" style={{ color }}>{day.verse}</p>
              <DevotionShareButton verse={day.verse} text={day.text} reflection={isCompleted ? existingReflection : ""} color={color} />
            </div>
            <p className="text-sm leading-relaxed italic" style={{ color: "#3A4A6B" }}>"{day.text}"</p>
          </div>

          {isCompleted && existingReflection && (
            <div className="rounded-xl p-4 mb-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#8A97B5" }}>Your Reflection</p>
              <p className="text-sm" style={{ color: "#3A4A6B" }}>{existingReflection}</p>
            </div>
          )}

          {!isCompleted && (
            <div className="space-y-3">
              <textarea
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                placeholder="Write your reflection on this verse..."
                className="w-full min-h-[100px] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none"
                style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
              />
              <button
                onClick={() => onComplete(reflection)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: color, color: "#FFFFFF" }}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Complete Day {day.day}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}