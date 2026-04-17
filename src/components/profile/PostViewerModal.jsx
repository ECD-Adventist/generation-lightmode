import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import DropCard from "@/components/feed/DropCard";

export default function PostViewerModal({
  isOpen, onClose, drops, initialDropId,
  user, currentUser, allUsers,
  likeMutation, handleShare, userLikes, savedDropRecords
}) {
  const scrollRef = useRef(null);
  const initialRef = useRef(null);

  useEffect(() => {
    if (isOpen && initialDropId && initialRef.current) {
      setTimeout(() => {
        initialRef.current?.scrollIntoView({ block: "start" });
      }, 50);
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
  }, [isOpen]);

  if (!isOpen || drops.length === 0) return null;

  const getUserInfo = (email) => {
    if (currentUser?.email === email) return currentUser;
    if (user?.email === email) return user;
    const found = (allUsers || []).find(u => u.email === email);
    return found || { full_name: email?.split("@")[0] || "Glow Believer", email };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(20px)" }} onClick={onClose} />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#fff" }}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Scrollable feed */}
      <div
        ref={scrollRef}
        className="relative w-full max-w-xl mx-4 overflow-y-auto rounded-2xl hide-scrollbar"
        style={{ maxHeight: "92vh", background: "#F6F8FC" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          {drops.map((drop) => (
            <div
              key={drop.id}
              ref={drop.id === initialDropId ? initialRef : undefined}
              className="border-b last:border-b-0"
              style={{ borderColor: "#E6ECF5" }}
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
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}