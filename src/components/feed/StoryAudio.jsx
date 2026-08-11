import React, { useEffect, useRef, useState } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";

/**
 * Plays a status's attached music while it's on screen, with a mute toggle pill.
 */
export default function StoryAudio({ src, title, isPaused }) {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    if (!isPaused) el.play().catch(() => {});
    return () => el.pause();
  }, [src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPaused) el.pause();
    else el.play().catch(() => {});
  }, [isPaused]);

  if (!src) return null;

  return (
    <>
      <audio ref={audioRef} src={src} loop muted={muted} />
      <button
        type="button"
        onClick={() => setMuted(m => !m)}
        className="absolute bottom-20 left-3 z-40 flex items-center gap-2 max-w-[70%] px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md text-white"
      >
        <Music className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[11px] font-bold truncate">{title || "Music"}</span>
        {muted ? <VolumeX className="w-3.5 h-3.5 shrink-0" /> : <Volume2 className="w-3.5 h-3.5 shrink-0" />}
      </button>
    </>
  );
}