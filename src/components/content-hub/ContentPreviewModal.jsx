import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ContentPreviewModal({ item, open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-5xl bg-[#0E1524] border-white/10 text-white p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pr-12">
          <DialogTitle className="font-['Space_Grotesk'] text-base">{item.title}</DialogTitle>
          {item.description && <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>}
        </DialogHeader>
        <div className="aspect-video bg-black flex items-center justify-center">
          {item.content_type === "poster" ? (
            <img
              src={item.download_url}
              alt={item.title}
              className="w-full h-full object-contain"
              decoding="async"
            />
          ) : (
            <video
              src={item.download_url}
              title={`Preview ${item.title}`}
              className="w-full h-full object-contain"
              controls
              playsInline
              preload="auto"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}