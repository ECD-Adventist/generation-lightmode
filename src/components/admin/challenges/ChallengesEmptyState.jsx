import React from "react";
import { Plus, Sparkles } from "lucide-react";
import { CHALLENGE_TEMPLATES } from "./ChallengeTemplates";

export default function ChallengesEmptyState({ onUseTemplate, onCreate, t }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 md:p-12" style={{ background: t.surface, borderColor: t.border }}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(255,208,0,0.12)" }}>
          <Sparkles className="w-8 h-8" style={{ color: "#FFD000" }} />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: t.textPrimary }}>Launch your first challenge</h3>
        <p className="text-sm max-w-md mx-auto" style={{ color: t.textSecondary }}>
          Pick a proven template to get started in seconds, or create your own from scratch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {CHALLENGE_TEMPLATES.map(tpl => (
          <button
            key={tpl.id}
            onClick={() => onUseTemplate(tpl)}
            className="text-left rounded-xl p-4 border transition hover:scale-[1.02]"
            style={{ background: t.surfaceMuted, borderColor: t.border, boxShadow: t.shadow }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: `${tpl.color}22`, border: `1px solid ${tpl.color}44` }}>
              {tpl.icon}
            </div>
            <h4 className="font-bold text-sm mb-1" style={{ color: t.textPrimary }}>{tpl.title}</h4>
            <p className="text-[11px] leading-relaxed mb-3 line-clamp-2" style={{ color: t.textMuted }}>{tpl.description}</p>
            <div className="flex items-center justify-between text-[10px] font-bold pt-2 border-t" style={{ borderColor: t.border }}>
              <span style={{ color: tpl.color }}>+{tpl.points_reward} XP</span>
              <span style={{ color: t.textMuted }}>{tpl.duration_days} days</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button onClick={onCreate} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold border transition hover:opacity-80" style={{ background: t.surfaceMuted, color: t.textPrimary, borderColor: t.border }}>
          <Plus size={14} /> Or start from scratch
        </button>
      </div>
    </div>
  );
}