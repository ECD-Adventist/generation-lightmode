import React, { useState, useRef, useEffect } from "react";
import { Share2, Copy, Check, Instagram, Music2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Easy share control for a devotional verse + reflection.
 * - Uses the native Share Sheet when available (lets users pick Instagram / TikTok directly on mobile).
 * - Falls back to a small menu that copies the text to the clipboard, then opens Instagram or TikTok.
 */
export default function DevotionShareButton({ verse, text, reflection, color = "#0B3FD9" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  const shareText = [
    `"${text}"`,
    `— ${verse}`,
    reflection ? `\n${reflection}` : "",
    "\n#GenerationLightMode #FaithAlwaysOn",
  ].filter(Boolean).join("\n");

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      return true;
    } catch {
      toast.error("Couldn't copy. Please copy manually.");
      return false;
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    // Native share sheet — best experience on mobile (Instagram, TikTok, etc.)
    if (navigator.share) {
      try {
        await navigator.share({ title: verse, text: shareText });
        return;
      } catch {
        // user cancelled or unsupported — fall through to menu
      }
    }
    setOpen((v) => !v);
  };

  const openApp = async (app) => {
    const ok = await copyText();
    if (ok) toast.success("Verse copied! Paste it into your post 🙌");
    const url = app === "instagram" ? "https://www.instagram.com/" : "https://www.tiktok.com/upload";
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95"
        style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}
      >
        <Share2 className="w-3.5 h-3.5" /> Share
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-2 z-50 rounded-2xl p-1.5 w-48"
          style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 28px rgba(11,27,61,0.18)" }}
        >
          <button onClick={() => openApp("instagram")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-[#F6F8FC]" style={{ color: "#0B1B3D" }}>
            <Instagram className="w-4 h-4" style={{ color: "#E1306C" }} /> Instagram
          </button>
          <button onClick={() => openApp("tiktok")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-[#F6F8FC]" style={{ color: "#0B1B3D" }}>
            <Music2 className="w-4 h-4" style={{ color: "#0B1B3D" }} /> TikTok
          </button>
          <button onClick={copyText} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-[#F6F8FC]" style={{ color: "#0B1B3D" }}>
            {copied ? <Check className="w-4 h-4" style={{ color: "#16a34a" }} /> : <Copy className="w-4 h-4" style={{ color: "#6B7FA0" }} />}
            {copied ? "Copied!" : "Copy text"}
          </button>
        </div>
      )}
    </div>
  );
}