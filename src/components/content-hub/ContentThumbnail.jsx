import React, { useEffect, useState } from "react";
import { fetchContentFile } from "./contentMedia";

export default function ContentThumbnail({ item, fallback }) {
  const candidates = [item.thumbnail_url, item.image_url].filter(Boolean);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [mediaUrl, setMediaUrl] = useState("");

  useEffect(() => {
    if (candidateIndex < candidates.length || !item.unlocked) return;
    let active = true;
    let objectUrl = "";
    fetchContentFile(item, "view", "", false)
      .then((file) => {
        if (!active || !file.type.startsWith("image/")) return;
        objectUrl = URL.createObjectURL(file);
        setMediaUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [candidateIndex, item.id]);

  const src = candidates[candidateIndex] || mediaUrl;
  if (!src) return fallback;

  return (
    <img
      src={src}
      className="w-full h-full object-cover"
      alt={item.title}
      loading="lazy"
      decoding="async"
      width="640"
      height="360"
      onError={() => setCandidateIndex((index) => index + 1)}
    />
  );
}