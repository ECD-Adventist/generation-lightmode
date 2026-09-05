import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function ContentPreviewMedia({ item }) {
  const isVideo = item.content_type === "video" || item.content_type === "animation";
  const src = isVideo ? item.preview_url : item.image_url;
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    setStatus("loading");
    const timer = setTimeout(() => setStatus(value => value === "loading" ? "delayed" : value), 12000);
    return () => clearTimeout(timer);
  }, [src]);

  return (
    <div className="relative flex min-h-[220px] flex-col items-center justify-center">
      {src ? (isVideo ? (
        <iframe
          key={src}
          src={src}
          title={`${item.title} — video preview`}
          className="h-[55vh] min-h-[220px] max-h-[65vh] w-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("failed")}
        />
      ) : (
        <img key={src} src={src} alt={item.title} decoding="async"
          className="max-h-[65vh] h-auto w-auto max-w-full object-contain"
          onLoad={() => setStatus("ready")} onError={() => setStatus("failed")} />
      )) : <p className="p-6 text-sm">Preview unavailable. Use “Open in new tab” below.</p>}
      {src && status === "loading" && (
        <div role="status" className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs text-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Opening preview…
        </div>
      )}
      {src && (status === "delayed" || status === "failed") && (
        <p role="status" className="px-5 py-3 text-sm">Preview not loading? Use “Open in new tab” below to view or download.</p>
      )}
    </div>
  );
}