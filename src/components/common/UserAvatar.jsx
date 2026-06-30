import React from "react";

export const getAvatarUrl = (user) => user?.author_avatar || user?.profile_picture || user?.profile_picture_url || user?.leader_profile_picture_url || "";

export const getInitials = (user) => {
  const source = user?.username || user?.display_name || user?.full_name || user?.author_name || user?.email || "?";
  return source.trim().charAt(0).toUpperCase() || "?";
};

export default function UserAvatar({ user, className = "w-10 h-10", imgClassName = "w-full h-full object-cover", style = {}, alt = "Profile" }) {
  const avatarUrl = getAvatarUrl(user);
  if (avatarUrl) {
    return (
      <div className={`${className} rounded-full overflow-hidden shrink-0 flex-shrink-0 flex items-center justify-center`} style={style}>
        <img src={avatarUrl} alt={alt} className={imgClassName} />
      </div>
    );
  }
  return (
    <div className={`${className} rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0 flex-shrink-0 overflow-hidden`} style={style} aria-label={alt}>
      {getInitials(user)}
    </div>
  );
}