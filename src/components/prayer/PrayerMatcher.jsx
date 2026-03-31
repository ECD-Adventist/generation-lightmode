import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Loader2, Flame, Zap, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PrayerMatcher({ currentUser }) {
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [initiatingDM, setInitiatingDM] = useState(false);

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["prayerMatches", currentUser?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke("matchPrayerRequests", {});
      return res.data.matches || [];
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["prayerMatchUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5,
  });

  const { data: prayerSupports = [] } = useQuery({
    queryKey: ["myPrayerSupports", currentUser?.email],
    queryFn: () => base44.entities.PrayerSupport.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser,
  });

  const supportMutation = useMutation({
    mutationFn: async (requestId) => {
      const alreadySupporting = prayerSupports.some(ps => ps.request_id === requestId);
      if (alreadySupporting) {
        toast.error("You already support this prayer request");
        return;
      }

      await base44.entities.PrayerSupport.create({
        request_id: requestId,
        user_email: currentUser.email,
      });

      // Notify the prayer requester
      const prayerReq = matches.find(m => m.id === requestId);
      if (prayerReq) {
        const reqAuthor = allUsers.find(u => u.email === prayerReq.user_email);
        await base44.entities.Notification.create({
          user_email: prayerReq.user_email,
          type: "reply",
          message: `${currentUser.full_name || 'Someone'} is praying for your request.`,
          link: createPageUrl("PrayerWall") + `?request=${encodeURIComponent(requestId)}`,
        }).catch(() => {});
      }

      return requestId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPrayerSupports"] });
      toast.success("Prayer support added! 🙏");
    },
  });

  const initiateDMMutation = useMutation({
    mutationFn: async (recipientEmail) => {
      setInitiatingDM(true);
      try {
        // Check if conversation already exists
        const existing = await base44.entities.DirectConversation.filter({
          participant_a: currentUser.email,
          participant_b: recipientEmail,
        });

        let convId;
        if (existing.length > 0) {
          convId = existing[0].id;
        } else {
          // Create new conversation
          const newConv = await base44.entities.DirectConversation.create({
            participant_a: currentUser.email,
            participant_b: recipientEmail,
          });
          convId = newConv.id;
        }

        // Send initial message
        await base44.entities.DirectMessage.create({
          conversation_id: convId,
          sender_email: currentUser.email,
          recipient_email: recipientEmail,
          content: `Hi! I saw your prayer request and wanted to reach out. I'm here to pray with you. 🙏`,
        });

        // Notify recipient
        const recipient = allUsers.find(u => u.email === recipientEmail);
        await base44.entities.Notification.create({
          user_email: recipientEmail,
          type: "message",
          message: `${currentUser.full_name || 'Someone'} sent you a prayer support message.`,
          link: createPageUrl("Messages") + `?user=${encodeURIComponent(currentUser.email)}`,
        }).catch(() => {});

        toast.success("Message sent! Check Messages.");
        return convId;
      } finally {
        setInitiatingDM(false);
      }
    },
    onSuccess: () => {
      setSelectedMatch(null);
    },
  });

  const isAlreadySupporting = (requestId) => {
    return prayerSupports.some(ps => ps.request_id === requestId);
  };

  return (
    <div className="space-y-6">
      {matchesLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 bg-[#121826] border border-white/10 rounded-2xl">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-bold text-white mb-2">No matches yet</h3>
          <p className="text-gray-400 mb-6">No prayer requests match your profile right now. Check back soon!</p>
          <Link to={createPageUrl("PrayerWall")} className="inline-block px-5 py-2 bg-[#00CFFF] text-black font-bold rounded-lg hover:bg-[#00CFFF]/80 transition text-sm">
            Browse All Requests
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((prayer, idx) => {
            const author = allUsers.find(u => u.email === prayer.user_email);
            const isSupporting = isAlreadySupporting(prayer.id);

            return (
              <div
                key={prayer.id}
                className="bg-[#121826] border border-white/10 rounded-2xl p-5 hover:border-[#00CFFF]/20 transition group"
              >
                {/* Match Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20">
                      <Flame className="w-3.5 h-3.5 text-[#FFD000]" />
                      <span className="text-xs font-bold text-[#00CFFF] uppercase tracking-wider">
                        {Math.round(prayer.matchScore)}% Match
                      </span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    prayer.category === "Health"
                      ? "bg-red-500/20 text-red-400"
                      : prayer.category === "Family"
                      ? "bg-blue-500/20 text-blue-400"
                      : prayer.category === "Finance"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-purple-500/20 text-purple-400"
                  }`}>
                    {prayer.category}
                  </span>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px] flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-[#121826] flex items-center justify-center overflow-hidden">
                      <img src={author?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{author?.full_name || "Anonymous"}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      {author?.country && (
                        <>
                          <MapPin className="w-3 h-3" />
                          <span>{author.country}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prayer Content */}
                <p className="text-sm text-gray-300 mb-4 line-clamp-3">{prayer.content}</p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {prayer.created_date ? formatDistanceToNow(new Date(prayer.created_date), { addSuffix: true }) : "just now"}
                  </div>
                  <div>
                    {prayer.is_anonymous && <span className="text-[10px] text-gray-500">🔒 Anonymous</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => supportMutation.mutate(prayer.id)}
                    disabled={isSupporting || supportMutation.isPending}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition ${
                      isSupporting
                        ? "bg-white/5 text-gray-500 cursor-not-allowed"
                        : "bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/20 hover:bg-[#00CFFF]/20"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isSupporting ? "fill-current" : ""}`} />
                    {isSupporting ? "Supporting" : "Support Prayer"}
                  </button>

                  <button
                    onClick={() => setSelectedMatch(prayer.id === selectedMatch ? null : prayer.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-white/10 text-white hover:bg-white/20 transition border border-white/10"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </div>

                {/* DM Compose */}
                {selectedMatch === prayer.id && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <p className="text-xs text-gray-400">Send a direct message to offer prayer support:</p>
                    <button
                      onClick={() => initiateDMMutation.mutate(prayer.user_email)}
                      disabled={initiatingDM || initiateDMMutation.isPending}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-[#00CFFF]/20 to-[#8A5CFF]/20 text-[#00CFFF] font-bold rounded-lg hover:from-[#00CFFF]/30 hover:to-[#8A5CFF]/30 transition disabled:opacity-50"
                    >
                      {initiatingDM ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Prayer Support Chat"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}