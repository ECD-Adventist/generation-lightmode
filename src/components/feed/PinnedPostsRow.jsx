import React from "react";
import { Pin, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Horizontal scrollable row of pinned leader announcements, shown above the main feed.
 * Tapping a pinned card scrolls/jumps to the corresponding full post in the feed
 * by setting #drop-<id> as the URL hash (the post page uses the same anchor).
 *
 * Props:
 *  - pinnedDrops: array of GlowDrop records with pinned=true
 *  - getUserInfo: (email) => user object (used to resolve leader name + photo)
 */
export default function PinnedPostsRow({ pinnedDrops = [], getUserInfo }) {
  if (!pinnedDrops || pinnedDrops.length === 0) return null;

  return (
    <div className="px-3 sm:px-4 mb-5 shrink-0">
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <Pin className="w-3.5 h-3.5" style={{ color: "#CC7A00" }} fill="#CC7A00" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#CC7A00" }}>
          Pinned Announcements
        </h3>
        <span className="text-[10px] font-bold ml-auto" style={{ color: "#8A97B5" }}>
          {pinnedDrops.length} {pinnedDrops.length === 1 ? "post" : "posts"}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
        {pinnedDrops.map((drop) => {
          const author = getUserInfo(drop.user_email);
          const previewText = drop.verse || drop.reflection || "Pinned announcement";
          const cleanPreview = previewText.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
          const postUrl = `${createPageUrl("Post")}?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`;
          return (
            <Link
              key={drop.id}
              to={postUrl}
              className="shrink-0 w-[280px] sm:w-[320px] rounded-2xl overflow-hidden relative group transition active:scale-[0.99] no-underline"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #FFFCF0 60%, #FFF8E6 100%)",
                border: "1px solid #FFE4A0",
                boxShadow: "0 4px 16px rgba(255, 159, 26, 0.18)"
              }}
            >
              {/* Pin badge */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                style={{ background: "linear-gradient(135deg, #FFD000, #FF9F1A)", color: "#0B1B3D" }}>
                📌 Pinned
              </div>

              {/* Optional media preview */}
              {drop.media_url && (
                <div className="w-full h-24 overflow-hidden">
                  <img src={drop.media_url} className="w-full h-full object-cover" alt="" />
                </div>
              )}

              <div className="p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0" style={{ border: "1.5px solid #FFD000" }}>
                    <img
                      src={author?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold truncate" style={{ color: "#0B1B3D" }}>
                      {author?.full_name || drop.user_email}
                    </div>
                    <div className="text-[9px]" style={{ color: "#8A97B5" }}>
                      {drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith("Z") ? drop.created_date : drop.created_date + "Z"), { addSuffix: true }) : ""}
                    </div>
                  </div>
                </div>

                <p className="text-[12px] leading-snug line-clamp-3 mb-2" style={{ color: "#3A4A6B" }}>
                  {cleanPreview}
                </p>

                <div className="flex items-center justify-between text-[10px] font-bold" style={{ color: "#CC7A00" }}>
                  <span>Read announcement</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}