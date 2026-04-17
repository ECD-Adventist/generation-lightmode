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
      <div className="rounded-[1.75rem] min-h-[72vh] flex items-center justify-center text-center p-8 font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
        <div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "#0B1B3D" }}>Choose a conversation</h3>
          <p style={{ color: "#6B7FA0" }}>Open an existing chat or start one with someone you follow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] min-h-[72vh] flex flex-col overflow-hidden font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
      <div className="px-6 py-3 border-b flex items-center justify-between gap-4" style={{ borderColor: "#E6ECF5", background: "#F6F8FC" }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-10 h-10">
            <img src={otherUser.profile_picture_url || defaultAvatar} alt={otherUser.full_name} className="w-10 h-10 rounded-full object-cover" style={{ border: "1px solid #E6ECF5" }} />
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full" style={{ border: "2px solid #F6F8FC", background: "#22C55E", boxShadow: "0 0 4px rgba(34,197,94,0.5)" }} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: "#0B1B3D" }}>{otherUser.full_name}</div>
            <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(otherUser.email)}`} className="text-xs transition" style={{ color: "#0B3FD9" }}>View profile</Link>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
            { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
            { to: "Notifications", icon: <Bell className="w-4 h-4" />, label: "Alerts" },
            { to: "Profile", icon: <User className="w-4 h-4" />, label: "Profile" },
          ].map(item => (
            <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-xs sm:text-sm font-medium" style={{ color: "#4A5878" }}
              onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}
            >
              {item.icon}<span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
          <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-xs sm:text-sm font-medium" style={{ color: "#8A97B5", border: "1px solid #E6ECF5" }}
            onMouseOver={e => { e.currentTarget.style.color = "#0B3FD9"; e.currentTarget.style.background = "#EEF3FF"; }}
            onMouseOut={e => { e.currentTarget.style.color = "#8A97B5"; e.currentTarget.style.background = "transparent"; }}
          >
            <Globe className="w-4 h-4" /> Website
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#F6F8FC" }}>
        {messages.map((message) => {
          const isMine = message.sender_email === currentUser?.email;
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] ${isMine ? "text-right" : ""}`}>
                <div className="px-4 py-3 rounded-2xl text-sm" style={isMine ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)" } : { background: "#FFFFFF", color: "#0B1B3D", border: "1px solid #E6ECF5" }}>
                  {message.content}
                  {message.file_url && (
                    <div className="mt-2">
                      <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold" style={isMine ? { background: "rgba(255,255,255,0.25)" } : { background: "#F6F8FC", color: "#0B3FD9" }}>
                        📎 View file
                      </a>
                    </div>
                  )}
                </div>
                {isMine && (
                  <div className="flex items-center justify-end gap-1 mt-1 text-xs" style={{ color: "#8A97B5" }}>
                    {message.status === "sent" && <Clock className="w-3 h-3" />}
                    {message.status === "delivered" && <Check className="w-3 h-3" />}
                    {message.status === "read" && <CheckCheck className="w-3 h-3" style={{ color: "#0B3FD9" }} />}
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
        className="px-4 py-3 border-t flex items-center gap-3"
        style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message..."
          className="flex-1 h-11 rounded-2xl px-4 focus:outline-none"
          style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || isSending}
          className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-50 transition"
          style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}
          onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
          onMouseOut={e => { e.currentTarget.style.background = "#F6F8FC"; e.currentTarget.style.color = "#4A5878"; }}
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
        <button type="submit" disabled={!draft.trim() || isSending || uploadingFile} className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-50 transition" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}