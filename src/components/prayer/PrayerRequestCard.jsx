import React, { useState } from "react";
import { Heart, MessageCircle, Lock } from "lucide-react";
import PrayerRoomModal from "./PrayerRoomModal";

export default function PrayerRequestCard({ request, requesterName, supportCount, hasPrayed, comments, onPray, onComment, currentUser }) {
  const [draft, setDraft] = useState("");
  const [anonymousComment, setAnonymousComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [prayerRoomOpen, setPrayerRoomOpen] = useState(false);
  const canOpenPrayerRoom = currentUser && !request.is_anonymous && request.user_email && request.user_email !== currentUser.email && hasPrayed;

  return (
    <div className="rounded-[1.75rem] p-5 font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold" style={{ color: "#0B1B3D" }}>{request.is_anonymous ? "Anonymous" : requesterName}</div>
          <div className="text-xs mt-1" style={{ color: "#6B7FA0" }}>{request.category || "Other"}</div>
        </div>
        {request.answered && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>Answered</span>}
      </div>
      <p className="leading-relaxed mb-4" style={{ color: "#3A4A6B" }}>{request.content}</p>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={onPray} disabled={hasPrayed} className="px-4 py-2 rounded-full text-sm font-semibold transition" style={hasPrayed ? { background: "#F6F8FC", color: "#8A97B5", border: "1px solid #E6ECF5" } : { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
          {hasPrayed ? "Prayed for" : "Pray for this"}
        </button>
        <div className="flex items-center gap-1 text-sm" style={{ color: "#6B7FA0" }}><Heart className="w-4 h-4" style={{ color: "#EF4444" }} /> {supportCount}</div>
        <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-1 text-sm transition" style={{ color: "#6B7FA0" }}><MessageCircle className="w-4 h-4" /> {comments.length} comments</button>
        {canOpenPrayerRoom && (
          <button onClick={() => setPrayerRoomOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition" style={{ background: "rgba(11,63,217,0.06)", border: "1px solid #D6E4FF", color: "#0B3FD9" }}>
            <Lock className="w-3 h-3" /> Open Prayer Room
          </button>
        )}
      </div>
      {prayerRoomOpen && <PrayerRoomModal isOpen={prayerRoomOpen} onClose={() => setPrayerRoomOpen(false)} currentUser={currentUser} partnerEmail={request.user_email} partnerName={requesterName} prayerRequest={request.content} />}
      {showComments && (
        <div className="space-y-3 border-t pt-4" style={{ borderColor: "#E6ECF5" }}>
          {comments.map(c => (
            <div key={c.id} className="rounded-2xl px-4 py-3" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
              <div className="text-xs font-semibold mb-1" style={{ color: "#0B3FD9" }}>{c.is_anonymous ? "Anonymous" : c.authorName}</div>
              <div className="text-sm" style={{ color: "#3A4A6B" }}>{c.content}</div>
            </div>
          ))}
          <form onSubmit={e => { e.preventDefault(); if (!draft.trim()) return; onComment(draft, anonymousComment); setDraft(""); setAnonymousComment(false); }} className="space-y-3">
            <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Leave an encouraging comment..." className="w-full min-h-[88px] rounded-2xl px-4 py-3 focus:outline-none" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }} />
            <label className="flex items-center gap-2 text-sm" style={{ color: "#6B7FA0" }}><input type="checkbox" checked={anonymousComment} onChange={e => setAnonymousComment(e.target.checked)} /> Comment anonymously</label>
            <button type="submit" className="px-4 py-2 rounded-full text-sm font-semibold transition" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>Send support</button>
          </form>
        </div>
      )}
    </div>
  );
}