import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Save, Share2, Loader2, Lock, Copy, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { typeMeta } from "./contentConstants";
import ContentPreviewModal from "./ContentPreviewModal";
import BrandIcon from "./BrandIcon";
import { fetchContentFile, saveContentFile } from "./contentMedia";
import { buildShareText, getSharePreviewUrl } from "@/lib/sharePreview";
import { copyShareLink, openShareWindow, tryNativeShare, buildDirectShareUrl, isUploadPlatform, ALL_SHARE_PLATFORMS, DIRECT_SHARE_PLATFORMS } from "@/lib/shareActions";

const SHARE_PLATFORMS = ALL_SHARE_PLATFORMS;

export default function ContentCard({ item }) {
  const [downloading, setDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMenuView, setShareMenuView] = useState("main");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const queryClient = useQueryClient();
  const meta = typeMeta(item.content_type);
  const shareUrl = getSharePreviewUrl("content", item.id);
  const shareText = buildShareText(item.title, item.description, shareUrl);

  const track = async (action, platform = "") => {
    const res = await base44.functions.invoke("trackContentEngagement", { content_id: item.id, action, platform });
    queryClient.invalidateQueries({ queryKey: ["digital-content-public"] });
    return res;
  };

  const primePreview = () => {
    if (!item.download_url || document.querySelector(`link[data-preview-id="${item.id}"]`)) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = item.download_url;
    link.dataset.previewId = item.id;
    document.head.appendChild(link);
  };

  // View tracking is handled by ContentPreviewModal when it opens, so every
  // path into the preview (thumbnail tap, View button, shared link) counts.
  const handleView = () => setPreviewOpen(true);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const file = await fetchContentFile(item, "download");
      saveContentFile(file);
      queryClient.invalidateQueries({ queryKey: ["digital-content-public"] });
      toast.success("Download started");
    } catch {
      toast.error("Download failed — please try again");
    }
    setDownloading(false);
  };

  const toggleShareMenu = () => {
    setShareMenuView("main");
    setShareOpen(value => !value);
  };

  const handleShare = async (platform, nativeAppLabel = "") => {
    const context = { contentType: "content_hub", contentId: item.id, platform };
    if (platform === "copy_link") {
      try {
        await copyShareLink(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied");
        track("share", platform).catch(() => {});
      } catch (error) {
        if (import.meta.env.DEV) console.error("[share_error]", { stage: "copy_link", error, ...context });
        toast.error("Copy failed — select the link and try again");
      }
      return;
    }
    if (platform === "native") {
      // Try to attach the thumbnail image when the device supports file sharing
      if (typeof navigator.canShare === "function" && typeof navigator.share === "function" && item.thumbnail_url) {
        try {
          const res = await fetch(item.thumbnail_url, { mode: "cors" });
          if (res.ok) {
            const blob = await res.blob();
            const file = new File([blob], `content-${item.id}.png`, { type: blob.type || "image/png" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ title: item.title || "Generation LightMode", text: shareText, files: [file] });
              setShareOpen(false);
              track("share", platform).catch(() => {});
              return;
            }
          }
        } catch (err) {
          if (err?.name === "AbortError") return;
          // Fall through to text-based native share below
        }
      }
      const result = await tryNativeShare({ title: item.title || "Generation LightMode", text: shareText, url: shareUrl }, context);
      if (result.status === "shared") {
        setShareOpen(false);
        track("share", nativeAppLabel.toLowerCase() || platform).catch(() => {});
      } else if (result.status === "failed" || result.status === "unavailable") {
        try {
          await copyShareLink(shareUrl);
          toast.success(`${nativeAppLabel || "This app"} needs the device share menu — the link is copied for you to paste.`);
        } catch {
          toast.error(`${nativeAppLabel || "This app"} sharing is available from the device share menu.`);
        }
      }
      return;
    }
    // Direct URL share platforms (WhatsApp, Facebook, X, Telegram, LinkedIn, Email,
    // Instagram, TikTok, YouTube). The latter three open an upload page — copy the
    // link first so the user can paste it as a caption.
    if (isUploadPlatform(platform)) {
      try { await copyShareLink(shareUrl); } catch { /* non-fatal */ }
    }
    const target = buildDirectShareUrl(platform, shareUrl, shareText, item.title);
    if (!target || !openShareWindow(target, context)) {
      setShareOpen(true);
      return;
    }
    setShareOpen(false);
    track("share", platform).catch(() => {});
  };

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col relative" style={{ background: "#121826", border: `1px solid ${meta.color}25` }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => item.download_url && handleView()}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && item.download_url) { e.preventDefault(); handleView(); } }}
        onPointerEnter={primePreview}
        className="relative aspect-video cursor-pointer"
        style={{ background: `${meta.color}10` }}
      >
        {item.thumbnail_url && !thumbFailed
          ? <img src={item.thumbnail_url} className="w-full h-full object-cover" alt={item.title} loading="lazy" decoding="async" width="640" height="360" onError={() => setThumbFailed(true)} />
          : <div className="w-full h-full flex items-center justify-center text-4xl">{meta.emoji}</div>}
        <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "rgba(11,15,26,0.85)", color: "#C8D0E0", border: "1px solid rgba(255,255,255,0.15)" }}>
          {item.language}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-['Space_Grotesk'] font-black text-[14px] text-white leading-snug mb-1">{item.title}</h3>
        {item.description && <p className="text-[11.5px] leading-relaxed mb-3 line-clamp-2" style={{ color: "#8A9BB0" }}>{item.description}</p>}

        <div className="mt-auto flex items-center gap-2">
          <button type="button" onClick={handleView} onPointerEnter={primePreview} onFocus={primePreview} disabled={!item.download_url}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-black text-[11.5px] font-['Space_Grotesk'] transition active:scale-95 disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${meta.color}55`, color: meta.color }}>
            <Eye size={13} /> View
          </button>
          <button type="button" onClick={handleDownload} disabled={downloading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-black text-[11.5px] font-['Space_Grotesk'] transition active:scale-95"
            style={{ background: meta.color, color: "#0B0F1A" }}>
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Download
          </button>
          <div className="relative">
            <button type="button" onClick={toggleShareMenu}
              className="w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#C8D0E0" }}>
              <Share2 size={14} />
            </button>
            {shareOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
                <div className="absolute bottom-12 right-0 z-20 rounded-2xl p-2 min-w-[200px]" style={{ background: "rgba(18,24,38,0.98)", border: "1px solid rgba(0,207,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {SHARE_PLATFORMS.map(p => {
                      const isNativeOnly = !DIRECT_SHARE_PLATFORMS.some(d => d.id === p.id);
                      return (
                        <button type="button" key={p.id} onClick={() => isNativeOnly ? handleShare("native", p.label) : handleShare(p.id)}
                          className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition hover:bg-white/5">
                          <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: p.id === "tiktok" || p.id === "x" ? "#000000" : p.id === "whatsapp" ? "#25D366" : p.id === "facebook" ? "#1877F2" : p.id === "telegram" ? "#26A5E4" : p.id === "linkedin" ? "#0A66C2" : p.id === "email" ? "#4A5878" : p.id === "instagram" ? "#E4405F" : p.id === "youtube" ? "#FF0000" : "#4A5878" }}>
                            <BrandIcon brand={p.id} />
                          </span>
                          <span className="text-[9px] font-semibold text-center" style={{ color: "#C8D0E0" }}>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {navigator.share && (
                    <button type="button" onClick={() => handleShare("native")}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition hover:bg-white/5" style={{ color: "#00CFFF" }}>
                      <span>↗️</span> More apps
                    </button>
                  )}
                  <button type="button" onClick={() => handleShare("copy_link")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition hover:bg-white/5" style={{ color: "#C8D0E0" }}>
                    {copied ? <Check size={13} style={{ color: "#10B981" }} /> : <Copy size={13} />} Copy link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-[10px] mt-2 flex items-center gap-2" style={{ color: "#5A6B85" }}>
          <span>{item.view_count || 0} views</span>·<span>{item.download_count || 0} downloads</span>·<span>{item.share_count || 0} shares</span>
        </p>
      </div>
      <ContentPreviewModal item={item} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

export function LockedContentCard({ item }) {
  const meta = typeMeta(item.content_type);
  const [thumbFailed, setThumbFailed] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ background: "#121826", border: "1px solid rgba(255,255,255,0.06)", opacity: 0.85 }}>
      <div className="relative aspect-video" style={{ background: "rgba(255,255,255,0.03)" }}>
        {item.thumbnail_url && !thumbFailed
          ? <img src={item.thumbnail_url} className="w-full h-full object-cover blur-[6px] scale-105" alt="" loading="lazy" onError={() => setThumbFailed(true)} />
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">{meta.emoji}</div>}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5" style={{ background: "rgba(11,15,26,0.6)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,208,0,0.12)", border: "1px solid rgba(255,208,0,0.35)" }}>
            <Lock size={16} style={{ color: "#FFD000" }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#FFD000" }}>Unlocks</p>
          <p className="text-[11px] font-bold text-white">
            {new Date(item.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      </div>
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#8A9BB0" }}>{item.language}</span>
        </div>
        <h3 className="font-['Space_Grotesk'] font-black text-[13px] text-white leading-snug">{item.title}</h3>
      </div>
    </div>
  );
}