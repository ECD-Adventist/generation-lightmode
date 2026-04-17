import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function GlowGroupChat({ group, user }) {
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();
  const bottomRef = useRef(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["groupMessages", group.id],
    queryFn: () => base44.entities.GlowGroupMessage.filter({ group_id: group.id })
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list()
  });

  useEffect(() => {
    const unsubscribe = base44.entities.GlowGroupMessage.subscribe((event) => {
      if ((event.type === 'create' || event.type === 'update') && event.data.group_id === group.id) {
        queryClient.invalidateQueries({ queryKey: ["groupMessages", group.id] });
      }
    });
    return unsubscribe;
  }, [group.id, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await base44.entities.GlowGroupMessage.create({ group_id: group.id, user_email: user.email, content: newMessage });
      setNewMessage("");
    } catch (err) { console.error(err); }
  };

  const getUserInfo = (email) => users.find(u => u.email === email) || { full_name: "Member" };

  return (
    <div className="flex flex-col h-[500px] rounded-2xl overflow-hidden font-['Inter']" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" style={{ color: "#1FB8FF" }} /></div>
        ) : messages.length === 0 ? (
          <div className="text-center mt-10" style={{ color: "#8A97B5" }}>No messages yet. Start the conversation!</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_email === user.email;
            const sender = getUserInfo(msg.user_email);
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-xs mb-1 px-1" style={{ color: "#8A97B5" }}>{sender.full_name} • {msg.created_date ? formatDistanceToNow(new Date(msg.created_date)) : 'now'}</span>
                <div className="px-4 py-2 rounded-2xl max-w-[80%]" style={isMe ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", borderBottomRightRadius: "0.25rem", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)" } : { background: "#FFFFFF", color: "#0B1B3D", border: "1px solid #E6ECF5", borderBottomLeftRadius: "0.25rem" }}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t flex gap-2" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Message group..."
          style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
        />
        <Button type="submit" disabled={!newMessage.trim()} className="shrink-0" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", border: "none", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}