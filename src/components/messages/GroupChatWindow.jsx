import React, { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Users, Crown, ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

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

export default function GroupChatWindow({ group, currentUser, allUsers, onBack }) {
  const [draft, setDraft] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["groupMessages", group?.id],
    queryFn: () => base44.entities.GlowGroupMessage.filter({ group_id: group.id }, "created_date"),
    enabled: !!group?.id,
  });

  useEffect(() => {
    if (!group?.id) return;
    const unsub = base44.entities.GlowGroupMessage.subscribe((event) => {
      if (event.data?.group_id === group.id) {
        queryClient.invalidateQueries({ queryKey: ["groupMessages", group.id] });
      }
    });
    return unsub;
  }, [group?.id, queryClient]);

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

  const sendMutation = useMutation({
    mutationFn: async ({ content, file_url }) => {
      await base44.entities.GlowGroupMessage.create({
        group_id: group.id,
        user_email: currentUser.email,
        content,
        file_url: file_url || undefined,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groupMessages", group.id] }),
    onError: () => toast.error("Failed to send message"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId) => {
      await base44.entities.GlowGroupMessage.delete(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMessages", group.id] });
      toast.success("Message deleted");
    },
    onError: () => toast.error("Failed to delete message"),
  });

  const getUser = (email) =>
    allUsers.find((u) => u.email === email) || { full_name: email?.split("@")[0] || "Member", email };

  if (!group) {
    return (
      <div
        className="rounded-[1.5rem] lg:rounded-[1.75rem] h-[calc(100vh-9rem)] lg:h-[72vh] flex items-center justify-center text-center p-8 font-['Inter']"
        style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}
      >
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #F6F8FC 100%)" }}>
            <Users className="w-7 h-7" style={{ color: "#0B3FD9" }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "#0B1B3D" }}>Select a group</h3>
          <p className="text-sm" style={{ color: "#6B7FA0" }}>Choose a GlowGroup to view its conversation.</p>
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
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)" }}
        >
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate" style={{ color: "#0B1B3D" }}>{group.name}</div>
          <div className="text-xs flex items-center gap-1 truncate" style={{ color: "#6B7FA0" }}>
            <Crown className="w-3 h-3 shrink-0" style={{ color: "#CC7A00" }} />
            <span className="truncate">Led by {getUser(group.leader_email)?.full_name || group.leader_email}</span>
            {group.country && (
              <>
                <span className="mx-1">·</span>
                <span className="truncate">{group.country}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1" style={{ background: "#F6F8FC" }}>
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
              <Users className="w-5 h-5" style={{ color: "#0B3FD9" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "#0B1B3D" }}>No messages yet</p>
            <p className="text-xs mt-1" style={{ color: "#8A97B5" }}>Be the first to greet the group!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.user_email === currentUser?.email;
          const sender = getUser(msg.user_email);
          const isLeader = msg.user_email === group.leader_email;
          const msgDay = msg.created_date ? formatDayDivider(msg.created_date) : "";
          const showDayDivider = msgDay && msgDay !== lastDay;
          lastDay = msgDay;

          return (
            <React.Fragment key={msg.id}>
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
              <div className={`flex gap-2 group ${isMine ? "justify-end" : "justify-start"}`}>
                {!isMine && (
                  <img
                    src={sender.profile_picture_url || defaultAvatar}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
                    style={{ border: "1px solid #E6ECF5" }}
                    alt={sender.full_name}
                  />
                )}
                <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  {!isMine && (
                    <div className="flex items-center gap-1 mb-0.5 px-1">
                      <span className="text-xs font-bold" style={{ color: "#4A5878" }}>{sender.full_name}</span>
                      {isLeader && <Crown className="w-3 h-3" style={{ color: "#CC7A00" }} />}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {isMine && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === msg.id ? null : msg.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center transition"
                          style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#6B7FA0" }}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {menuOpenId === msg.id && (
                          <div
                            className="absolute right-0 mt-1 rounded-lg z-50 overflow-hidden"
                            style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.12)" }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                                deleteMutation.mutate(msg.id);
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
                              borderTopRightRadius: "0.375rem",
                              boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)",
                            }
                          : {
                              background: "#FFFFFF",
                              color: "#0B1B3D",
                              border: "1px solid #E6ECF5",
                              borderTopLeftRadius: "0.375rem",
                            }
                      }
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.file_url && (
                        <div className="mt-2">
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold"
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
                  <div className="text-[10px] mt-0.5 px-1" style={{ color: "#8A97B5" }}>
                    {formatMessageTime(msg.created_date)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          sendMutation.mutate({ content: draft, file_url: null });
          setDraft("");
        }}
        className="px-3 sm:px-4 py-3 border-t flex items-center gap-2 sm:gap-3"
        style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || sendMutation.isPending}
          className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-50 transition shrink-0"
          style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploadingFile(true);
            try {
              const res = await base44.integrations.Core.UploadFile({ file });
              sendMutation.mutate({ content: draft || `Shared a file: ${file.name}`, file_url: res.file_url });
              setDraft("");
              e.target.value = "";
            } catch {
              toast.error("Failed to upload file");
            } finally {
              setUploadingFile(false);
            }
          }}
        />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${group.name}...`}
          className="flex-1 h-11 rounded-2xl px-4 focus:outline-none min-w-0"
          style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || sendMutation.isPending || uploadingFile}
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