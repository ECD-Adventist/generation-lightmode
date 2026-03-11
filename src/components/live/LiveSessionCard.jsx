import React from "react";

export default function LiveSessionCard({ session, onJoin }) {
  return (
    <div className="bg-[#121826] border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-bold mb-3">LIVE NOW</div>
        <h3 className="text-xl font-bold text-white">{session.title}</h3>
        {session.description && <p className="text-gray-400 mt-2 text-sm leading-relaxed">{session.description}</p>}
      </div>
      <div className="text-xs text-gray-500">Hosted by {session.broadcaster_email}</div>
      <button onClick={onJoin} className="px-4 py-3 rounded-2xl bg-[#00CFFF] text-black font-semibold hover:bg-white transition">Join stream</button>
    </div>
  );
}