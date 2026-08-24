import React, { useEffect, useRef } from "react";
import { X, ArrowLeft } from "lucide-react";
import DropCard from "@/components/feed/DropCard";

export default function PostViewerModal({
  isOpen, onClose, drops, initialDropId,
  user, currentUser, allUsers,
  likeMutation, handleShare, userLikes, savedDropRecords, leaderAccounts = [], following = [], followMutation, commentsByDropId
}) {
  const scrollRef = useRef(null);
  const initialRef = useRef(null);

  useEffect(() => {
    if (isOpen && initialDropId && initialRef.current) {
      setTimeout(() => {
        initialRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
      }, 80);
    }
  }, [isOpen, initialDropId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || drops.length === 0) return null;

  const getUserInfo = (email) => {
    if (currentUser?.email === email) return currentUser;
    if (user?.email === email) return user;
    const found = (allUsers || []).find(u => u.email === email);
    return found || { full_name: email?.split("@")[0] || "Glow Believer", email };
  };

  const profileOwner = user || currentUser;

  return (
    <div className="fixed inset-0 z-[100]" style={{ animation: "pvm-fade-in 0.2s ease-out" }}>
      <style>{`
        @keyframes pvm-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pvm-slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(24px)" }} onClick={onClose} />

      {/* Modal panel — full height on mobile, centered card on desktop */}
      <div
        className="absolute inset-0 md:inset-auto md:top-0 md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl flex flex-col"
        style={{ animation: "pvm-slide-up 0.25s ease-out", background: "#F6F8FC" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header bar */}
        <div
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b"
          style={{
            background: "rgba(246, 248, 252, 0.95)",
            backdropFilter: "blur(12px)",
            borderColor: "#E2E8F0",
          }}
        >
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-black/5"
            style={{ color: "#0B1B3D" }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Profile info */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid #1FB8FF" }}>
              <img
                src={profileOwner?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>
                {profileOwner?.full_name || "Posts"}
              </div>
              <div className="text-[11px] font-medium" style={{ color: "#6B7FA0" }}>
                {drops.length} post{drops.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-black/5 md:hidden"
            style={{ color: "#6B7FA0" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="py-4 px-3 sm:px-4 max-w-2xl mx-auto w-full">
            {drops.map((drop) => (
              <div
                key={drop.id}
                ref={drop.id === initialDropId ? initialRef : undefined}
              >
                <DropCard
                  drop={drop}
                  user={currentUser}
                  dropUser={getUserInfo(drop.user_email)}
                  likeMutation={likeMutation}
                  handleShare={handleShare}
                  userLikes={userLikes || []}
                  savedDropRecords={savedDropRecords || []}
                  allUsers={allUsers || []}
                  leaderAccounts={leaderAccounts || []}
                  following={following || []}
                  followMutation={followMutation}
                  commentsCount={commentsByDropId?.get?.(drop.id) || 0}
                />
              </div>
            ))}

            {/* End indicator */}
            <div className="text-center py-8 text-xs font-medium" style={{ color: "#8A97B5" }}>
              You've seen all posts
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}