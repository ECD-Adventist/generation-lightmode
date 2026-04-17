import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, X, ArrowLeft, Users, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function GroupChatPanel({ group, user, onClose, allUsers = [] }) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["groupMessages", group.id],
    queryFn: () => base44.entities.GlowGroupMessage.filter({ group_id: group.id }),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["groupMembers", group.id],
    queryFn: () => base44.entities.GlowGroupMember.filter({ group_id: group.id }),
  });

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = base44.entities.GlowGroupMessage.subscribe((event) => {
      if (event.data?.group_id === group.id) {
        queryClient.invalidateQueries({ queryKey: ["groupMessages", group.id] });
      }
    });
    return unsubscribe;
  }, [group.id, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0)
  );

  const getUserInfo = (email) => {
    if (email === user?.email) return user;
    return allUsers.find((u) => u.email === email) || { full_name: email?.split("@")[0] || "Member" };
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    await base44.entities.GlowGroupMessage.create({
      group_id: group.id,
      user_email: user.email,
      content: newMessage.trim(),
    });
    setNewMessage("");
    setSending(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[600px] bg-[#0B0F1A] rounded-2xl overflow-hidden border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#121826] border-b border-white/10 shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8A5CFF]/30 to-[#00CFFF]/20 flex items-center justify-center text-lg border border-white/10 shrink-0">
          ✨
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm truncate">{group.name}</div>
          <div className="text-[11px] text-gray-500 flex items-center gap-1">
            <Users className="w-3 h-3" /> {members.length} member{members.length !== 1 ? "s" : ""} · {group.country || "Global"}
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 hide-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[#00CFFF]" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-7 text-[#00CFFF]" />
            </div>
            <div className="font-bold text-white mb-1">No messages yet</div>
            <div className="text-sm text-gray-500 max-w-xs">
              Be the first to share a testimony, coordinate an activity, or encourage your group.
            </div>
          </div>
        ) : (
          sorted.map((msg, i) => {
            const isMe = msg.user_email === user.email;
            const sender = getUserInfo(msg.user_email);
            const showAvatar = !isMe && (i === 0 || sorted[i - 1]?.user_email !== msg.user_email);
            const showName = showAvatar;

            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar spacer */}
                <div className="w-8 shrink-0 flex items-end">
                  {showAvatar && !isMe && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1a2235] border border-white/10">
                      <img
                        src={sender.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                  {showName && (
                    <span className="text-[11px] text-gray-500 mb-1 px-1 font-semibold">
                      {sender.full_name}
                    </span>
                  )}
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed ${
                      isMe
                        ? "bg-gradient-to-r from-[#00CFFF] to-[#1DA1FF] text-[#0B0F1A] rounded-2xl rounded-br-md font-medium"
                        : "bg-white/[0.07] text-white rounded-2xl rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-600 mt-1 px-1">
                    {msg.created_date
                      ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })
                      : "just now"}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-4 py-3 border-t border-white/10 bg-[#121826] flex gap-2 shrink-0">
        <input
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Share a testimony, encourage, coordinate..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00CFFF]/50 transition"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="w-10 h-10 rounded-full bg-[#00CFFF] text-[#0B0F1A] flex items-center justify-center hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}