import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import ContentPreviewMedia from "@/components/content-hub/ContentPreviewMedia";

export default function ContentPreviewModal({ item, open, onClose }) {
  const queryClient = useQueryClient();

  // Opening the preview — from a card tap or a shared link — counts as a view.
  useEffect(() => {
    if (!open || !item.id) return;
    base44.functions
      .invoke("trackContentEngagement", { content_id: item.id, action: "view", platform: "" })
      .then(() => queryClient.invalidateQueries({ queryKey: ["digital-content-public"] }))
      .catch(() => {});
  }, [item.id, open]);


  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl bg-[#0E1524] border-white/10 text-white p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pr-12">
          <DialogTitle className="font-['Space_Grotesk'] text-base">{item.title}</DialogTitle>
          {item.description && <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>}
        </DialogHeader>
        {open && <ContentPreviewMedia key={item.id} item={item} />}
        {item.drive_view_url && (
          <div className="px-5 py-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-white/45">View or download directly in a separate tab.</p>
            <a
              href={item.drive_view_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-['Space_Grotesk'] font-black text-[11px] transition active:scale-95"
              style={{ background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.45)", color: "#00CFFF" }}
            >
              <ExternalLink size={12} /> Open in new tab
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}