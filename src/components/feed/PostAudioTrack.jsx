import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const ACTIVE_AUDIO_EVENT = "generation-lightmode:active-post-audio";

export default function PostAudioTrack({ audioUrl, audioTitle, postId }) {
  const audioRef = useRef(null);
  const wrapRef = useRef(null);
  const instanceId = useRef(`${postId || "post"}-${Math.random().toString(36).slice(2)}`);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const stopThisTrack = (event) => {
      if (event.detail === instanceId.current) return;
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.muted = true;
      setMuted(true);
    };
    const handleVisibility = () => {
      if (!document.hidden) return;
      audioRef.current?.pause();
      setMuted(true);
    };
    window.addEventListener(ACTIVE_AUDIO_EVENT, stopThisTrack);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener(ACTIVE_AUDIO_EVENT, stopThisTrack);
      document.removeEventListener("visibilitychange", handleVisibility);
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const control = wrapRef.current;
    if (!control) return;
    const observer = new IntersectionObserver(([entry]) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (!entry.isIntersecting) {
        audio.pause();
        audio.muted = true;
        setMuted(true);
        return;
      }
      audio.muted = muted;
      if (!muted) {
        window.dispatchEvent(new CustomEvent(ACTIVE_AUDIO_EVENT, { detail: instanceId.current }));
      }
      audio.play().catch(() => {});
    }, { threshold: 0.6 });
    observer.observe(control);
    return () => observer.disconnect();
  }, [muted, audioUrl]);

  if (!audioUrl) return null;

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextMuted = !muted;
    audio.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted) {
      window.dispatchEvent(new CustomEvent(ACTIVE_AUDIO_EVENT, { detail: instanceId.current }));
      audio.play().catch(() => {});
    }
  };

  return (
    <div ref={wrapRef} className="absolute top-3 right-3 z-40" onClick={(event) => event.stopPropagation()}>
      <audio ref={audioRef} src={audioUrl} loop muted={muted} playsInline preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={toggleSound}
        className="w-11 h-11 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white bg-black/65 border border-white/25 shadow-lg backdrop-blur-md active:scale-95 transition"
        aria-label={muted ? `Unmute ${audioTitle || "post music"}` : `Mute ${audioTitle || "post music"}`}
        title={audioTitle || "Original audio"}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}