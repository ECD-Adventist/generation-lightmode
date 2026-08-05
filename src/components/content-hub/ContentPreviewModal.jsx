import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchContentFile } from "./contentMedia";

export default function ContentPreviewModal({ item, open, onClose }) {
  const [mediaUrl, setMediaUrl] = useState("");
  const [failed, setFailed] = useState(false);
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
    fetchContentFile(item, "view", "", false).then((file) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(file);
      setMediaUrl(objectUrl);
    }).catch(() => active && setFailed(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setMediaUrl("");
    };
  }, [item.id, open]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl bg-[#0E1524] border-white/10 text-white p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pr-12">
          <DialogTitle className="font-['Space_Grotesk'] text-base">{item.title}</DialogTitle>
          {item.description && <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>}
        </DialogHeader>
        {/* Media keeps its own aspect ratio — portrait stays portrait on every device. */}
        <div className="bg-black flex items-center justify-center min-h-[220px] max-h-[75vh] overflow-hidden">
          {!mediaUrl && !failed && <Loader2 className="w-7 h-7 animate-spin text-white/60" />}
          {failed && <p className="text-sm text-white/60">Preview unavailable</p>}
          {mediaUrl && (isVideo
            ? <video src={mediaUrl} className="max-w-full max-h-[75vh] w-auto h-auto" controls playsInline />
            : <img src={mediaUrl} alt={item.title} className="max-w-full max-h-[75vh] w-auto h-auto object-contain" />)}
        </div>
      </DialogContent>
    </Dialog>
  );
}