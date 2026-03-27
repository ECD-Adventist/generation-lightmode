import React, { useState } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

export default function DevotionDayCard({ day, isCompleted, isActive, existingReflection, color, onToggle, onComplete, isSubmitting }) {
  const [reflection, setReflection] = useState(existingReflection || "");

  return (
    <div className={`bg-[#121826] border rounded-2xl overflow-hidden transition-all ${isCompleted ? "border-white/5 opacity-80" : "border-white/10 hover:border-white/20"}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
        {isCompleted ? (
          <CheckCircle className="w-6 h-6 shrink-0" style={{ color }} />
        ) : (
          <Circle className="w-6 h-6 text-gray-600 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Day {day.day}</span>
            <span className="text-sm font-bold text-white">{day.verse}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1 line-clamp-1">{day.text}</p>
        </div>
        {isActive ? <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />}
      </button>

      {isActive && (
        <div className="px-5 pb-5 pt-0 border-t border-white/5">
          <div className="bg-[#0B0F1A] rounded-xl p-4 mt-4 mb-4 border border-white/5">
            <p className="text-sm font-bold mb-1" style={{ color }}>{day.verse}</p>
            <p className="text-gray-300 text-sm leading-relaxed italic">"{day.text}"</p>
          </div>

          {isCompleted && existingReflection && (
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Your Reflection</p>
              <p className="text-sm text-gray-300">{existingReflection}</p>
            </div>
          )}

          {!isCompleted && (
            <div className="space-y-3">
              <textarea
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                placeholder="Write your reflection on this verse..."
                className="w-full min-h-[100px] rounded-xl bg-[#0B0F1A] border border-white/10 px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#00CFFF]/40 resize-none"
              />
              <button
                onClick={() => onComplete(reflection)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-black disabled:opacity-50"
                style={{ background: color }}
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