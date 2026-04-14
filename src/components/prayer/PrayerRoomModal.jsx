import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Lock, Heart, X } from "lucide-react";
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

  // Find or create the conversation between these two users
  useEffect(() => {
    if (!isOpen || !currentUser?.email || !partnerEmail) return;
    let cancelled = false;

    async function findOrCreate() {
      setLoadingConvo(true);
      const userA = [currentUser.email, partnerEmail].sort()[0];
      const userB = [currentUser.email, partnerEmail].sort()[1];

      const existing = await base44.entities.DirectConversation.filter({ participant_a: userA });
      const found = existing.find(c => c.participant_b === userB);

      if (found) {
        if (!cancelled) setConversationId(found.id);
      } else {
        const created = await base44.entities.DirectConversation.create({
          participant_a: userA,
          participant_b: userB,
          last_message: `Prayer room started`,
          last_message_at: new Date().toISOString(),
        });
        if (!cancelled) setConversationId(created.id);
      }

      if (!cancelled) setLoadingConvo(false);
    }

    findOrCreate();
    return () => { cancelled = true; };
  }, [isOpen, currentUser?.email, partnerEmail]);

  const { data: messages = [] } = useQuery({
    queryKey: ["prayerRoomMessages", conversationId],
    queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: conversationId }, "created_date"),
    enabled: !!conversationId,
    refetchInterval: 3000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;
    const unsub = base44.entities.DirectMessage.subscribe((event) => {
      if (event.data?.conversation_id === conversationId) {
        queryClient.invalidateQueries({ queryKey: ["prayerRoomMessages", conversationId] });
      }
    });
    return unsub;
  }, [conversationId, queryClient]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;
    setSending(true);
    const text = message.trim();
    setMessage("");

    await base44.entities.DirectMessage.create({
      conversation_id: conversationId,
      sender_email: currentUser.email,
      recipient_email: partnerEmail,
      content: text,
      read: false,
    });

    await base44.entities.DirectConversation.update(conversationId, {
      last_message: text.slice(0, 80),
      last_message_at: new Date().toISOString(),
    });

    // Notify partner
    base44.entities.Notification.create({
      user_email: partnerEmail,
      type: "message",
      message: `${currentUser.full_name || "Someone"} sent you a message in your prayer room.`,
      link: `/Messages?user=${encodeURIComponent(currentUser.email)}`,
    }).catch(() => {});

    queryClient.invalidateQueries({ queryKey: ["prayerRoomMessages", conversationId] });
    setSending(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-[#0B0F1A] text-white border-white/10 p-0 overflow-hidden gap-0 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5 shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8A5CFF] to-[#00CFFF] flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  Prayer Room
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-xs">
                  Private conversation with {partnerName}
                </DialogDescription>
              </div>
            </div>
            {prayerRequest && (
              <div className="bg-[#8A5CFF]/10 border border-[#8A5CFF]/20 rounded-xl p-3 mt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-[#8A5CFF] font-bold uppercase tracking-wider mb-1">
                  <Heart className="w-3 h-3" /> Prayer Request
                </div>
                <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">{prayerRequest}</p>
              </div>
            )}
          </DialogHeader>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
          {loadingConvo ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#8A5CFF] animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <Lock className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">This is a private prayer room.</p>
              <p className="text-xs mt-1">Send the first message to begin praying together.</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_email === currentUser.email;
              const postedAt = msg.created_date
                ? new Date(msg.created_date.endsWith("Z") ? msg.created_date : msg.created_date + "Z")
                : null;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-[#8A5CFF] text-white" : "bg-[#121826] border border-white/10 text-white"}`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    {postedAt && (
                      <p className={`text-[10px] mt-1 ${isMe ? "text-white/50" : "text-gray-600"}`}>
                        {formatDistanceToNow(postedAt, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-white/5 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your prayer or encouragement..."
              disabled={loadingConvo || sending}
              className="flex-1 bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8A5CFF]/50 transition"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sending || loadingConvo}
              className="w-12 h-12 rounded-xl bg-[#8A5CFF] hover:bg-[#8A5CFF]/80 shrink-0 p-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}