import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Save, Share2, Loader2, Lock, Copy, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { typeMeta } from "./contentConstants";
import ContentPreviewModal from "./ContentPreviewModal";
import BrandIcon from "./BrandIcon";
import { fetchContentFile, saveContentFile } from "./contentMedia";

const SHARE_PLATFORMS = [
  { id: "whatsapp", label: "WhatsApp", url: (u, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${u}`)}` },
  { id: "facebook", label: "Facebook", url: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "x", label: "X (Twitter)", url: (u, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(u)}` },
  { id: "telegram", label: "Telegram", url: (u, text) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(text)}` },
  { id: "native", label: "More apps" },
];

export default function ContentCard({ item }) {
  const [downloading, setDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMenuView, setShareMenuView] = useState("main");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const meta = typeMeta(item.content_type);
  const shareUrl = `${window.location.origin}/ContentHub?item=${item.id}`;
  const shareText = `⚡ ${item.title} — Generation LightMode`;

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

  const handleView = () => {
    setPreviewOpen(true);
    track("view").catch(() => {});
  };

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

  const handleShare = async (platform) => {
    setShareOpen(false);
    const mediaPlatforms = ["whatsapp", "instagram", "tiktok", "youtube", "native"];

    if (mediaPlatforms.includes(platform)) {
      const loadingToast = toast.loading("Preparing media…");
      try {
        const file = await fetchContentFile(item, "share", platform);
        toast.dismiss(loadingToast);
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: item.title, text: shareText });
        } else {
          saveContentFile(file);
          toast.success("Media downloaded — attach it in the app");
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        if (error.name === "AbortError") return;
        toast.error("Unable to share this media");
      }
      return;
    }

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
      if (p?.url) {
        window.open(p.url(shareUrl, shareText), "_blank", "noopener");
      } else if (navigator.share) {
        try {
          await navigator.share({ title: item.title, text: shareText, url: shareUrl });
        } catch (error) {
          if (error.name === "AbortError") return;
          toast.error("Unable to open sharing");
          return;
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(`Link copied — open ${p?.label || "the app"} to share`);
      }
    }
    track("share", platform).catch(() => {});
  };

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col relative" style={{ background: "#121826", border: `1px solid ${meta.color}25` }}>
      <div className="relative aspect-video" style={{ background: `${meta.color}10` }}>
        {item.thumbnail_url
          ? <img src={item.thumbnail_url} className="w-full h-full object-cover" alt={item.title} loading="lazy" decoding="async" width="640" height="360" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">{meta.emoji}</div>}
        <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "rgba(11,15,26,0.85)", color: "#C8D0E0", border: "1px solid rgba(255,255,255,0.15)" }}>
          {item.language}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-['Space_Grotesk'] font-black text-[14px] text-white leading-snug mb-1">{item.title}</h3>
        {item.description && <p className="text-[11.5px] leading-relaxed mb-3 line-clamp-2" style={{ color: "#8A9BB0" }}>{item.description}</p>}

        <div className="mt-auto flex items-center gap-2">
          <button onClick={handleView} onPointerEnter={primePreview} onFocus={primePreview} disabled={!item.download_url}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-black text-[11.5px] font-['Space_Grotesk'] transition active:scale-95 disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${meta.color}55`, color: meta.color }}>
            <Eye size={13} /> View
          </button>
          <button onClick={handleDownload} disabled={downloading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-black text-[11.5px] font-['Space_Grotesk'] transition active:scale-95"
            style={{ background: meta.color, color: "#0B0F1A" }}>
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Download
          </button>
          <div className="relative">
            <button onClick={() => { setShareMenuView("main"); setShareOpen(v => !v); }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#C8D0E0" }}>
              <Share2 size={14} />
            </button>
            {shareOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
                <div className="absolute bottom-12 right-0 z-20 rounded-2xl p-1.5 min-w-[170px]" style={{ background: "rgba(18,24,38,0.98)", border: "1px solid rgba(0,207,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                  {shareMenuView === "main" ? (
                    <>
                      {SHARE_PLATFORMS.filter(p => !["x", "telegram", "native"].includes(p.id)).map(p => (
                        <button key={p.id} onClick={() => handleShare(p.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition hover:bg-white/5" style={{ color: "#C8D0E0" }}>
                          <BrandIcon brand={p.id} /> {p.label}
                        </button>
                      ))}
                      <button onClick={() => setShareMenuView("more")}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition hover:bg-white/5" style={{ color: "#C8D0E0" }}>
                        <span>↗️</span> More apps
                      </button>
                      <button onClick={() => handleShare("copy_link")}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition hover:bg-white/5" style={{ color: "#C8D0E0" }}>
                        {copied ? <Check size={13} style={{ color: "#10B981" }} /> : <Copy size={13} />} Copy link
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setShareMenuView("main")}
                        className="w-full px-3 py-2 rounded-xl text-[11px] font-bold text-left transition hover:bg-white/5" style={{ color: "#00CFFF" }}>
                        ← Back
                      </button>
                      {SHARE_PLATFORMS.filter(p => ["x", "telegram"].includes(p.id)).map(p => (
                        <button key={p.id} onClick={() => handleShare(p.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition hover:bg-white/5" style={{ color: "#C8D0E0" }}>
                          <BrandIcon brand={p.id} /> {p.label}
                        </button>
                      ))}
                      {navigator.share && (
                        <button onClick={() => handleShare("native")}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition hover:bg-white/5" style={{ color: "#C8D0E0" }}>
                          <span>↗️</span> Other apps
                        </button>
                      )}
                    </>
                  )}
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
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#8A9BB0" }}>{item.language}</span>
        </div>
        <h3 className="font-['Space_Grotesk'] font-black text-[13px] text-white leading-snug">{item.title}</h3>
      </div>
    </div>
  );
}