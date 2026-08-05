import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Music, Loader2 } from "lucide-react";

export default function TrackDetailModal({ isOpen, onClose, audioUrl, audioTitle }) {
  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["trackUsage", audioUrl],
    queryFn: () => base44.entities.GlowDrop.filter({ audio_url: audioUrl }, "created_date", 50),
    enabled: isOpen && !!audioUrl,
    staleTime: 1000 * 60 * 5,
  });

  const originator = drops[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md p-0 rounded-3xl overflow-hidden z-[2100]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
        <div className="px-5 pt-6 pb-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #EAF5FF, #F6F8FC)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
            <Music className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-black font-['Space_Grotesk'] truncate">{audioTitle || "Original audio"}</p>
            <p className="text-xs" style={{ color: "#6B7FA0" }}>
              {originator ? `Original audio by ${originator.author_name || originator.user_email?.split("@")[0] || "a member"}` : "Royalty-free track"}
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          <audio src={audioUrl} controls className="w-full h-9 mb-4" />
          <p className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: "#6B7FA0" }}>
            {drops.length} {drops.length === 1 ? "post uses" : "posts use"} this sound
          </p>
          <div className="max-h-56 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#0B3FD9" }} /></div>
            ) : drops.map(d => (
              <Link
                key={d.id}
                to={createPageUrl("Post") + `?id=${encodeURIComponent(d.id)}&user=${encodeURIComponent(d.user_email || "")}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2 rounded-xl no-underline"
                style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}
              >
                <img
                  src={d.author_avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: "#0B1B3D" }}>{d.author_name || d.user_email?.split("@")[0] || "Glow Believer"}</p>
                  <p className="text-[11px] truncate" style={{ color: "#6B7FA0" }}>{d.verse || d.reflection?.slice(0, 50) || "View post"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}