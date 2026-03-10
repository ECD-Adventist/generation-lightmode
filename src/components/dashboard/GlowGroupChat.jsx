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
      await base44.entities.GlowGroupMessage.create({
        group_id: group.id,
        user_email: user.email,
        content: newMessage
      });
      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  const getUserInfo = (email) => users.find(u => u.email === email) || { full_name: "Member" };

  return (
    <div className="flex flex-col h-[500px] bg-[#121826]/50 rounded-2xl overflow-hidden border border-white/10">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-[#00CFFF]" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">No messages yet. Start the conversation!</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_email === user.email;
            const sender = getUserInfo(msg.user_email);
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-gray-500 mb-1 px-1">{sender.full_name} • {msg.created_date ? formatDistanceToNow(new Date(msg.created_date)) : 'now'}</span>
                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMe ? 'bg-[#00CFFF] text-[#0B0F1A] rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex gap-2">
        <Input 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)} 
          placeholder="Message group..." 
          className="bg-black/20 border-white/10 text-white"
        />
        <Button type="submit" disabled={!newMessage.trim()} className="bg-[#00CFFF] text-black hover:bg-white shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}