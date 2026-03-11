import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import { createPageUrl } from "@/utils";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function ChatWindow({ conversation, currentUser, otherUser, messages, onSend, isSending }) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation || !otherUser) {
    return (
      <div className="bg-[#121826] border border-white/10 rounded-3xl min-h-[72vh] flex items-center justify-center text-center p-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Choose a conversation</h3>
          <p className="text-gray-400">Open an existing chat or start one with someone you follow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121826] border border-white/10 rounded-3xl min-h-[72vh] flex flex-col overflow-hidden">
      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
        <img src={otherUser.profile_picture_url || defaultAvatar} alt={otherUser.full_name} className="w-11 h-11 rounded-full object-cover border border-white/10" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white truncate">{otherUser.full_name}</div>
          <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(otherUser.email)}`} className="text-xs text-[#00CFFF] hover:text-white transition">View profile</Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#0F1524]">
        {messages.map((message) => {
          const isMine = message.sender_email === currentUser?.email;
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm ${isMine ? "bg-[#00CFFF] text-black" : "bg-white/10 text-white"}`}>
                {message.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          onSend(draft);
          setDraft("");
        }}
        className="px-4 py-3 border-t border-white/10 flex items-center gap-3"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message..."
          className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00CFFF]/40"
        />
        <button type="submit" disabled={!draft.trim() || isSending} className="w-11 h-11 rounded-2xl bg-[#00CFFF] text-black flex items-center justify-center disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}