import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Paperclip, Check, CheckCheck, Clock, Home, Zap, Bell, User, Globe } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function ChatWindow({ conversation, currentUser, otherUser, messages, onSend, isSending }) {
  const [draft, setDraft] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
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
      <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between gap-4 bg-[#0F1524]">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-10 h-10">
            <img src={otherUser.profile_picture_url || defaultAvatar} alt={otherUser.full_name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0F1524] bg-green-400 shadow-[0_0_5px_#4ade80]" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-white text-sm truncate">{otherUser.full_name}</div>
            <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(otherUser.email)}`} className="text-xs text-[#00CFFF] hover:text-white transition">View profile</Link>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-xs sm:text-sm font-medium">
            <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
          </Link>
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-xs sm:text-sm font-medium">
            <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link to={createPageUrl("Notifications")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-xs sm:text-sm font-medium">
            <Bell className="w-4 h-4" /><span className="hidden sm:inline">Alerts</span>
          </Link>
          <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-xs sm:text-sm font-medium">
            <User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
          </Link>
          <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-xs sm:text-sm font-medium border border-white/5">
            <Globe className="w-4 h-4" /> Website
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#0F1524]">
        {messages.map((message) => {
          const isMine = message.sender_email === currentUser?.email;
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] ${isMine ? "text-right" : ""}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm ${isMine ? "bg-[#00CFFF] text-black" : "bg-white/10 text-white"}`}>
                  {message.content}
                  {message.file_url && (
                    <div className="mt-2">
                      <a href={message.file_url} target="_blank" rel="noopener noreferrer" className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${isMine ? "bg-black/20" : "bg-white/20"}`}>
                        📎 View file
                      </a>
                    </div>
                  )}
                </div>
                {isMine && (
                  <div className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-400">
                    {message.status === "sent" && <Clock className="w-3 h-3" />}
                    {message.status === "delivered" && <Check className="w-3 h-3" />}
                    {message.status === "read" && <CheckCheck className="w-3 h-3 text-[#00CFFF]" />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          onSend({ content: draft, file_url: null });
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || isSending}
          className="w-11 h-11 rounded-2xl bg-white/10 text-gray-400 hover:text-white flex items-center justify-center disabled:opacity-50 transition"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setUploadingFile(true);
            try {
              const res = await base44.integrations.Core.UploadFile({ file });
              onSend({ content: draft || `Shared a file: ${file.name}`, file_url: res.file_url });
              setDraft("");
              fileInputRef.current.value = "";
            } catch (err) {
              toast.error("Failed to upload file");
            } finally {
              setUploadingFile(false);
            }
          }}
          className="hidden"
        />
        <button type="submit" disabled={!draft.trim() || isSending || uploadingFile} className="w-11 h-11 rounded-2xl bg-[#00CFFF] text-black flex items-center justify-center disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}