import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Music, Search } from "lucide-react";

export default function MusicPickerModal({ isOpen, onClose, onSelect }) {
  const [search, setSearch] = useState("");

  const { data: tracks = [], isLoading, isError } = useQuery({
    queryKey: ["musicLibrary", search],
    queryFn: async () => {
      const res = await base44.functions.invoke("browseMusicLibrary", { search });
      return res.data?.tracks || [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg max-h-[80vh] overflow-hidden z-[2100] p-0 rounded-3xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-lg font-black font-['Space_Grotesk'] flex items-center gap-2">
            <Music className="w-5 h-5" style={{ color: "#0B3FD9" }} /> Music Library
          </h2>
          <p className="text-xs mt-1" style={{ color: "#6B7FA0" }}>Royalty-free tracks from the shared drive</p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8A97B5" }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracks..."
              className="h-11 rounded-xl pl-9"
              style={{ background: "#F6F8FC", border: "1px solid #E0EAF5" }}
            />
          </div>
        </div>

        <div className="px-5 pb-5 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#0B3FD9" }} /></div>
          ) : isError ? (
            <p className="text-center text-sm py-10" style={{ color: "#8A97B5" }}>Could not load the music library. Try again.</p>
          ) : tracks.length === 0 ? (
            <p className="text-center text-sm py-10" style={{ color: "#8A97B5" }}>No tracks found.</p>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => (
                <div key={track.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{track.name}</p>
                    <audio src={track.audio_url} controls preload="none" className="w-full h-8 mt-1" />
                  </div>
                  <button
                    type="button"
                    onClick={() => { onSelect({ audio_url: track.audio_url, audio_title: track.name }); onClose(); }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-black shrink-0"
                    style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}
                  >
                    USE
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}