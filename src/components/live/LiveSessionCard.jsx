import React from "react";

export default function LiveSessionCard({ session, onJoin }) {
  return (
    <div className="rounded-[1.75rem] p-5 flex flex-col gap-4 font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: "rgba(239, 68, 68, 0.08)", color: "#DC2626", border: "1px solid #FCA5A5" }}>LIVE NOW</div>
        <h3 className="text-xl font-bold" style={{ color: "#0B1B3D" }}>{session.title}</h3>
        {session.description && <p className="mt-2 text-sm leading-relaxed" style={{ color: "#6B7FA0" }}>{session.description}</p>}
      </div>
      <div className="text-xs" style={{ color: "#8A97B5" }}>Hosted by {session.broadcaster_email}</div>
      <button onClick={onJoin} className="px-4 py-3 rounded-2xl font-semibold transition" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>Join stream</button>
    </div>
  );
}