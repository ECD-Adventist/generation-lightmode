import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, Bookmark } from "lucide-react";
import DropCard from "@/components/feed/DropCard";
import MobilePageHeader from "@/components/mobile/MobilePageHeader";

export default function MobileSaved({ loading, mySavedDrops, user, getUserInfo, likeMutation, handleShare, userLikes, savedRecords, users }) {
  return (
    <div className="min-h-screen pb-24 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <MobilePageHeader title="Saved" subtitle={mySavedDrops.length ? `${mySavedDrops.length} drops` : "Bookmarks"} />

      <div className="px-3 py-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>
        ) : mySavedDrops.length === 0 ? (
          <div className="text-center py-16 rounded-3xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#EEF3FF" }}>
              <Bookmark className="w-8 h-8" style={{ color: "#0B3FD9" }} />
            </div>
            <p className="font-black text-base" style={{ color: "#0B1B3D" }}>No saved drops yet</p>
            <p className="text-[13px] mt-1 px-6" style={{ color: "#6B7FA0" }}>Bookmark posts you love and they'll show up here.</p>
            <Link to={createPageUrl("Feed")} className="inline-block mt-5 px-5 py-2.5 rounded-full font-bold text-sm" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
              Explore Feed
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mySavedDrops.map(drop => (
              <DropCard
                key={drop.id}
                drop={drop}
                user={user}
                dropUser={getUserInfo(drop.user_email)}
                likeMutation={likeMutation}
                handleShare={handleShare}
                userLikes={userLikes}
                savedDropRecords={savedRecords}
                allUsers={users}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}