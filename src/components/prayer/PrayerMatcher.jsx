import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Loader2, Flame, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function PrayerMatcher({ currentUser }) {
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [initiatingDM, setInitiatingDM] = useState(false);

  const { data: matches = [], isLoading: matchesLoading } = useQuery({ queryKey: ["prayerMatches", currentUser?.email], queryFn: async () => { const res = await base44.functions.invoke("matchPrayerRequests", {}); return res.data.matches || []; }, enabled: !!currentUser, staleTime: 300000, refetchInterval: 60000 });
  const { data: allUsers = [] } = useQuery({ queryKey: ["prayerMatchUsers"], queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; }, enabled: !!currentUser, staleTime: 300000 });
  const { data: prayerSupports = [] } = useQuery({ queryKey: ["myPrayerSupports", currentUser?.email], queryFn: () => base44.entities.PrayerSupport.filter({ user_email: currentUser?.email }), enabled: !!currentUser });

  const supportMutation = useMutation({
    mutationFn: async (requestId) => {
      if (prayerSupports.some(ps => ps.request_id === requestId)) { toast.error("Already supporting"); return; }
      await base44.entities.PrayerSupport.create({ request_id: requestId, user_email: currentUser.email });
      const req = matches.find(m => m.id === requestId);
      if (req) await base44.entities.Notification.create({ user_email: req.user_email, type: "reply", message: `${currentUser.full_name || 'Someone'} is praying for your request.`, link: createPageUrl("PrayerWall") + `?request=${encodeURIComponent(requestId)}` }).catch(() => {});
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["myPrayerSupports"] }); toast.success("Prayer support added! 🙏"); }
  });

  const initiateDMMutation = useMutation({
    mutationFn: async (recipientEmail) => {
      setInitiatingDM(true);
      try {
        const existing = await base44.entities.DirectConversation.filter({ participant_a: currentUser.email, participant_b: recipientEmail });
        let convId = existing[0]?.id;
        if (!convId) { const c = await base44.entities.DirectConversation.create({ participant_a: currentUser.email, participant_b: recipientEmail }); convId = c.id; }
        await base44.entities.DirectMessage.create({ conversation_id: convId, sender_email: currentUser.email, recipient_email: recipientEmail, content: `Hi! I saw your prayer request and wanted to reach out. I'm here to pray with you. 🙏` });
        await base44.entities.Notification.create({ user_email: recipientEmail, type: "message", message: `${currentUser.full_name || 'Someone'} sent you a prayer support message.`, link: createPageUrl("Messages") + `?user=${encodeURIComponent(currentUser.email)}` }).catch(() => {});
        toast.success("Message sent! Check Messages.");
      } finally { setInitiatingDM(false); }
    },
    onSuccess: () => setSelectedMatch(null)
  });

  const isAlreadySupporting = (id) => prayerSupports.some(ps => ps.request_id === id);
  const catColors = { Health: { bg: "rgba(239,68,68,0.08)", border: "#FCA5A5", color: "#DC2626" }, Family: { bg: "rgba(59,130,246,0.08)", border: "#93C5FD", color: "#2563EB" }, Finance: { bg: "rgba(34,197,94,0.08)", border: "#86EFAC", color: "#16A34A" } };

  return (
    <div className="space-y-6 font-['Inter']">
      {matchesLoading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>
      : matches.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "#8A97B5" }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: "#0B1B3D" }}>No matches yet</h3>
          <p className="mb-6" style={{ color: "#6B7FA0" }}>No prayer requests match your profile right now.</p>
          <Link to={createPageUrl("PrayerWall")} className="inline-block px-5 py-2 font-bold rounded-lg text-sm" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>Browse All Requests</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map(prayer => {
            const author = allUsers.find(u => u.email === prayer.user_email);
            const isSupporting = isAlreadySupporting(prayer.id);
            const cat = catColors[prayer.category] || { bg: "rgba(11,63,217,0.06)", border: "#D6E4FF", color: "#0B3FD9" };
            return (
              <div key={prayer.id} className="rounded-2xl p-5 transition group" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(31,184,255,0.08)", border: "1px solid #B8E5FF" }}>
                    <Flame className="w-3.5 h-3.5" style={{ color: "#CC7A00" }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0B3FD9" }}>{Math.round(prayer.matchScore)}% Match</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider" style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>{prayer.category}</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full p-[2px] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
                    <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF" }}><img src={author?.profile_picture_url || defaultAvatar} className="w-full h-full object-cover" /></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "#0B1B3D" }}>{author?.full_name || "Anonymous"}</div>
                    {author?.country && <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#6B7FA0" }}><MapPin className="w-3 h-3" />{author.country}</div>}
                  </div>
                </div>
                <p className="text-sm mb-4 line-clamp-3" style={{ color: "#3A4A6B" }}>{prayer.content}</p>
                <div className="flex items-center justify-between text-xs mb-4 pb-4 border-b" style={{ color: "#8A97B5", borderColor: "#E6ECF5" }}>
                  <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{prayer.created_date ? formatDistanceToNow(new Date(prayer.created_date), { addSuffix: true }) : "just now"}</div>
                  {prayer.is_anonymous && <span className="text-[10px]">🔒 Anonymous</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => supportMutation.mutate(prayer.id)} disabled={isSupporting || supportMutation.isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition" style={isSupporting ? { background: "#F6F8FC", color: "#8A97B5", border: "1px solid #E6ECF5" } : { background: "rgba(31,184,255,0.08)", color: "#0B3FD9", border: "1px solid #B8E5FF" }}>
                    <Heart className={`w-4 h-4 ${isSupporting ? "fill-current" : ""}`} />{isSupporting ? "Supporting" : "Support Prayer"}
                  </button>
                  <button onClick={() => setSelectedMatch(prayer.id === selectedMatch ? null : prayer.id)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition" style={{ background: "#F6F8FC", color: "#0B1B3D", border: "1px solid #E6ECF5" }}>
                    <MessageCircle className="w-4 h-4" />Message
                  </button>
                </div>
                {selectedMatch === prayer.id && (
                  <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: "#E6ECF5" }}>
                    <p className="text-xs" style={{ color: "#6B7FA0" }}>Send a direct message to offer prayer support:</p>
                    <button onClick={() => initiateDMMutation.mutate(prayer.user_email)} disabled={initiatingDM} className="w-full px-4 py-2.5 font-bold rounded-lg transition disabled:opacity-50" style={{ background: "linear-gradient(90deg, rgba(31,184,255,0.1), rgba(11,63,217,0.1))", color: "#0B3FD9", border: "1px solid #D6E4FF" }}>
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