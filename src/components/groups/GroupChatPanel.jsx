import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, X, ArrowLeft, Users, MessageCircle, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function GroupChatPanel({ group, user, onClose, allUsers = [] }) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { data: messages = [], isLoading } = useQuery({ queryKey: ["groupMessages", group.id], queryFn: () => base44.entities.GlowGroupMessage.filter({ group_id: group.id }) });
  const { data: members = [] } = useQuery({ queryKey: ["groupMembers", group.id], queryFn: () => base44.entities.GlowGroupMember.filter({ group_id: group.id }) });

  useEffect(() => { const unsub = base44.entities.GlowGroupMessage.subscribe((e) => { if (e.data?.group_id === group.id) queryClient.invalidateQueries({ queryKey: ["groupMessages", group.id] }); }); return unsub; }, [group.id, queryClient]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const sorted = [...messages].sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
  const getUserInfo = (email) => email === user?.email ? user : allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0] || "Member" };

  // Group messages by date for separators
  const getDateLabel = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  const fileInputRef = useRef(null);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    await base44.entities.GlowGroupMessage.create({ group_id: group.id, user_email: user.email, content: newMessage.trim() });
    setNewMessage("");
    setSending(false);
    inputRef.current?.focus();
  };

  const handleFileShare = async (e) => {
    const file = e.target.files?.[0];
    if (!file || sending) return;
    if (!file.type.startsWith("image/")) { return; }
    setSending(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.GlowGroupMessage.create({ group_id: group.id, user_email: user.email, content: "Shared a photo", file_url: res.file_url });
    } catch (err) { /* ignore */ }
    setSending(false);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[600px] rounded-2xl overflow-hidden font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 32px rgba(11, 63, 217, 0.1)" }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ background: "#F6F8FC", borderColor: "#E6ECF5" }}>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}><ArrowLeft className="w-4 h-4" /></button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>✨</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>{group.name}</div>
          <div className="text-[11px] flex items-center gap-1" style={{ color: "#6B7FA0" }}><Users className="w-3 h-3" /> {members.length} member{members.length !== 1 ? "s" : ""} · {group.country || "Global"}</div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#F6F8FC" }}>
        {isLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#1FB8FF" }} /></div>
        : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#EEF3FF", border: "1px solid #D6E4FF" }}><MessageCircle className="w-7 h-7" style={{ color: "#0B3FD9" }} /></div>
            <div className="font-bold mb-1" style={{ color: "#0B1B3D" }}>No messages yet</div>
            <div className="text-sm max-w-xs" style={{ color: "#6B7FA0" }}>Be the first to share a testimony or encourage your group.</div>
          </div>
        ) : sorted.map((msg, i) => {
          const isMe = msg.user_email === user.email;
          const sender = getUserInfo(msg.user_email);
          const showAvatar = !isMe && (i === 0 || sorted[i - 1]?.user_email !== msg.user_email);
          const currentDateLabel = getDateLabel(msg.created_date);
          const prevDateLabel = i > 0 ? getDateLabel(sorted[i - 1]?.created_date) : "";
          const showDateSep = currentDateLabel !== prevDateLabel;
          return (
            <React.Fragment key={msg.id}>
            {showDateSep && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ background: "#E6ECF5" }} />
                <span className="text-[10px] font-bold uppercase tracking-widest px-2" style={{ color: "#8A97B5" }}>{currentDateLabel}</span>
                <div className="flex-1 h-px" style={{ background: "#E6ECF5" }} />
              </div>
            )}
            <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              <div className="w-8 shrink-0 flex items-end">
                {showAvatar && !isMe && <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: "1px solid #E6ECF5" }}><img src={sender.profile_picture_url || defaultAvatar} className="w-full h-full object-cover" /></div>}
              </div>
              <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                {showAvatar && <span className="text-[11px] mb-1 px-1 font-semibold" style={{ color: "#6B7FA0" }}>{sender.full_name}</span>}
                <div className="px-4 py-2.5 text-sm leading-relaxed rounded-2xl" style={isMe ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", borderBottomRightRadius: "0.25rem", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)" } : { background: "#FFFFFF", color: "#0B1B3D", border: "1px solid #E6ECF5", borderBottomLeftRadius: "0.25rem" }}>
                  {msg.content}
                  {msg.file_url && (
                    <div className="mt-2">
                      <img src={msg.file_url} alt="Shared" className="max-w-[200px] rounded-lg border" style={{ borderColor: isMe ? "rgba(255,255,255,0.2)" : "#E6ECF5" }} />
                    </div>
                  )}
                </div>
                <span className="text-[10px] mt-1 px-1" style={{ color: "#8A97B5" }}>{msg.created_date ? formatDistanceToNow(new Date(msg.created_date.endsWith("Z") ? msg.created_date : msg.created_date + "Z"), { addSuffix: true }) : "just now"}</span>
              </div>
            </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="px-4 py-3 border-t flex gap-2 shrink-0" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileShare} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending} className="w-10 h-10 rounded-full flex items-center justify-center transition shrink-0" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#6B7FA0" }}>
          <ImageIcon className="w-4 h-4" />
        </button>
        <input ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Share a testimony, encourage, coordinate..." className="flex-1 rounded-full py-2.5 px-4 text-sm focus:outline-none transition" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }} />
        <button type="submit" disabled={!newMessage.trim() || sending} className="w-10 h-10 rounded-full flex items-center justify-center transition disabled:opacity-30 shrink-0" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}