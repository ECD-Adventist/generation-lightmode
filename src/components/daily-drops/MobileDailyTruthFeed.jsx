import React from "react";
import { Loader2 } from "lucide-react";
import MobilePageHeader from "@/components/mobile/MobilePageHeader";

/**
 * Mobile daily drops: stacked tabs, single-column cards.
 * Reuses the existing TruthCard component passed in as a render prop.
 */
export default function MobileDailyTruthFeed({ activeTab, setActiveTab, activeDrops, isLoading, TruthCard, handleShare, user }) {
  const tabs = [
    { id: "codes_of_truth", label: "🔐 Codes", accent: "#0B3FD9", bg: "rgba(11,63,217,0.08)", border: "#B8E5FF" },
    { id: "keeping_it_100", label: "💯 Keep 100", accent: "#CC7A00", bg: "rgba(255,208,0,0.1)", border: "#FFE4A0" },
    { id: "daily_verse", label: "📖 Verse", accent: "#8A5CFF", bg: "rgba(138,92,255,0.1)", border: "rgba(138,92,255,0.3)" },
  ];

  return (
    <div className="min-h-screen pb-24 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <MobilePageHeader title="Daily Drops" subtitle="Truth delivered daily" />

      <div className="px-3 pt-4">
        {/* Tab pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition"
              style={activeTab === t.id
                ? { background: t.bg, color: t.accent, border: `1px solid ${t.border}` }
                : { background: "#FFFFFF", color: "#6B7FA0", border: "1px solid #E6ECF5" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin" style={{ color: "#1FB8FF" }} /></div>
        ) : activeDrops.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#8A97B5" }}>
            <div className="text-4xl mb-3">
              {activeTab === "codes_of_truth" ? "🔐" : activeTab === "keeping_it_100" ? "💯" : "📖"}
            </div>
            <p className="text-sm">No daily posts yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Today */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#0B3FD9" }}></div>
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#8A97B5" }}>Today's Pick</span>
              </div>
              <TruthCard drop={activeDrops[0]} onShare={handleShare} user={user} featured />
            </div>

            {activeDrops.length > 1 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 px-1" style={{ color: "#8A97B5" }}>Previous</h3>
                <div className="space-y-3">
                  {activeDrops.slice(1).map((drop) => (
                    <TruthCard key={drop.id} drop={drop} onShare={handleShare} user={user} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}