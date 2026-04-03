import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const themeClasses = {
  ocean: "from-[#00CFFF] to-[#1DA1FF]",
  violet: "from-[#8A5CFF] to-[#3B1E70]",
  sunrise: "from-[#FFD000] to-[#F97316]",
  midnight: "from-[#121826] to-[#0B0F1A]",
};

const STORY_DURATION = 5000; // 5 seconds per story

export default function StatusViewerModal({ story, storyUser, isOpen, onClose, allStories = [], allUsers = [], getUserInfo }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const remainingRef = useRef(STORY_DURATION);

  // Build ordered story list from all active (non-expired) stories
  const storyQueue = React.useMemo(() => {
    if (!story || !allStories.length) return [];
    const now = Date.now();
    const active = allStories.filter(s => s.expires_at && new Date(s.expires_at).getTime() > now);
    
    // Group by user
    const byUser = new Map();
    active.forEach(s => {
      if (!byUser.has(s.user_email)) byUser.set(s.user_email, []);
      byUser.get(s.user_email).push(s);
    });
    
    // Sort each user's stories by date
    byUser.forEach((stories) => stories.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    
    // Put selected user's stories first, then others
    const result = [];
    if (byUser.has(story.user_email)) {
      result.push(...byUser.get(story.user_email));
      byUser.delete(story.user_email);
    }
    byUser.forEach((stories) => result.push(...stories));
    return result;
  }, [story, allStories]);

  // Reset when opened
  useEffect(() => {
    if (isOpen && storyQueue.length > 0) {
      const idx = storyQueue.findIndex(s => s.id === story?.id);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setProgress(0);
      remainingRef.current = STORY_DURATION;
    }
  }, [isOpen, story?.id, storyQueue]);

  const currentStory = storyQueue[currentIndex];
  const currentStoryUser = currentStory && getUserInfo ? getUserInfo(currentStory.user_email) : storyUser;

  // Find segment boundaries for the current user
  const currentUserSegments = React.useMemo(() => {
    if (!currentStory) return { start: 0, end: 0, count: 0 };
    const email = currentStory.user_email;
    let start = currentIndex, end = currentIndex;
    while (start > 0 && storyQueue[start - 1]?.user_email === email) start--;
    while (end < storyQueue.length - 1 && storyQueue[end + 1]?.user_email === email) end++;
    return { start, end, count: end - start + 1 };
  }, [currentIndex, currentStory, storyQueue]);

  const goNext = useCallback(() => {
    if (currentIndex < storyQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      remainingRef.current = STORY_DURATION;
    } else {
      onClose();
    }
  }, [currentIndex, storyQueue.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      remainingRef.current = STORY_DURATION;
    }
  }, [currentIndex]);

  // Skip expired stories automatically
  useEffect(() => {
    if (!isOpen || !currentStory) return;
    const now = Date.now();
    if (currentStory.expires_at && new Date(currentStory.expires_at).getTime() <= now) {
      goNext();
    }
  }, [isOpen, currentStory, currentIndex, goNext]);

  // Auto-advance timer
  useEffect(() => {
    if (!isOpen || isPaused || !currentStory) return;
    // Don't run timer on expired stories (they'll be skipped by the effect above)
    if (currentStory.expires_at && new Date(currentStory.expires_at).getTime() <= Date.now()) return;

    startTimeRef.current = Date.now();
    const duration = remainingRef.current;

    timerRef.current = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((STORY_DURATION - duration + elapsed) / STORY_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        goNext();
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    });

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      remainingRef.current = duration - (Date.now() - startTimeRef.current);
    };
  }, [isOpen, isPaused, currentIndex, currentStory, goNext]);

  // Touch handling
  const touchStartRef = useRef(null);
  const handleTouchStart = (e) => { touchStartRef.current = e.touches[0].clientX; setIsPaused(true); };
  const handleTouchEnd = (e) => {
    setIsPaused(false);
    if (touchStartRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartRef.current;
    if (diff > 60) goPrev();
    else if (diff < -60) goNext();
    touchStartRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
      else if (e.key === " ") { e.preventDefault(); setIsPaused(p => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, goNext, goPrev, onClose]);

  if (!isOpen || !currentStory) return null;

  const postedDate = currentStory.created_date
    ? new Date(currentStory.created_date.endsWith("Z") ? currentStory.created_date : currentStory.created_date + "Z")
    : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95" onClick={onClose} />

      {/* Story Card */}
      <div
        className="relative w-full max-w-[420px] h-[100dvh] sm:h-[90vh] sm:max-h-[780px] sm:rounded-2xl overflow-hidden bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Content */}
        {currentStory.story_type === "image" && currentStory.media_url ? (
          <img src={currentStory.media_url} alt="Story" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${themeClasses[currentStory.background_theme] || themeClasses.ocean} flex items-center justify-center p-10`}>
            <p className="text-white text-2xl sm:text-3xl font-black leading-relaxed text-center break-words drop-shadow-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {currentStory.text_content}
            </p>
          </div>
        )}

        {/* Dark gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-30">
          {Array.from({ length: currentUserSegments.count }).map((_, i) => {
            const segIndex = currentUserSegments.start + i;
            const isActive = segIndex === currentIndex;
            const isDone = segIndex < currentIndex;
            return (
              <div key={i} className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{ width: isDone ? "100%" : isActive ? `${progress * 100}%` : "0%" }}
                />
              </div>
            );
          })}
        </div>

        {/* User info */}
        <div className="absolute top-7 left-3 right-3 flex items-center justify-between z-30">
          <Link
            to={createPageUrl("Profile") + `?user=${encodeURIComponent(currentStory.user_email)}`}
            onClick={onClose}
            className="flex items-center gap-2.5 no-underline"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px]">
              <div className="w-full h-full rounded-full bg-black overflow-hidden">
                <img
                  src={currentStoryUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <span className="text-white font-bold text-sm block leading-tight">{currentStoryUser?.full_name || "User"}</span>
              <span className="text-white/60 text-[10px] leading-tight">
                {postedDate ? formatDistanceToNow(postedDate, { addSuffix: true }) : ""}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsPaused(p => !p)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition">
              {isPaused ? <Play className="w-4 h-4" fill="white" /> : <Pause className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tap zones for prev/next */}
        <div className="absolute inset-0 z-20 flex">
          <button className="w-1/3 h-full" onClick={goPrev} aria-label="Previous" />
          <button className="w-1/3 h-full" onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} aria-label="Hold" />
          <button className="w-1/3 h-full" onClick={goNext} aria-label="Next" />
        </div>

        {/* Desktop nav arrows */}
        {currentIndex > 0 && (
          <button onClick={goPrev} className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 w-10 h-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition z-40">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {currentIndex < storyQueue.length - 1 && (
          <button onClick={goNext} className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 w-10 h-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition z-40">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}