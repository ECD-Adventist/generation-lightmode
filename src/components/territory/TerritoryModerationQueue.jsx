import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { X, CheckCircle, XCircle, MapPin, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function TerritoryModerationQueue({ user, pendingPhotos, allUsers, onClose, onRefresh }) {
  const getUserInfo = (email) => {
    if (user?.email === email) return user;
    return allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0], email };
  };

  const moderateMutation = useMutation({
    mutationFn: async ({ photoId, status }) => {
      await base44.entities.TerritoryPhoto.update(photoId, { status, reviewed_by: user.email });
    },
    onSuccess: (_, { status }) => {
      onRefresh();
      toast.success(status === "approved" ? "✅ Photo approved and published!" : "❌ Photo rejected.");
    },
  });

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0B0F1A] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-lg font-black font-['Space_Grotesk'] text-white">Moderation Queue</h2>
            <p className="text-xs text-gray-400 mt-0.5">{pendingPhotos.length} photo{pendingPhotos.length !== 1 ? "s" : ""} awaiting review</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {pendingPhotos.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-bold">All caught up! No pending photos.</p>
            </div>
          ) : (
            pendingPhotos.map(photo => {
              const photoUser = getUserInfo(photo.user_email);
              const isPending = moderateMutation.isPending && moderateMutation.variables?.photoId === photo.id;
              return (
                <div key={photo.id} className="bg-[#121826] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <img
                      src={photo.photo_url}
                      alt="Pending photo"
                      className="w-24 h-24 object-cover rounded-xl shrink-0 bg-black"
                    />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={photoUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-sm font-bold text-white truncate">{photoUser?.full_name || photoUser?.email?.split("@")[0]}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#00CFFF] mb-1">
                        <MapPin className="w-3 h-3" /> {photo.territory}
                      </div>
                      {photo.event_name && <p className="text-[11px] text-[#8A5CFF] font-semibold mb-1">📍 {photo.event_name}</p>}
                      {photo.caption && <p className="text-xs text-gray-400 line-clamp-2">{photo.caption}</p>}
                      <p className="text-[10px] text-gray-600 mt-1">
                        {photo.created_date ? formatDistanceToNow(new Date(photo.created_date), { addSuffix: true }) : "recently"}
                      </p>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex border-t border-white/5">
                    <button
                      onClick={() => moderateMutation.mutate({ photoId: photo.id, status: "approved" })}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-green-400 hover:bg-green-500/10 transition disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                    </button>
                    <div className="w-px bg-white/5" />
                    <button
                      onClick={() => moderateMutation.mutate({ photoId: photo.id, status: "rejected" })}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}