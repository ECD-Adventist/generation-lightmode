import React from "react";
import { HandHeart, Send } from "lucide-react";
import PrayerRequestCard from "@/components/prayer/PrayerRequestCard";
import MobilePageHeader from "@/components/mobile/MobilePageHeader";

export default function MobilePrayerWall({
  user, content, setContent, category, setCategory, isAnonymous, setIsAnonymous,
  postMutation, requests, supports, comments, prayMutation, commentMutation, getName,
  hasMore, onLoadMore
}) {
  return (
    <div className="min-h-screen pb-24 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <MobilePageHeader title="Prayer Wall" subtitle="Share & pray together" />

      <div className="px-3 py-4 space-y-4">
        {/* Hero */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #F6F8FC 100%)", border: "1px solid #D6E4FF" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FFFFFF", border: "1px solid #B8E5FF" }}>
            <HandHeart className="w-5 h-5" style={{ color: "#0B3FD9" }} />
          </div>
          <div>
            <h2 className="font-black text-[15px]" style={{ color: "#0B1B3D", fontFamily: "Space Grotesk, sans-serif" }}>Prayer Wall</h2>
            <p className="text-[12px]" style={{ color: "#6B7FA0" }}>Share requests, pray for others, leave encouragement.</p>
          </div>
        </div>

        {/* Composer */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11,63,217,0.04)" }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your prayer request..."
            className="w-full min-h-[100px] rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-11 rounded-xl px-3 text-sm focus:outline-none" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}>
            <option>Health</option>
            <option>Family</option>
            <option>Finance</option>
            <option>Guidance</option>
            <option>Other</option>
          </select>
          <label className="flex items-center gap-2 text-[13px]" style={{ color: "#4A5878" }}>
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4" />
            Post anonymously
          </label>
          <button
            onClick={() => postMutation.mutate()}
            disabled={!content.trim() || postMutation.isPending}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11,63,217,0.25)" }}
          >
            <Send className="w-4 h-4" /> Post Prayer Request
          </button>
        </div>

        {/* Requests */}
        {requests.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#8A97B5" }}>
            <p className="text-sm">No prayer requests yet. Be the first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const reqSupports = supports.filter((s) => s.request_id === request.id);
              const reqComments = comments
                .filter((c) => c.request_id === request.id)
                .map((c) => ({ ...c, authorName: getName(c.user_email) }));
              return (
                <PrayerRequestCard
                  key={request.id}
                  request={request}
                  requesterName={getName(request.user_email)}
                  supportCount={reqSupports.length}
                  hasPrayed={reqSupports.some((s) => s.user_email === user.email)}
                  comments={reqComments}
                  onPray={() => prayMutation.mutate(request.id)}
                  onComment={(c, anon) => commentMutation.mutate({ requestId: request.id, commentContent: c, anonymous: anon })}
                  currentUser={user}
                />
              );
            })}
            {hasMore && (
              <button
                onClick={onLoadMore}
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: "#FFFFFF", border: "1px solid #D6E4FF", color: "#0B3FD9" }}
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}