import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";
import ContentDownloadOptions from "@/components/content-hub/ContentDownloadOptions";
import { toast } from "sonner";
import { fetchContentMeta, fetchContentFile, saveContentFile, recordContentEngagement, isTooLargeForInAppDownload } from "./contentMedia";
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
    // Very large files can't be buffered in the browser — send the user straight to
    // the file itself so the browser downloads it natively.
    if (isTooLargeForInAppDownload(variant?.size)) {
      setOpen(false);
      const directUrl = item.download_url || item.drive_view_url;
      if (!directUrl) return toast.error("Download link unavailable — please try again");
      const link = document.createElement("a");
      link.href = directUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      recordContentEngagement(item, "download")
        .then(() => queryClient.invalidateQueries({ queryKey: ["digital-content-public"] }))
        .catch(() => {});
      toast.success("Large file — your download is starting in a new tab");
      return;
    }
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
    setOpen(true);
    if (downloading || checking || variants?.length) return;
    setChecking(true);
    try {
      setVariants((await fetchContentMeta(item)).variants || []);
    } catch {
      setVariants([]);
    } finally {
      setChecking(false);
    }
  };

  const percent = progressPercent(progress);
  const label = downloading
    ? (percent !== null ? `${percent}%` : "Starting…")
    : checking ? "Checking…" : "Download";

  return (
    <div className="relative flex-1 min-w-0">
      <button type="button" onClick={handleClick}
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

      <ContentDownloadOptions item={item} open={open} onOpenChange={setOpen}
        checking={checking} variants={variants} downloading={downloading}
        onSelect={start} onRetry={handleClick} />
    </div>
  );
}