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
      <div className="bg-[#121826] border border-white/10 rounded-3xl min-h-[72vh] flex items-center justify-center text-center p-8">
        <div>
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">Select a group</h3>
          <p className="text-gray-400 text-sm">Choose a GlowGroup to view its conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121826] border border-white/10 rounded-3xl min-h-[72vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b border-white/10 flex items-center gap-3 bg-[#0F1524]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8A5CFF] to-[#00CFFF] flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white truncate">{group.name}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Crown className="w-3 h-3 text-[#FFD000]" />
            <span>Led by {getUser(group.leader_email)?.full_name || group.leader_email}</span>
            <span className="mx-1">·</span>
            <span>{group.country}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#0F1524]">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-10">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg) => {
          const isMine = msg.user_email === currentUser?.email;
          const sender = getUser(msg.user_email);
          const isLeader = msg.user_email === group.leader_email;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && (
                <img src={sender.profile_picture_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0 mt-1" />
              )}
              <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                {!isMine && (
                  <div className="flex items-center gap-1 mb-0.5 px-1">
                    <span className="text-xs font-bold text-gray-300">{sender.full_name}</span>
                    {isLeader && <Crown className="w-3 h-3 text-[#FFD000]" />}
                  </div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMine ? "bg-[#00CFFF] text-black rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm"}`}>
                  {msg.content}
                  {msg.file_url && (
                    <div className="mt-2">
                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-black/20">
                        📎 View file
                      </a>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 px-1">
                  {msg.created_date ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true }) : ""}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          sendMutation.mutate({ content: draft, file_url: null });
          setDraft("");
        }}
        className="px-4 py-3 border-t border-white/10 flex items-center gap-3"
      >
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={`Message ${group.name}...`}
          className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#8A5CFF]/40"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || sendMutation.isPending}
          className="w-11 h-11 rounded-2xl bg-white/10 text-gray-400 hover:text-white flex items-center justify-center disabled:opacity-50 transition"
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
          className="w-11 h-11 rounded-2xl bg-[#8A5CFF] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#8A5CFF]/80 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}