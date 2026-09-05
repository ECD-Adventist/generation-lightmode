import React from "react";
import { ExternalLink, Loader2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBytes } from "@/components/content-hub/contentMedia";

export default function ContentDownloadOptions({ item, open, onOpenChange, checking, variants, downloading, onSelect, onRetry }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background text-foreground">
        <DialogHeader><DialogTitle>Choose download quality</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground break-words">{item.title}</p>
        {checking && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Checking resolutions and file sizes…</p>}
        {!checking && !variants?.length && <div className="text-sm text-muted-foreground">File details unavailable. Open in a new tab or <button onClick={onRetry} className="underline text-foreground">try again</button>.</div>}
        <div className="space-y-2">
          {(variants || []).filter(variant => variant.available).map(variant => (
            <button key={variant.id} onClick={() => onSelect(variant)} disabled={downloading}
              className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-accent disabled:opacity-50">
              <Download className="h-4 w-4 shrink-0" />
              <span><span className="block text-sm font-semibold">{variant.label}{variant.resolution ? ` · ${variant.resolution}` : ""}</span>
                <span className="block text-xs text-muted-foreground">{variant.size > 0 ? formatBytes(variant.size) : "Size unavailable"}{!variant.resolution ? " · Resolution unavailable" : ""}</span></span>
            </button>
          ))}
        </div>
        {!checking && variants?.length > 0 && <p className="text-xs text-muted-foreground">Only available files are listed. Lower-resolution video downloads require a separate smaller copy.</p>}
        {downloading && <p role="status" className="text-sm">Your download is in progress. You can still open the file in a new tab.</p>}
        {item.drive_view_url && <a href={item.drive_view_url} target="_blank" rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
          <ExternalLink className="h-4 w-4" /> Open in new tab
        </a>}
      </DialogContent>
    </Dialog>
  );
}