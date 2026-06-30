import React from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { createPageUrl } from "@/utils";
import CountryFlag from "@/components/common/CountryFlag";
import { getDisplayName } from "@/lib/displayName";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function ProfileConnectionsModal({ title, items, allUsers, currentUserEmail, currentUserFollowing, onClose, onToggleFollow }) {
  if (!title) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full sm:max-w-md max-h-[80vh] bg-white border border-[#E6ECF5] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6ECF5] bg-[#F6F8FC]">
          <h3 className="text-lg font-bold text-[#0B1B3D]">{title}</h3>
          <button onClick={onClose} className="text-[#6B7FA0] hover:text-[#0B1B3D] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[calc(80vh-72px)] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-5 py-10 text-center text-[#6B7FA0]">No {title.toLowerCase()} yet.</div>
          ) : (
            Array.from(new Map(items.filter(i => i.email).map(i => [i.email, i])).values()).map(({ email }) => {
              const person = allUsers.find((u) => u.email === email);
              const isCurrentUser = email === currentUserEmail;
              const isFollowing = currentUserFollowing.some((f) => f.following_email === email);

              return (
                <div key={email} className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#F0F4FA]">
                  <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(email)}`} onClick={onClose} className="flex items-center gap-3 min-w-0">
                    <img src={person?.profile_picture_url || defaultAvatar} alt={getDisplayName(person || { email })} className="w-11 h-11 rounded-full object-cover border border-[#E6ECF5]" />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#0B1B3D] truncate flex items-center gap-1.5">
                        <span className="truncate">{getDisplayName(person || { email })}</span>
                        <CountryFlag country={person?.country} size="xs" />
                      </div>
                      <div className="text-xs text-[#6B7FA0] truncate">{email}</div>
                    </div>
                  </Link>

                  {currentUserEmail && !isCurrentUser && (
                    <button
                      onClick={() => onToggleFollow(email)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${isFollowing ? "bg-[#F6F8FC] text-[#4A5878] border-[#E6ECF5] hover:bg-[#EEF3FF] hover:text-[#0B3FD9]" : "bg-gradient-to-r from-[#1FB8FF] to-[#0B3FD9] text-white border-transparent shadow-[0_2px_8px_rgba(11,63,217,0.25)] hover:opacity-90"}`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}