import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";
import { createPageUrl } from "@/utils";
import ConversationsList from "@/components/messages/ConversationsList";
import ChatWindow from "@/components/messages/ChatWindow";
import GroupChatWindow from "@/components/messages/GroupChatWindow";
import { isNotificationEnabled } from "@/lib/notifications";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState("dms"); // "dms" | "groups"
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const targetEmail = urlParams.get("user");

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname + window.location.search);
    });
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!user,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user,
  });

  const { data: allConversations = [] } = useQuery({
    queryKey: ["directConversations", user?.email],
    queryFn: () => base44.entities.DirectConversation.list("-updated_date", 200),
    enabled: !!user,
  });

  // GlowGroup memberships for group chat
  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myGroupMemberships", user?.email],
    queryFn: () => base44.entities.GlowGroupMember.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const { data: myLeaderGroups = [] } = useQuery({
    queryKey: ["myLeaderGroups", user?.email],
    queryFn: () => base44.entities.GlowGroup.filter({ leader_email: user?.email }),
    enabled: !!user,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ["allGlowGroups"],
    queryFn: () => base44.entities.GlowGroup.list(),
    enabled: !!user,
  });

  // Groups the user belongs to (as member OR leader)
  const myGroups = useMemo(() => {
    const memberGroupIds = new Set(myMemberships.map(m => m.group_id));
    const leaderGroupIds = new Set(myLeaderGroups.map(g => g.id));
    return allGroups.filter(g => memberGroupIds.has(g.id) || leaderGroupIds.has(g.id));
  }, [allGroups, myMemberships, myLeaderGroups]);

  const selectedGroup = myGroups.find(g => g.id === selectedGroupId) || null;

  const conversations = useMemo(
    () => allConversations.filter(c => c.participant_a_email === user?.email || c.participant_b_email === user?.email),
    [allConversations, user?.email]
  );

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;
  const otherEmail = selectedConversation
    ? (selectedConversation.participant_a_email === user?.email ? selectedConversation.participant_b_email : selectedConversation.participant_a_email)
    : null;
  const otherUser = allUsers.find(u => u.email === otherEmail) || null;

  const { data: messages = [] } = useQuery({
    queryKey: ["directMessages", selectedConversationId],
    queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: selectedConversationId }, "created_date"),
    enabled: !!selectedConversationId,
  });

  const ensureConversationMutation = useMutation({
    mutationFn: async (email) => {
      const existing = conversations.find(c => {
        const pair = [c.participant_a_email, c.participant_b_email].sort().join("::");
        return pair === [user.email, email].sort().join("::");
      });
      if (existing) return existing;
      return await base44.entities.DirectConversation.create({
        participant_a_email: [user.email, email].sort()[0],
        participant_b_email: [user.email, email].sort()[1],
        last_message: "",
        last_message_at: new Date().toISOString(),
      });
    },
    onSuccess: (conversation, email) => {
      setSelectedConversationId(conversation.id);
      window.history.replaceState({}, "", `${window.location.pathname}?user=${encodeURIComponent(email)}&conversation=${conversation.id}`);
      queryClient.invalidateQueries({ queryKey: ["directConversations", user?.email] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, file_url }) => {
      const message = await base44.entities.DirectMessage.create({
        conversation_id: selectedConversation.id,
        sender_email: user.email,
        recipient_email: otherEmail,
        content,
        file_url: file_url || undefined,
        status: "sent",
      });
      await base44.entities.DirectConversation.update(selectedConversation.id, {
        last_message: content,
        last_message_at: new Date().toISOString(),
      });
      const recipientUser = allUsers.find(u => u.email === otherEmail);
      if (isNotificationEnabled(recipientUser, "messages")) {
        base44.entities.Notification.create({
          user_email: otherEmail,
          type: "message",
          message: `${user.full_name || 'Someone'} sent you a message: "${content.slice(0, 60)}${content.length > 60 ? '...' : ''}"`,
          link: `/Messages?user=${encodeURIComponent(user.email)}`,
        }).catch(() => {});
      }
      await base44.entities.DirectMessage.update(message.id, { status: "delivered" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directMessages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["directConversations", user?.email] });
    },
  });

  useEffect(() => {
    if (!user?.email) return;
    const unsubMsgs = base44.entities.DirectMessage.subscribe((event) => {
      if (event.data?.recipient_email === user.email || event.data?.sender_email === user.email) {
        queryClient.invalidateQueries({ queryKey: ["directMessages", selectedConversationId] });
        queryClient.invalidateQueries({ queryKey: ["directConversations", user.email] });
      }
    });
    const unsubConvs = base44.entities.DirectConversation.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["directConversations", user.email] });
    });
    return () => { unsubMsgs(); unsubConvs(); };
  }, [user?.email, selectedConversationId, queryClient]);

  useEffect(() => {
    if (!user?.email || !selectedConversationId || messages.length === 0) return;
    const unread = messages.filter(m => m.recipient_email === user.email && !m.read);
    if (unread.length > 0) {
      Promise.all(unread.map(m => base44.entities.DirectMessage.update(m.id, { read: true, status: "read" })));
    }
  }, [messages, selectedConversationId, user?.email]);

  useEffect(() => {
    if (!user?.email || !targetEmail) return;
    const existing = conversations.find(c => {
      const pair = [c.participant_a_email, c.participant_b_email].sort().join("::");
      return pair === [user.email, targetEmail].sort().join("::");
    });
    if (existing) { setSelectedConversationId(existing.id); return; }
    if (!ensureConversationMutation.isPending) ensureConversationMutation.mutate(targetEmail);
  }, [targetEmail, user?.email, conversations]);

  useEffect(() => {
    const conversationFromUrl = urlParams.get("conversation");
    if (conversationFromUrl) setSelectedConversationId(conversationFromUrl);
    else if (conversations[0] && !selectedConversationId) setSelectedConversationId(conversations[0].id);
  }, [conversations.length]);

  if (!user) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">Loading messages...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Top Nav */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to={createPageUrl("Feed")} className="flex items-center gap-2 shrink-0 lg:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Messages</h1>
          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-[#121826] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("dms")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === "dms" ? "bg-[#00CFFF] text-black" : "text-gray-400 hover:text-white"}`}
            >
              <MessageCircle className="w-4 h-4" /> Direct
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === "groups" ? "bg-[#8A5CFF] text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Users className="w-4 h-4" /> Groups {myGroups.length > 0 && <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{myGroups.length}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4 px-4 py-6">
        {activeTab === "dms" ? (
          <>
            <ConversationsList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              currentUserEmail={user.email}
              allUsers={allUsers}
              followingUsers={following.map(f => f.following_email)}
              onSelectConversation={setSelectedConversationId}
              onStartConversation={(email) => ensureConversationMutation.mutate(email)}
            />
            <ChatWindow
              conversation={selectedConversation}
              currentUser={user}
              otherUser={otherUser}
              messages={messages}
              onSend={({ content, file_url }) => sendMessageMutation.mutate({ content, file_url })}
              isSending={sendMessageMutation.isPending}
            />
          </>
        ) : (
          <>
            {/* Group list */}
            <div className="bg-[#121826] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[72vh]">
              <div className="px-4 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">GlowGroups</h2>
                <p className="text-sm text-gray-400 mt-1">Chat with your group members.</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {myGroups.length === 0 ? (
                  <div className="text-center py-10 px-4 text-gray-500 text-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    You're not in any GlowGroups yet.
                    <br />
                    <Link to={createPageUrl("GlowGroups")} className="text-[#00CFFF] font-bold hover:underline mt-1 inline-block">Join a group →</Link>
                  </div>
                ) : myGroups.map(group => {
                  const isLeaderGroup = group.leader_email === user.email;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition border-b border-white/5 ${selectedGroupId === group.id ? "bg-white/10" : "hover:bg-white/5"}`}
                    >
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#8A5CFF] to-[#00CFFF] flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate flex items-center gap-1.5">
                          {group.name}
                          {isLeaderGroup && <span className="text-[10px] bg-[#FFD000]/20 text-[#FFD000] px-1.5 py-0.5 rounded-full font-bold">Leader</span>}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{group.country}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <GroupChatWindow
              group={selectedGroup}
              currentUser={user}
              allUsers={allUsers}
            />
          </>
        )}
      </div>
    </div>
  );
}