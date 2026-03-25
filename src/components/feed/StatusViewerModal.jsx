import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const themeClasses = {
  ocean: "from-[#00CFFF] to-[#1DA1FF]",
  violet: "from-[#8A5CFF] to-[#3B1E70]",
  sunrise: "from-[#FFD000] to-[#F97316]",
  midnight: "from-[#121826] to-[#0B0F1A]",
};

export default function StatusViewerModal({ story, storyUser, isOpen, onClose }) {
  if (!story) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0B0F1A] border-white/10 text-white p-0 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <img src={storyUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt={storyUser?.full_name || "User"} className="w-10 h-10 rounded-full object-cover border border-white/10" />
          <div>
            <div className="font-bold text-white">{storyUser?.full_name || "Glow Believer"}</div>
            <div className="text-xs text-gray-400">Status update</div>
          </div>
        </div>

        {story.story_type === "image" && story.media_url ? (
          <img src={story.media_url} alt="Story" className="w-full h-[420px] object-cover" />
        ) : (
          <div className={`w-full h-[420px] bg-gradient-to-br ${themeClasses[story.background_theme] || themeClasses.ocean} flex items-center justify-center p-8 text-center`}>
            <p className="text-2xl font-bold leading-relaxed text-white">{story.text_content}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}