import React from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { createPageUrl } from "@/utils";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function ProfileConnectionsModal({ title, items, allUsers, currentUserEmail, currentUserFollowing, onClose, onToggleFollow }) {
  if (!title) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full sm:max-w-md max-h-[80vh] bg-[#121826] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[calc(80vh-72px)] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400">No {title.toLowerCase()} yet.</div>
          ) : (
            items.map(({ email }) => {
              const person = allUsers.find((u) => u.email === email);
              const isCurrentUser = email === currentUserEmail;
              const isFollowing = currentUserFollowing.some((f) => f.following_email === email);

              return (
                <div key={email} className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/5">
                  <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(email)}`} onClick={onClose} className="flex items-center gap-3 min-w-0">
                    <img src={person?.profile_picture_url || defaultAvatar} alt={person?.full_name || email} className="w-11 h-11 rounded-full object-cover border border-white/10" />
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{person?.full_name || email.split("@")[0]}</div>
                      <div className="text-sm text-gray-400 truncate">{email}</div>
                    </div>
                  </Link>

                  {currentUserEmail && !isCurrentUser && (
                    <button
                      onClick={() => onToggleFollow(email)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${isFollowing ? "bg-white/10 text-white border-white/10 hover:border-red-500 hover:text-red-400" : "bg-[#00CFFF] text-black border-[#00CFFF] hover:bg-[#00CFFF]/80"}`}
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