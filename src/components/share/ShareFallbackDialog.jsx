import React, { useState } from "react";
import { Check, Copy, X, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  copyShareLink,
  logShareError,
  openShareWindow,
  buildDirectShareUrl,
  tryNativeShare,
  ALL_SHARE_PLATFORMS,
  DIRECT_SHARE_PLATFORMS,
} from "@/lib/shareActions";
import BrandIcon from "@/components/content-hub/BrandIcon";

const PLATFORM_COLORS = {
  whatsapp: "#25D366",
  facebook: "#1877F2",
  x: "#000000",
  telegram: "#26A5E4",
  linkedin: "#0A66C2",
  email: "#4A5878",
  instagram: "#E4405F",
  tiktok: "#000000",
  youtube: "#FF0000",
};

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

  const handleDirectShare = (platformId) => {
    const target = buildDirectShareUrl(platformId, share.url, share.text, share.title);
    if (!target || !openShareWindow(target, { contentId: share.id, platform: platformId })) {
      copy();
    }
  };

  const handleNativeShare = async () => {
    const result = await tryNativeShare(share, { contentId: share.id });
    if (result.status === "shared") toast.success("Shared successfully");
    else if (result.status === "failed") toast.error("Sharing failed — try copying the link");
  };

  const hasNativeShare = typeof navigator.share === "function";

  return (
    <div className="fixed inset-0 z-[6000] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#0B1B3D]">Share post</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-[#4A5878]" /></button>
        </div>
        <p className="text-sm text-[#4A5878] mb-4 line-clamp-2">{share.title}</p>

        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full rounded-2xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 mb-3"
            style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)" }}
          >
            <Share2 className="w-4 h-4" /> Share via device
          </button>
        )}

        <div className="grid grid-cols-4 gap-2 mb-3">
          {ALL_SHARE_PLATFORMS.map(btn => {
            const isNativeOnly = !DIRECT_SHARE_PLATFORMS.some(p => p.id === btn.id);
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => isNativeOnly ? handleNativeShare() : handleDirectShare(btn.id)}
                title={btn.label}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: PLATFORM_COLORS[btn.id] || "#4A5878" }}
                >
                  <BrandIcon brand={btn.id} />
                </span>
                <span className="text-[10px] font-semibold text-[#4A5878] leading-tight text-center">{btn.label}</span>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={copy} className="w-full rounded-2xl bg-[#EEF3FF] py-3 text-sm font-bold text-[#0B3FD9] flex items-center justify-center gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? "Copied" : "Copy link"}
        </button>

        <input readOnly value={share.url} onFocus={(event) => event.target.select()} className="mt-4 w-full rounded-xl border border-[#D6E4FF] bg-[#F8FAFC] px-3 py-2 text-xs text-[#4A5878]" />
      </div>
    </div>
  );
}