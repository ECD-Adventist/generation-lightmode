import React, { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Users, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function GroupChatWindow({ group, currentUser, allUsers }) {
  const [draft, setDraft] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["groupMessages", group?.id],
    queryFn: () => base44.entities.GlowGroupMessage.filter({ group_id: group.id }, "created_date"),
    enabled: !!group?.id,
    refetchInterval: 5000,
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
  });

  const getUser = (email) => allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0] || "Member", email };

  if (!group) {
    return (
      <div className="rounded-[1.75rem] min-h-[72vh] flex items-center justify-center text-center p-8 font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
        <div>
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "#8A97B5" }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: "#0B1B3D" }}>Select a group</h3>
          <p className="text-sm" style={{ color: "#6B7FA0" }}>Choose a GlowGroup to view its conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] min-h-[72vh] flex flex-col overflow-hidden font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
      <div className="px-6 py-3 border-b flex items-center gap-3" style={{ borderColor: "#E6ECF5", background: "#F6F8FC" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)" }}>
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate" style={{ color: "#0B1B3D" }}>{group.name}</div>
          <div className="text-xs flex items-center gap-1" style={{ color: "#6B7FA0" }}>
            <Crown className="w-3 h-3" style={{ color: "#CC7A00" }} />
            <span>Led by {getUser(group.leader_email)?.full_name || group.leader_email}</span>
            <span className="mx-1">·</span>
            <span>{group.country}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#F6F8FC" }}>
        {messages.length === 0 && (
          <div className="text-center text-sm py-10" style={{ color: "#8A97B5" }}>No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg) => {
          const isMine = msg.user_email === currentUser?.email;
          const sender = getUser(msg.user_email);
          const isLeader = msg.user_email === group.leader_email;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && (
                <img src={sender.profile_picture_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" style={{ border: "1px solid #E6ECF5" }} />
              )}
              <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                {!isMine && (
                  <div className="flex items-center gap-1 mb-0.5 px-1">
                    <span className="text-xs font-bold" style={{ color: "#4A5878" }}>{sender.full_name}</span>
                    {isLeader && <Crown className="w-3 h-3" style={{ color: "#CC7A00" }} />}
                  </div>
                )}
                <div className="px-4 py-2.5 rounded-2xl text-sm" style={isMine ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", borderTopRightRadius: "0.25rem", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)" } : { background: "#FFFFFF", color: "#0B1B3D", border: "1px solid #E6ECF5", borderTopLeftRadius: "0.25rem" }}>
                  {msg.content}
                  {msg.file_url && (
                    <div className="mt-2">
                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1 rounded-lg text-xs font-semibold" style={isMine ? { background: "rgba(255,255,255,0.25)" } : { background: "#F6F8FC", color: "#0B3FD9" }}>
                        📎 View file
                      </a>
                    </div>
                  )}
                </div>
                <div className="text-[10px] mt-0.5 px-1" style={{ color: "#8A97B5" }}>
                  {msg.created_date ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true }) : ""}
                </div>
              </div>
            </div>
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
        className="px-4 py-3 border-t flex items-center gap-3"
        style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}
      >
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={`Message ${group.name}...`}
          className="flex-1 h-11 rounded-2xl px-4 focus:outline-none"
          style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || sendMutation.isPending}
          className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-50 transition"
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
        <button
          type="submit"
          disabled={!draft.trim() || sendMutation.isPending || uploadingFile}
          className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-50 transition"
          style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}