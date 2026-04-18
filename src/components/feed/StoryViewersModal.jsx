import React from "react";
import { X, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function StoryViewersModal({ storyId, isOpen, onClose, allUsers: propUsers }) {
  const { data: fetchedUsers = [] } = useQuery({
    queryKey: ["viewerModalUsers"],
    queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; },
    enabled: isOpen,
  });
  const allUsers = propUsers?.length > 0 ? propUsers : fetchedUsers;

  const { data: views = [], isLoading } = useQuery({
    queryKey: ["storyViewersModal", storyId],
    queryFn: () => base44.entities.StoryView.filter({ story_id: storyId }),
    enabled: !!storyId && isOpen,
  });

  const { data: reactions = [] } = useQuery({
    queryKey: ["storyReactionsModal", storyId],
    queryFn: () => base44.entities.StoryReaction.filter({ story_id: storyId }),
    enabled: !!storyId && isOpen,
  });

  if (!isOpen) return null;

  const uniqueEmails = [...new Set(views.map(v => v.viewer_email))];
  const getUserInfo = (email) => allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0], email };
  const getReaction = (email) => reactions.find(r => r.user_email === email);

  const EMOJI_MAP = { like: "❤️", fire: "🔥", pray: "🙏", sparkle: "✨", heart_eyes: "😍", clap: "👏" };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md max-h-[70vh] rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 -8px 40px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "#D6E4FF" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" style={{ color: "#1FB8FF" }} />
            <h3 className="font-bold text-base" style={{ color: "#0B1B3D" }}>
              {uniqueEmails.length} Viewer{uniqueEmails.length !== 1 ? "s" : ""}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F6F8FC", color: "#4A5878" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewer list */}
        <div className="overflow-y-auto px-3 py-3 space-y-1" style={{ maxHeight: "calc(70vh - 80px)" }}>
          {isLoading ? (
            <div className="py-10 text-center" style={{ color: "#8A97B5" }}>Loading...</div>
          ) : uniqueEmails.length === 0 ? (
            <div className="py-10 text-center" style={{ color: "#8A97B5" }}>
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No viewers yet</p>
            </div>
          ) : (
            uniqueEmails.map((email) => {
              const u = getUserInfo(email);
              const reaction = getReaction(email);
              return (
                <Link
                  key={email}
                  to={createPageUrl("Profile") + `?user=${encodeURIComponent(email)}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition hover:bg-[#F6F8FC]"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid #E6ECF5" }}>
                    <img src={u.profile_picture_url || defaultAvatar} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "#0B1B3D" }}>{u.full_name}</p>
                    {u.country && <p className="text-[11px]" style={{ color: "#6B7FA0" }}>{u.country}</p>}
                  </div>
                  {reaction && (
                    <span className="text-lg">{EMOJI_MAP[reaction.reaction_type] || "❤️"}</span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}