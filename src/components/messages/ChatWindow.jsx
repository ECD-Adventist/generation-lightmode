import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Paperclip, Check, CheckCheck, Clock, ArrowLeft, Trash2, MoreVertical } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { getDisplayName } from "@/lib/displayName";
import UserAvatar from "@/components/common/UserAvatar";

function parseDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
}

function formatMessageTime(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return "";
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday " + format(d, "HH:mm");
  return format(d, "MMM d, HH:mm");
}

function formatDayDivider(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return "";
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

export default function ChatWindow({ conversation, currentUser, otherUser, messages, onSend, isSending, onBack, onDeleteMessage }) {
  const [draft, setDraft] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const close = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [menuOpenId]);

  if (!conversation || !otherUser) {
    return (
      <div
        className="rounded-[1.5rem] lg:rounded-[1.75rem] h-[calc(100vh-9rem)] lg:h-[72vh] flex items-center justify-center text-center p-8 font-['Inter']"
        style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}
      >
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #F6F8FC 100%)" }}>
            <Send className="w-7 h-7" style={{ color: "#0B3FD9" }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "#0B1B3D" }}>Your messages</h3>
          <p style={{ color: "#6B7FA0" }}>Select a conversation or start a new one to begin chatting.</p>
        </div>
      </div>
    );
  }

  let lastDay = null;

  return (
    <div
      className="rounded-[1.5rem] lg:rounded-[1.75rem] h-[calc(100vh-9rem)] lg:h-[72vh] flex flex-col overflow-hidden font-['Inter']"
      style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}
    >
      <div className="px-4 sm:px-6 py-3 border-b flex items-center gap-3" style={{ borderColor: "#E6ECF5", background: "#F6F8FC" }}>
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition"
            style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(otherUser.email)}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <UserAvatar
              user={otherUser}
              alt={getDisplayName(otherUser)}
              className="flex-shrink-0"
              style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", overflow: "hidden", border: "1px solid #E6ECF5" }}
            />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: "#0B1B3D" }}>
              {getDisplayName(otherUser)}
            </div>
            <div className="text-xs truncate" style={{ color: "#6B7FA0" }}>
              View profile
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1 messages-scroll" style={{ background: "linear-gradient(180deg, #F6F8FC 0%, #EEF3FF 100%)" }}>
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
              <Send className="w-5 h-5" style={{ color: "#0B3FD9" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "#0B1B3D" }}>No messages yet</p>
            <p className="text-xs mt-1" style={{ color: "#8A97B5" }}>Send a message to start the conversation.</p>
          </div>
        )}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUser?.id;
          const msgDay = message.created_date ? formatDayDivider(message.created_date) : "";
          const showDayDivider = msgDay && msgDay !== lastDay;
          lastDay = msgDay;

          return (
            <React.Fragment key={message.id}>
              {showDayDivider && (
                <div className="flex justify-center my-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                    style={{ background: "#FFFFFF", color: "#6B7FA0", border: "1px solid #E6ECF5" }}
                  >
                    {msgDay}
                  </span>
                </div>
              )}
              <div className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
                <div className={`max-w-[85%] sm:max-w-[75%] relative ${isMine ? "text-right" : ""}`}>
                  <div className="flex items-center gap-1">
                    {isMine && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === message.id ? null : message.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center transition"
                          style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#6B7FA0" }}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {menuOpenId === message.id && (
                          <div
                            className="absolute right-0 mt-1 rounded-lg z-50 overflow-hidden"
                            style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.12)" }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                                onDeleteMessage?.(message.id);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap transition"
                              style={{ color: "#DC2626" }}
                              onMouseOver={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className="px-4 py-2.5 rounded-2xl text-sm break-words"
                      style={
                        isMine
                          ? {
                              background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)",
                              color: "#FFFFFF",
                              boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)",
                              borderTopRightRadius: "0.375rem",
                              textAlign: "left",
                            }
                          : {
                              background: "#FFFFFF",
                              color: "#0B1B3D",
                              border: "1px solid #E6ECF5",
                              borderTopLeftRadius: "0.375rem",
                              textAlign: "left",
                            }
                      }
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.file_url && (
                        <div className="mt-2">
                          <a
                            href={message.file_url}
                            target="_blank" rel="noopener noreferrer"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={
                              isMine
                                ? { background: "rgba(255,255,255,0.25)", color: "#FFFFFF" }
                                : { background: "#F6F8FC", color: "#0B3FD9" }
                            }
                          >
                            <Paperclip className="w-3 h-3" /> View file
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 mt-1 text-[10px] px-1 ${isMine ? "justify-end" : "justify-start"}`}
                    style={{ color: "#8A97B5" }}
                  >
                    <span>{formatMessageTime(message.created_date)}</span>
                    {isMine && (
                      <span title={message.status === "read" ? "Seen" : message.status === "delivered" ? "Delivered" : "Sent"}>
                        {message.status === "sent" && <Clock className="w-3 h-3 opacity-60" />}
                        {message.status === "delivered" && <Check className="w-3 h-3" style={{ color: "#94A3B8" }} />}
                        {message.status === "read" && <CheckCheck className="w-3.5 h-3.5" style={{ color: "#1FB8FF" }} />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          onSend({ content: draft, file_url: null });
          setDraft("");
        }}
        className="px-3 sm:px-4 py-3 border-t flex items-center gap-2 sm:gap-3"
        style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || isSending}
          className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-50 transition shrink-0"
          style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setUploadingFile(true);
            try {
              const res = await base44.integrations.Core.UploadFile({ file });
              onSend({ content: draft || `Shared a file: ${file.name}`, file_url: res.file_url });
              setDraft("");
              event.target.value = "";
            } catch {
              toast.error("Failed to upload file");
            } finally {
              setUploadingFile(false);
            }
          }}
        />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message..."
          className="flex-1 h-11 rounded-2xl px-4 focus:outline-none min-w-0"
          style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending || uploadingFile}
          className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-50 transition shrink-0"
          style={{
            background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)",
            color: "#FFFFFF",
            boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)",
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}