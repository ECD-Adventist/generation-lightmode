import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Smartphone, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { fetchContentMeta, fetchContentFile, saveContentFile, formatBytes } from "./contentMedia";
import { progressPercent } from "./ContentTransferProgress";

// Download control that offers a lighter "mobile" copy whenever one exists —
// an admin-uploaded compressed file, or a Google-resized image for posters.
export default function ContentDownloadMenu({ item, color }) {
  const [variants, setVariants] = useState(null);
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(null);
  const queryClient = useQueryClient();

  const start = async (variant) => {
    setOpen(false);
    setDownloading(true);
    setProgress({ received: 0, total: variant?.size || 0 });
    try {
      const file = await fetchContentFile(item, "download", {
        variant: variant?.id || "original",
        expectedSize: variant?.size || 0,
        onProgress: setProgress,
      });
      saveContentFile(file);
      queryClient.invalidateQueries({ queryKey: ["digital-content-public"] });
      toast.success("Download ready");
    } catch {
      toast.error("Download failed — please try again");
    }
    setDownloading(false);
    setProgress(null);
  };

  const handleClick = async () => {
    if (downloading || checking) return;
    let list = variants;
    if (!list) {
      setChecking(true);
      try {
        list = (await fetchContentMeta(item)).variants || [];
      } catch {
        list = [];
      }
      setVariants(list);
      setChecking(false);
    }
    const usable = list.filter(v => v.available);
    // Only ask which size when there is genuinely a choice.
    if (usable.length > 1) setOpen(true);
    else start(usable[0] || { id: "original" });
  };

  const percent = progressPercent(progress);
  const label = downloading
    ? (percent !== null ? `${percent}%` : "Starting…")
    : checking ? "Checking…" : "Download";

  return (
    <div className="relative flex-1 min-w-0">
      <button type="button" onClick={handleClick} disabled={downloading || checking}
        className="relative w-full flex items-center justify-center gap-1 py-2.5 rounded-full font-black text-[11px] font-['Space_Grotesk'] transition active:scale-95 overflow-hidden"
        style={{ background: color, color: "#0B0F1A" }}>
        {downloading && (
          <span className="absolute inset-y-0 left-0 transition-all duration-200"
            style={{ width: `${percent ?? 8}%`, background: "rgba(11,15,26,0.28)" }} />
        )}
        <span className="relative flex items-center gap-1">
          {downloading || checking ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {label}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="absolute z-[95] bottom-full mb-2 left-0 w-[210px] rounded-2xl p-1.5"
            style={{ background: "rgba(18,24,38,0.98)", border: "1px solid rgba(0,207,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
            <p className="text-[9px] font-black uppercase tracking-widest px-2.5 pt-1.5 pb-2" style={{ color: "#5A6B85" }}>Choose a size</p>
            {variants.filter(v => v.available).map(variant => (
              <button type="button" key={variant.id} onClick={() => start(variant)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition hover:bg-white/5">
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: variant.id === "mobile" ? "rgba(16,185,129,0.14)" : "rgba(255,255,255,0.06)", color: variant.id === "mobile" ? "#10B981" : "#C8D0E0" }}>
                  {variant.id === "mobile" ? <Smartphone size={13} /> : <HardDrive size={13} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold text-white">{variant.label}</span>
                  <span className="block text-[10px]" style={{ color: "#8A9BB0" }}>
                    {formatBytes(variant.size)}{variant.id === "mobile" ? " · saves data" : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}