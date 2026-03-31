import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const GLOW_REACTIONS = ["🌟", "🔥", "🙏", "💛", "⚡"];

export default function TerritoryPhotoCard({ photo, user, photoUser, reactions, canModerate, onRefresh }) {
  const [showReactions, setShowReactions] = useState(false);

  const myReaction = reactions.find(r => r.user_email === user?.email);

  const reactionCounts = GLOW_REACTIONS.reduce((acc, emoji) => {
    acc[emoji] = reactions.filter(r => r.reaction === emoji).length;
    return acc;
  }, {});

  const reactMutation = useMutation({
    mutationFn: async (emoji) => {
      if (!user) { toast.error("Please log in to react"); return; }
      if (myReaction) {
        if (myReaction.reaction === emoji) {
          await base44.entities.TerritoryPhotoReaction.delete(myReaction.id);
        } else {
          await base44.entities.TerritoryPhotoReaction.delete(myReaction.id);
          await base44.entities.TerritoryPhotoReaction.create({ photo_id: photo.id, user_email: user.email, reaction: emoji });
        }
      } else {
        await base44.entities.TerritoryPhotoReaction.create({ photo_id: photo.id, user_email: user.email, reaction: emoji });
      }
    },
    onSuccess: () => { onRefresh(); setShowReactions(false); }
  });

  const totalReactions = reactions.length;

  return (
    <div className="break-inside-avoid bg-[#121826] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all group">
      {/* Photo */}
      <div className="relative">
        <img
          src={photo.photo_url}
          alt={photo.caption || "Territory moment"}
          className="w-full object-cover"
          loading="lazy"
        />
        {/* Territory badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-bold text-[#00CFFF]">
          <MapPin className="w-2.5 h-2.5" />
          {photo.territory}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Author row */}
        <div className="flex items-center gap-2 mb-3">
          <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(photo.user_email)}`}>
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 border border-white/10 shrink-0">
              <img
                src={photoUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{photoUser?.full_name || photoUser?.email?.split("@")[0]}</p>
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {photo.created_date ? formatDistanceToNow(new Date(photo.created_date), { addSuffix: true }) : "recently"}
            </p>
          </div>
        </div>

        {/* Caption */}
        {photo.caption && (
          <p className="text-sm text-gray-300 leading-relaxed mb-3">{photo.caption}</p>
        )}
        {photo.event_name && (
          <p className="text-[10px] font-bold text-[#8A5CFF] uppercase tracking-wider mb-3">📍 {photo.event_name}</p>
        )}

        {/* Reactions bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowReactions(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm"
            >
              {myReaction ? myReaction.reaction : "✨"}
              <span className="text-xs text-gray-400 font-semibold">Glow</span>
            </button>

            {showReactions && (
              <div className="absolute bottom-full mb-2 left-0 flex gap-1.5 bg-[#0B0F1A] border border-white/10 rounded-2xl px-3 py-2 shadow-xl z-10">
                {GLOW_REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => reactMutation.mutate(emoji)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition hover:scale-125 ${
                      myReaction?.reaction === emoji ? "bg-[#00CFFF]/20 ring-2 ring-[#00CFFF]/40" : "hover:bg-white/10"
                    }`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reaction summary */}
          {totalReactions > 0 && (
            <div className="flex items-center gap-1">
              {GLOW_REACTIONS.filter(e => reactionCounts[e] > 0).slice(0, 3).map(emoji => (
                <span key={emoji} className="text-sm">{emoji}</span>
              ))}
              <span className="text-[11px] text-gray-500 font-semibold">{totalReactions}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}