import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import { fetchContentFile } from "./contentMedia";
import ContentThumbnail from "./ContentThumbnail";
import ContentTransferProgress from "./ContentTransferProgress";

export default function ContentPreviewModal({ item, open, onClose }) {
  const [mediaUrl, setMediaUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(null);
  const queryClient = useQueryClient();
  const isVideo = item.content_type === "video" || item.content_type === "animation";

  // Opening the preview — from a card tap or a shared link — counts as a view.
  useEffect(() => {
    if (!open || !item.id) return;
    base44.functions
      .invoke("trackContentEngagement", { content_id: item.id, action: "view", platform: "" })
      .then(() => queryClient.invalidateQueries({ queryKey: ["digital-content-public"] }))
      .catch(() => {});
  }, [item.id, open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let objectUrl = "";
    setFailed(false);
    setProgress({ received: 0, total: 0 });
    // Full-quality media is fetched in the background while the thumbnail shows,
    // and its transfer progress is reported so the wait is never a blank spinner.
    fetchContentFile(item, "view", { record: false, onProgress: (value) => active && setProgress(value) }).then((file) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(file);
      setMediaUrl(objectUrl);
      setProgress(null);
    }).catch(() => {
      if (!active) return;
      setFailed(true);
      setProgress(null);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setMediaUrl("");
      setProgress(null);
    };
  }, [item.id, open]);

  const loading = !mediaUrl && !failed;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl bg-[#0E1524] border-white/10 text-white p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pr-12">
          <DialogTitle className="font-['Space_Grotesk'] text-base">{item.title}</DialogTitle>
          {item.description && <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>}
        </DialogHeader>
        {/* Media keeps its own aspect ratio — portrait stays portrait on every device. */}
        <div className="relative bg-black flex items-center justify-center min-h-[220px] max-h-[75vh] overflow-hidden">
          {/* The thumbnail appears immediately so there is something to look at
              while the large original transfers. */}
          {(loading || failed) && (
            <ContentThumbnail
              item={item}
              priority
              className="max-w-full max-h-[75vh] w-auto h-auto object-contain"
              fallback={<div className="w-full h-[220px]" style={{ background: "#0B0F1A" }} />}
            />
          )}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(6,10,20,0.62)" }}>
              <ContentTransferProgress progress={progress} label={isVideo ? "Loading video" : "Loading full quality"} />
            </div>
          )}
          {mediaUrl && (isVideo
            ? <video src={mediaUrl} poster={item.thumbnail_url || undefined} className="max-w-full max-h-[75vh] w-auto h-auto" controls playsInline autoPlay />
            : <img src={mediaUrl} alt={item.title} className="max-w-full max-h-[75vh] w-auto h-auto object-contain" />)}
        </div>
        {item.drive_view_url && (
          <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-3">
            <p className="text-[11px] text-white/45">Slow connection? Open it in Google Drive and download from there.</p>
            <a
              href={item.drive_view_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-['Space_Grotesk'] font-black text-[11px] transition active:scale-95"
              style={{ background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.45)", color: "#00CFFF" }}
            >
              <ExternalLink size={12} /> Open in Google Drive
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}