import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import DropCard from "@/components/feed/DropCard";

export default function PostViewerModal({
  isOpen, onClose, drops, initialDropId,
  user, currentUser, allUsers,
  likeMutation, handleShare, userLikes, savedDropRecords
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    if (isOpen && initialDropId && drops.length > 0) {
      const idx = drops.findIndex(d => d.id === initialDropId);
      setCurrentIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, initialDropId, drops]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowUp") goToPrev();
      if (e.key === "ArrowDown") goToNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, currentIndex, drops.length]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(i => (i > 0 ? i - 1 : i));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(i => (i < drops.length - 1 ? i + 1 : i));
  }, [drops.length]);

  // Swipe handling
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
      style={{ background: "rgba(11, 27, 61, 0.6)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition"
        style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #E6ECF5", color: "#4A5878" }}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Post counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.9)", color: "#4A5878", border: "1px solid #E6ECF5" }}>
        {currentIndex + 1} / {drops.length}
      </div>

      {/* Prev arrow (desktop) - top */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-10 h-10 rounded-full hidden md:flex items-center justify-center transition"
          style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #E6ECF5", color: "#0B3FD9" }}
        >
          <ChevronLeft className="w-5 h-5 rotate-90" />
        </button>
      )}

      {/* Next arrow (desktop) - bottom */}
      {currentIndex < drops.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-10 h-10 rounded-full hidden md:flex items-center justify-center transition"
          style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #E6ECF5", color: "#0B3FD9" }}
        >
          <ChevronRight className="w-5 h-5 rotate-90" />
        </button>
      )}

      {/* Card container */}
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 rounded-3xl relative"
        style={{ background: "#F6F8FC" }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-2 sm:p-4">
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

        {/* Dot indicators - vertical on right side */}
        {drops.length > 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
            {drops.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: 6,
                  height: i === currentIndex ? 20 : 6,
                  background: i === currentIndex ? "#0B3FD9" : "#D6E4FF",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}