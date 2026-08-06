import React, { useEffect, useState } from "react";
import { fetchContentFile } from "./contentMedia";

export default function ContentThumbnail({ item, fallback, priority = false, className = "w-full h-full object-cover" }) {
  const candidates = [item.thumbnail_url, item.image_url].filter(Boolean);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [mediaUrl, setMediaUrl] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoveryFailed, setRecoveryFailed] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setMediaUrl("");
    setRecoveryFailed(false);
  }, [item.id, item.thumbnail_url, item.image_url]);

  useEffect(() => {
    if (candidateIndex < candidates.length || !item.unlocked || mediaUrl || recoveryFailed) return;
    let active = true;
    let objectUrl = "";
    setRecovering(true);
    fetchContentFile(item, "view", "", false)
      .then((file) => {
        if (!active || !file.type.startsWith("image/")) throw new Error("Not an image");
        objectUrl = URL.createObjectURL(file);
        setMediaUrl(objectUrl);
      })
      .catch(() => active && setRecoveryFailed(true))
      .finally(() => active && setRecovering(false));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [candidateIndex, candidates.length, item.id, item.unlocked, recoveryFailed]);

  const src = candidates[candidateIndex] || mediaUrl;
  if (!src) return recovering ? <div className="w-full h-full animate-pulse bg-white/5" aria-label="Loading thumbnail" /> : fallback;

  return (
    <img
      src={src}
      className={className}
      alt={item.title}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      width="640"
      height="360"
      onError={() => setCandidateIndex((index) => index + 1)}
    />
  );
}