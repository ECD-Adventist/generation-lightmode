import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function ContentThumbnail({ item, fallback, priority = false, className = "w-full h-full object-cover" }) {
  const placeholderRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [storedFailed, setStoredFailed] = useState(false);
  const [resolvedFailed, setResolvedFailed] = useState(false);
  const needsThumbnail = !item.thumbnail_url || storedFailed;
  useEffect(() => {
    setStoredFailed(false);
    setResolvedFailed(false);
  }, [item.id, item.thumbnail_url]);
  useEffect(() => {
    if (!needsThumbnail || !placeholderRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "150px" });
    observer.observe(placeholderRef.current);
    return () => observer.disconnect();
  }, [needsThumbnail, item.id]);
  const { data, isFetching } = useQuery({
    queryKey: ["content-thumbnail", item.id],
    queryFn: async () => (await base44.functions.invoke("trackContentEngagement", { content_id: item.id, thumbnail: true, refresh_thumbnail: storedFailed })).data,
    enabled: needsThumbnail && visible && !!item.unlocked,
    staleTime: 30 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const src = !storedFailed && item.thumbnail_url ? item.thumbnail_url : !resolvedFailed && data?.thumbnail_url;
  if (!src) return <div ref={placeholderRef} className="w-full h-full">{isFetching ? <div className="w-full h-full animate-pulse bg-muted" aria-label="Loading thumbnail" /> : fallback}</div>;

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
      onError={() => !storedFailed && item.thumbnail_url ? setStoredFailed(true) : setResolvedFailed(true)}
    />
  );
}