import React, { useEffect, useRef, useState } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import TrackDetailModal from "@/components/feed/TrackDetailModal";

/**
 * Instagram-style sound pill: autoplays (muted) when the post scrolls into view,
 * a single mute/unmute toggle, and a tap on the title opens the track details.
 */
export default function PostAudioTrack({ audioUrl, audioTitle }) {
  const audioRef = useRef(null);
  const wrapRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const audio = audioRef.current;
        if (!audio) return;
        if (entry.isIntersecting) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!audioUrl) return null;

  return (
    <div ref={wrapRef} className="px-3 sm:px-4 pt-3" onClick={(e) => e.stopPropagation()}>
      <audio ref={audioRef} src={audioUrl} loop muted={muted} playsInline preload="metadata" className="hidden" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-full transition active:scale-[0.98]"
          style={{ background: "#F0F5FF", border: "1px solid #D6E4FF" }}
        >
          <Music className="w-3.5 h-3.5 shrink-0" style={{ color: "#0B3FD9" }} />
          <span className="text-[12px] font-bold truncate" style={{ color: "#0B3FD9" }}>
            {audioTitle || "Original audio"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMuted(m => !m)}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition"
          style={{ background: "#F0F5FF", border: "1px solid #D6E4FF", color: "#0B3FD9" }}
          aria-label={muted ? "Unmute sound" : "Mute sound"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <TrackDetailModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        audioUrl={audioUrl}
        audioTitle={audioTitle}
      />
    </div>
  );
}