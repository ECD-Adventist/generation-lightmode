import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Share2, Loader2, Lock, Copy, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { typeMeta } from "./contentConstants";
import ContentPreviewModal from "./ContentPreviewModal";

const SHARE_PLATFORMS = [
  { id: "whatsapp", label: "WhatsApp", emoji: "💬", url: (u, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${u}`)}` },
  { id: "facebook", label: "Facebook", emoji: "📘", url: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { id: "x", label: "X (Twitter)", emoji: "🐦", url: (u, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(u)}` },
  { id: "telegram", label: "Telegram", emoji: "✈️", url: (u, text) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(text)}` },
  { id: "native", label: "More apps", emoji: "↗️" },
];

export default function ContentCard({ item }) {
  const [downloading, setDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = typeMeta(item.content_type);
  const shareUrl = `${window.location.origin}/ContentHub?item=${item.id}`;
  const shareText = `⚡ ${item.title} — Generation LightMode`;

  const track = (action, platform = "") =>
    base44.functions.invoke("trackContentEngagement", { content_id: item.id, action, platform });

  const primePreview = () => {
    if (!item.preview_url || document.querySelector(`link[data-preview-id="${item.id}"]`)) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = item.preview_url;
    link.dataset.previewId = item.id;
    document.head.appendChild(link);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await track("download");
      if (res.data?.download_url) {
        // Hidden iframe: the file downloads without navigating away from the app.
        const frame = document.createElement("iframe");
        frame.style.display = "none";
        frame.src = res.data.download_url;
        document.body.appendChild(frame);
        setTimeout(() => frame.remove(), 60000);
        toast.success("Download started");
      }
    } catch {
      toast.error("Download failed — please try again");
    }
    setDownloading(false);
  };

  const handleShare = async (platform) => {
    setShareOpen(false);
    if (platform === "copy_link") {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied");
    } else if (platform === "native" && navigator.share) {
      try {
        await navigator.share({ title: item.title, text: shareText, url: shareUrl });
      } catch (error) {
        if (error.name === "AbortError") return;
        toast.error("Unable to open sharing");
        return;
      }
    } else {
      const p = SHARE_PLATFORMS.find(s => s.id === platform);
      if (p?.url) window.open(p.url(shareUrl, shareText), "_blank", "noopener");
    }
    track("share", platform).catch(() => {});
  };

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col relative" style={{ background: "#121826", border: `1px solid ${meta.color}25` }}>
      <div className="relative aspect-video" style={{ background: `${meta.color}10` }}>
        {item.thumbnail_url
          ? <img src={item.thumbnail_url} className="w-full h-full object-cover" alt={item.title} loading="lazy" decoding="async" width="640" height="360" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">{meta.emoji}</div>}
        <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "rgba(11,15,26,0.85)", color: meta.color, border: `1px solid ${meta.color}50` }}>
          {meta.emoji} {meta.label}
        </span>
        <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "rgba(11,15,26,0.85)", color: "#C8D0E0", border: "1px solid rgba(255,255,255,0.15)" }}>
          {item.language}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-['Space_Grotesk'] font-black text-[14px] text-white leading-snug mb-1">{item.title}</h3>
        {item.description && <p className="text-[11.5px] leading-relaxed mb-3 line-clamp-2" style={{ color: "#8A9BB0" }}>{item.description}</p>}

        <div className="mt-auto flex items-center gap-2">
          <button onClick={() => setPreviewOpen(true)} onPointerEnter={primePreview} onFocus={primePreview} disabled={!item.preview_url}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-black text-[11.5px] font-['Space_Grotesk'] transition active:scale-95 disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${meta.color}55`, color: meta.color }}>
            <Eye size={13} /> View
          </button>
          <button onClick={handleDownload} disabled={downloading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-black text-[11.5px] font-['Space_Grotesk'] transition active:scale-95"
            style={{ background: meta.color, color: "#0B0F1A" }}>
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Download
          </button>
          <div className="relative">
            <button onClick={() => setShareOpen(v => !v)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#C8D0E0" }}>
              <Share2 size={14} />
            </button>
            {shareOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
                <div className="absolute bottom-12 right-0 z-20 rounded-2xl p-1.5 min-w-[170px]" style={{ background: "rgba(18,24,38,0.98)", border: "1px solid rgba(0,207,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                  {SHARE_PLATFORMS.filter(p => p.id !== "native" || navigator.share).map(p => (
                    <button key={p.id} onClick={() => handleShare(p.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition hover:bg-white/5" style={{ color: "#C8D0E0" }}>
                      <span>{p.emoji}</span> {p.label}
                    </button>
                  ))}
                  <button onClick={() => handleShare("copy_link")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition hover:bg-white/5" style={{ color: "#C8D0E0" }}>
                    {copied ? <Check size={13} style={{ color: "#10B981" }} /> : <Copy size={13} />} Copy link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-[10px] mt-2 flex items-center gap-2" style={{ color: "#5A6B85" }}>
          <span>{item.download_count} downloads</span>·<span>{item.share_count} shares</span>
        </p>
      </div>
      <ContentPreviewModal item={item} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

export function LockedContentCard({ item }) {
  const meta = typeMeta(item.content_type);
  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ background: "#121826", border: "1px solid rgba(255,255,255,0.06)", opacity: 0.85 }}>
      <div className="relative aspect-video" style={{ background: "rgba(255,255,255,0.03)" }}>
        {item.thumbnail_url
          ? <img src={item.thumbnail_url} className="w-full h-full object-cover blur-[6px] scale-105" alt="" loading="lazy" />
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
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: `${meta.color}15`, color: meta.color }}>{meta.emoji} {meta.label}</span>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#8A9BB0" }}>{item.language}</span>
        </div>
        <h3 className="font-['Space_Grotesk'] font-black text-[13px] text-white leading-snug">{item.title}</h3>
      </div>
    </div>
  );
}