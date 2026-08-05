import React, { useState } from "react";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { copyShareLink, logShareError, openShareWindow, whatsappShareUrl } from "@/lib/shareActions";

export default function ShareFallbackDialog({ share, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!share) return null;
  const copy = async () => {
    try {
      await copyShareLink(share.url);
      setCopied(true);
      toast.success("Link copied");
    } catch (error) {
      logShareError("copy_link", error, { contentId: share.id });
      toast.error("Copy failed — select and copy the link below");
    }
  };
  const whatsapp = () => {
    if (!openShareWindow(whatsappShareUrl(share.text), { contentId: share.id, platform: "whatsapp" })) copy();
  };
  return (
    <div className="fixed inset-0 z-[6000] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-[#0B1B3D]">Share post</h2><button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-[#4A5878]" /></button></div>
        <p className="text-sm text-[#4A5878] mb-4 line-clamp-2">{share.title}</p>
        <div className="flex gap-3">
          <button type="button" onClick={whatsapp} className="flex-1 rounded-2xl bg-[#25D366] py-3 text-sm font-bold text-white flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" />WhatsApp</button>
          <button type="button" onClick={copy} className="flex-1 rounded-2xl bg-[#EEF3FF] py-3 text-sm font-bold text-[#0B3FD9] flex items-center justify-center gap-2">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? "Copied" : "Copy link"}</button>
        </div>
        <input readOnly value={share.url} onFocus={(event) => event.target.select()} className="mt-4 w-full rounded-xl border border-[#D6E4FF] bg-[#F8FAFC] px-3 py-2 text-xs text-[#4A5878]" />
      </div>
    </div>
  );
}