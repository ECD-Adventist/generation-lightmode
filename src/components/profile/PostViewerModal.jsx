import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import DropCard from "@/components/feed/DropCard";

export default function PostViewerModal({
  isOpen, onClose, drops, initialDropId,
  user, currentUser, allUsers,
  likeMutation, handleShare, userLikes, savedDropRecords
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [animDir, setAnimDir] = useState(null);

  useEffect(() => {
    if (isOpen && initialDropId && drops.length > 0) {
      const idx = drops.findIndex(d => d.id === initialDropId);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setAnimDir(null);
    }
  }, [isOpen, initialDropId, drops]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowUp") { e.preventDefault(); goToPrev(); }
      if (e.key === "ArrowDown") { e.preventDefault(); goToNext(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, currentIndex, drops.length]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(i => {
      if (i > 0) { setAnimDir("up"); return i - 1; }
      return i;
    });
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(i => {
      if (i < drops.length - 1) { setAnimDir("down"); return i + 1; }
      return i;
    });
  }, [drops.length]);

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    setTouchStart(null);
  };

  // Clear animation class after transition
  useEffect(() => {
    if (animDir) {
      const t = setTimeout(() => setAnimDir(null), 300);
      return () => clearTimeout(t);
    }
  }, [animDir, currentIndex]);

  if (!isOpen || drops.length === 0) return null;

  const drop = drops[currentIndex];
  if (!drop) return null;

  const getUserInfo = (email) => {
    if (currentUser?.email === email) return currentUser;
    if (user?.email === email) return user;
    const found = (allUsers || []).find(u => u.email === email);
    return found || { full_name: email?.split("@")[0] || "Glow Believer", email };
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <style>{`
        @keyframes modal-slide-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modal-slide-down { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: translateY(0); } }
        .post-slide-up { animation: modal-slide-up 0.28s ease-out; }
        .post-slide-down { animation: modal-slide-down 0.28s ease-out; }
      `}</style>

      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(20px) saturate(1.2)" }} />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#fff" }}
      >
        <X className="w-4 h-4" />
      </button>



      {/* Card */}
      <div
        className={`relative w-full max-w-xl mx-4 rounded-2xl overflow-hidden ${animDir === "up" ? "post-slide-up" : animDir === "down" ? "post-slide-down" : ""}`}
        style={{
          maxHeight: "88vh",
          background: "#FFFFFF",
          boxShadow: "0 25px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="overflow-y-auto" style={{ maxHeight: "88vh" }}>
          <DropCard
            drop={drop}
            user={currentUser}
            dropUser={getUserInfo(drop.user_email)}
            likeMutation={likeMutation}
            handleShare={handleShare}
            userLikes={userLikes || []}
            savedDropRecords={savedDropRecords || []}
            allUsers={allUsers || []}
          />
        </div>
      </div>
    </div>
  );
}