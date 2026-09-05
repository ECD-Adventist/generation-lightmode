import React from "react";
import { Music, ArrowUpRight } from "lucide-react";

export default function MusicLibraryCard({ onOpen }) {
  return (
    <button type="button" onClick={onOpen} aria-haspopup="dialog"
      className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left text-card-foreground shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Music className="h-6 w-6" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold tracking-tight">Music Library</span>
        <span className="mt-1 block text-sm text-muted-foreground">Search tracks and listen to previews.</span>
      </span>
      <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}