import React, { useState } from "react";
import { ShieldCheck, PenSquare, Calendar as CalendarIcon } from "lucide-react";
import CustomPostComposer from "./CustomPostComposer";
import ScheduledPostsCalendar from "./ScheduledPostsCalendar";

export default function AdminCustomPostTab({ user }) {
  const [view, setView] = useState("compose"); // "compose" | "calendar"

  if (user?.role !== "super_admin") {
    return (
      <div className="p-8 text-red-400 text-center font-bold">
        Super Admin access required to create custom posts.
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6 font-['Inter']">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-white/10">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FFD000] to-[#FF9F1A]">
          <ShieldCheck className="w-6 h-6 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#FFD000] font-bold uppercase tracking-widest">Super Admin</p>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Custom Posts</h1>
          <p className="text-sm text-gray-400 mt-1">
            Publish official <span className="text-[#FFD000] font-semibold">Generation LightMode</span> posts — instantly or scheduled.
          </p>
        </div>
      </div>

      {/* View switcher */}
      <div className="inline-flex bg-[#121826] border border-white/10 rounded-xl p-1">
        <button
          onClick={() => setView("compose")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition inline-flex items-center gap-2 ${
            view === "compose" ? "bg-[#00CFFF] text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          <PenSquare className="w-4 h-4" /> Compose
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition inline-flex items-center gap-2 ${
            view === "calendar" ? "bg-[#FFD000] text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          <CalendarIcon className="w-4 h-4" /> Calendar
        </button>
      </div>

      {view === "compose" ? <CustomPostComposer /> : <ScheduledPostsCalendar />}
    </div>
  );
}