import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Lock, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function PrayerRoomModal({ isOpen, onClose, currentUser, partnerEmail, partnerName, prayerRequest }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [loadingConvo, setLoadingConvo] = useState(true);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen || !currentUser?.email || !partnerEmail) return;
    let cancelled = false;
    async function findOrCreate() {
      setLoadingConvo(true);
      const userA = [currentUser.email, partnerEmail].sort()[0];
      const userB = [currentUser.email, partnerEmail].sort()[1];
      const existing = await base44.entities.DirectConversation.filter({ participant_a: userA });
      const found = existing.find(c => c.participant_b === userB);
      if (found) { if (!cancelled) setConversationId(found.id); }
      else { const created = await base44.entities.DirectConversation.create({ participant_a: userA, participant_b: userB, last_message: "Prayer room started", last_message_at: new Date().toISOString() }); if (!cancelled) setConversationId(created.id); }
      if (!cancelled) setLoadingConvo(false);
    }
    findOrCreate();
    return () => { cancelled = true; };
  }, [isOpen, currentUser?.email, partnerEmail]);

  const { data: messages = [] } = useQuery({ queryKey: ["prayerRoomMessages", conversationId], queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: conversationId }, "created_date"), enabled: !!conversationId, refetchInterval: 3000 });

  useEffect(() => { if (!conversationId) return; const unsub = base44.entities.DirectMessage.subscribe(e => { if (e.data?.conversation_id === conversationId) queryClient.invalidateQueries({ queryKey: ["prayerRoomMessages", conversationId] }); }); return unsub; }, [conversationId, queryClient]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;
    setSending(true);
    const text = message.trim();
    setMessage("");
    await base44.entities.DirectMessage.create({ conversation_id: conversationId, sender_email: currentUser.email, recipient_email: partnerEmail, content: text, read: false });
    await base44.entities.DirectConversation.update(conversationId, { last_message: text.slice(0, 80), last_message_at: new Date().toISOString() });
    base44.entities.Notification.create({ user_email: partnerEmail, type: "message", message: `${currentUser.full_name || "Someone"} sent you a message in your prayer room.`, link: `/Messages?user=${encodeURIComponent(currentUser.email)}` }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["prayerRoomMessages", conversationId] });
    setSending(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0 flex flex-col max-h-[90vh]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
        <div className="px-5 pt-5 pb-4 border-b shrink-0" style={{ borderColor: "#E6ECF5" }}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}><Lock className="w-5 h-5 text-white" /></div>
              <div>
                <DialogTitle className="text-lg font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Prayer Room</DialogTitle>
                <DialogDescription className="text-xs" style={{ color: "#6B7FA0" }}>Private conversation with {partnerName}</DialogDescription>
              </div>
            </div>
            {prayerRequest && (
              <div className="rounded-xl p-3 mt-2" style={{ background: "rgba(11,63,217,0.06)", border: "1px solid #D6E4FF" }}>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#0B3FD9" }}><Heart className="w-3 h-3" /> Prayer Request</div>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#3A4A6B" }}>{prayerRequest}</p>
              </div>
            )}
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0" style={{ background: "#F6F8FC" }}>
          {loadingConvo ? <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#0B3FD9" }} /></div>
          : messages.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#8A97B5" }}>
              <Lock className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">This is a private prayer room.</p>
              <p className="text-xs mt-1">Send the first message to begin praying together.</p>
            </div>
          ) : messages.map(msg => {
            const isMe = msg.sender_email === currentUser.email;
            const postedAt = msg.created_date ? new Date(msg.created_date.endsWith("Z") ? msg.created_date : msg.created_date + "Z") : null;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%] rounded-2xl px-4 py-2.5" style={isMe ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" } : { background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {postedAt && <p className="text-[10px] mt-1" style={isMe ? { color: "rgba(255,255,255,0.6)" } : { color: "#8A97B5" }}>{formatDistanceToNow(postedAt, { addSuffix: true })}</p>}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="px-5 py-4 border-t shrink-0" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
          <form onSubmit={handleSend} className="flex gap-2">
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your prayer or encouragement..." disabled={loadingConvo || sending} className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none transition" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }} />
            <Button type="submit" disabled={!message.trim() || sending || loadingConvo} className="w-12 h-12 rounded-xl shrink-0 p-0" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}