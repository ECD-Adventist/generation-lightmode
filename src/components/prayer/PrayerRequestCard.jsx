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
    <div className="bg-[#121826] border border-white/10 rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-white">{request.is_anonymous ? "Anonymous" : requesterName}</div>
          <div className="text-xs text-gray-500 mt-1">{request.category || "Other"}</div>
        </div>
        {request.answered && <span className="text-xs font-bold text-green-400">Answered</span>}
      </div>

      <p className="text-white leading-relaxed mb-4">{request.content}</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={onPray} disabled={hasPrayed} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${hasPrayed ? "bg-white/10 text-gray-300" : "bg-[#00CFFF] text-black hover:bg-white"}`}>
          {hasPrayed ? "Prayed for" : "Pray for this"}
        </button>
        <div className="flex items-center gap-1 text-sm text-gray-400"><Heart className="w-4 h-4 text-red-400" /> {supportCount}</div>
        <button onClick={() => setShowComments((value) => !value)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition">
          <MessageCircle className="w-4 h-4" /> {comments.length} comments
        </button>
        {canOpenPrayerRoom && (
          <button
            onClick={() => setPrayerRoomOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#8A5CFF]/20 border border-[#8A5CFF]/30 text-[#8A5CFF] hover:bg-[#8A5CFF]/30 transition"
          >
            <Lock className="w-3 h-3" /> Open Prayer Room
          </button>
        )}
      </div>

      {prayerRoomOpen && (
        <PrayerRoomModal
          isOpen={prayerRoomOpen}
          onClose={() => setPrayerRoomOpen(false)}
          currentUser={currentUser}
          partnerEmail={request.user_email}
          partnerName={requesterName}
          prayerRequest={request.content}
        />
      )}

      {showComments && (
        <div className="space-y-3 border-t border-white/5 pt-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white/5 rounded-2xl px-4 py-3">
              <div className="text-xs font-semibold text-[#00CFFF] mb-1">{comment.is_anonymous ? "Anonymous" : comment.authorName}</div>
              <div className="text-sm text-gray-200">{comment.content}</div>
            </div>
          ))}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim()) return;
              onComment(draft, anonymousComment);
              setDraft("");
              setAnonymousComment(false);
            }}
            className="space-y-3"
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Leave an encouraging comment..."
              className="w-full min-h-[88px] rounded-2xl bg-[#0F1524] border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00CFFF]/40"
            />
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" checked={anonymousComment} onChange={(event) => setAnonymousComment(event.target.checked)} />
              Comment anonymously
            </label>
            <button type="submit" className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition">Send support</button>
          </form>
        </div>
      )}
    </div>
  );
}