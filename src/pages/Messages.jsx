import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { dualWriteSupabase } from "@/lib/dualWriteSupabase";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Users, Home, Zap, Bell, User, Globe } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import ConversationsList from "@/components/messages/ConversationsList";
import ChatWindow from "@/components/messages/ChatWindow";
import GroupChatWindow from "@/components/messages/GroupChatWindow";
import { isNotificationEnabled } from "@/lib/notifications";
import { getDisplayName } from "@/lib/displayName";
import MobileMessagesList from "@/components/messages/MobileMessagesList";

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
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.users)) return data.users;
      if (Array.isArray(data?.data)) return data.data;
      return [];
    },
    enabled: !!user,
  });

  const uniqueParticipantEmails = useMemo(() => {
    const emails = new Set();
    allConversations.forEach(c => {
      if (c.participant_a_email && c.participant_a_email !== user?.email) emails.add(c.participant_a_email);
      if (c.participant_b_email && c.participant_b_email !== user?.email) emails.add(c.participant_b_email);
    });
    return Array.from(emails);
  }, [allConversations, user?.email]);

  const { data: conversationUsers = [] } = useQuery({
    queryKey: ["conversationUsers", uniqueParticipantEmails],
    queryFn: async () => {
      if (uniqueParticipantEmails.length === 0) return [];
      const res = await base44.functions.invoke("listPublicUsers", { emails: uniqueParticipantEmails, limit: 200 });
      return res.data || [];
    },
    enabled: uniqueParticipantEmails.length > 0,
  });

  const mergedUsers = useMemo(() => {
    const map = new Map();
    allUsers.forEach(u => map.set(u.email, u));
    conversationUsers.forEach(u => map.set(u.email, u));
    return Array.from(map.values());
  }, [allUsers, conversationUsers]);

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

  const { data: myGroupJoinRequests = [] } = useQuery({
    queryKey: ["myGroupJoinRequests", user?.email],
    queryFn: () => base44.entities.GlowGroupJoinRequest.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const requestJoinGroupMutation = useMutation({
    mutationFn: async (group) => {
      const existing = myGroupJoinRequests.find(r => r.group_id === group.id && ["pending", "approved"].includes(r.status));
      if (existing?.status === "pending") return existing;
      if (existing?.status === "approved") return existing;
      return await base44.entities.GlowGroupJoinRequest.create({
        group_id: group.id,
        user_email: user.email,
        status: "pending",
        message: `I would like to join ${group.name}.`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGroupJoinRequests", user?.email] });
      toast.success("Join request sent");
    },
    onError: () => toast.error("Could not send join request. Try again."),
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
  // Bug 1 & 4: Use mergedUsers to find the user, fallback to prevent ChatWindow from rejecting it
  const otherUser = mergedUsers.find(u => u.email === otherEmail) || (otherEmail ? { email: otherEmail, full_name: "Unknown User", id: "" } : null);

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
      if (!user) { toast.error("Please log in to send messages"); return; }
      if (!content?.trim() && !file_url) return;

      const message = await base44.entities.DirectMessage.create({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        recipient_id: otherUser.id,
        content: content?.trim() || `Shared a file`,
        file_url: file_url || undefined,
        status: "sent",
      });
      dualWriteSupabase("direct_messages", message);

      await base44.entities.DirectConversation.update(selectedConversation.id, {
        last_message: content?.trim() || `Shared a file`,
        last_message_at: new Date().toISOString(),
      });

      // Notification (fire and forget, don't block)
      if (otherUser?.id && otherEmail && otherEmail !== user.email && isNotificationEnabled(otherUser, "messages")) {
        base44.functions.invoke("createNotification", {
          user_id: otherUser.id,
          type: "message",
          reference_id: `dm_${message.id}`,
          message: `${getDisplayName(user)} sent you a message: "${(content?.trim() || 'shared a file').slice(0, 60)}${(content?.trim() || 'shared a file').length > 60 ? '...' : ''}"`,
          link: `/Messages?user=${encodeURIComponent(user.email)}`,
        }).catch(() => {});
      }

      await base44.entities.DirectMessage.update(message.id, { status: "delivered" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directMessages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["directConversations", user?.email] });
    },
    onError: () => {
      toast.error("Failed to send message. Try again.");
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      await base44.entities.DirectMessage.delete(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directMessages", selectedConversationId] });
      toast.success("Message deleted");
    },
    onError: () => toast.error("Failed to delete message"),
  });

  useEffect(() => {
    if (!user?.email) return;
    const unsubMsgs = base44.entities.DirectMessage.subscribe((event) => {
      if (event.data?.recipient_id === user.id || event.data?.sender_id === user.id) {
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
    if (!user?.id || !selectedConversationId || messages.length === 0) return;
    const unread = messages.filter(m => m.recipient_id === user.id && !m.read);
    if (unread.length > 0) {
      Promise.all(unread.map(m => base44.entities.DirectMessage.update(m.id, { read: true, status: "read" })));
    }
  }, [messages, selectedConversationId, user?.id]);

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
  }, []);

  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>Loading messages...</div>;

  // Mobile: show list when nothing selected; show chat when selected
  const showListOnMobile = activeTab === "dms" ? !selectedConversationId : !selectedGroupId;

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <style>{`
        /* Messages page — clean blue scrollbar */
        .messages-scroll::-webkit-scrollbar { width: 5px; }
        .messages-scroll::-webkit-scrollbar-track { background: transparent; }
        .messages-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #1FB8FF, #0B3FD9); border-radius: 3px; }
        .messages-scroll::-webkit-scrollbar-thumb:hover { background: #0B3FD9; }
        .messages-scroll { scrollbar-width: thin; scrollbar-color: #1FB8FF transparent; }
      `}</style>

      {/* MOBILE: branded list when nothing selected; show chat window when selected */}
      {showListOnMobile ? (
        <div className="md:hidden">
          <MobileMessagesList
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id)}
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            currentUserEmail={user.email}
            allUsers={mergedUsers}
            followingUsers={following.map(f => f.following_email)}
            onSelectConversation={setSelectedConversationId}
            onStartConversation={(email) => ensureConversationMutation.mutate(email)}
            myGroups={myGroups}
            allGroups={allGroups}
            joinRequests={myGroupJoinRequests}
            onRequestJoinGroup={(group) => requestJoinGroupMutation.mutate(group)}
            isRequestingJoin={requestJoinGroupMutation.isPending}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            currentUser={user}
          />
        </div>
      ) : (
        <div className="md:hidden px-3 py-3">
          {activeTab === "dms" ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUser={user}
              otherUser={otherUser}
              messages={messages}
              onSend={({ content, file_url }) => sendMessageMutation.mutate({ content, file_url })}
              isSending={sendMessageMutation.isPending}
              onBack={() => setSelectedConversationId(null)}
              onDeleteMessage={(id) => deleteMessageMutation.mutate(id)}
            />
          ) : (
            <GroupChatWindow
              group={selectedGroup}
              currentUser={user}
              allUsers={allUsers}
              onBack={() => setSelectedGroupId(null)}
            />
          )}
        </div>
      )}

      {/* DESKTOP: original design */}
      <div className="hidden md:block">
      {/* Top Nav */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-3" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-2 shrink-0" style={{ color: "#0B1B3D" }}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold truncate" style={{ color: "#0B1B3D" }}>Messages</h1>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-xl p-1 shrink-0" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.06)" }}>
            <button
              onClick={() => setActiveTab("dms")}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition"
              style={activeTab === "dms"
                ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.25)" }
                : { background: "transparent", color: "#4A5878" }}
            >
              <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">Direct</span>
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition"
              style={activeTab === "groups"
                ? { background: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)", color: "#0B1B3D", boxShadow: "0 2px 8px rgba(255, 159, 26, 0.3)" }
                : { background: "transparent", color: "#4A5878" }}
            >
              <Users className="w-4 h-4" /> <span className="hidden sm:inline">Groups</span>
              {myGroups.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={activeTab === "groups" ? { background: "rgba(11, 27, 61, 0.15)", color: "#0B1B3D" } : { background: "#EEF3FF", color: "#0B3FD9" }}>
                  {myGroups.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick nav — desktop only */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" /> },
              { to: "Dashboard", icon: <Zap className="w-4 h-4" /> },
              { to: "Notifications", icon: <Bell className="w-4 h-4" /> },
              { to: "Profile", icon: <User className="w-4 h-4" /> },
            ].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="w-9 h-9 rounded-xl flex items-center justify-center transition" style={{ color: "#4A5878" }}
                onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}
              >
                {item.icon}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto hidden md:grid lg:grid-cols-[340px_minmax(0,1fr)] gap-4 px-3 sm:px-4 py-4 sm:py-6">
        {activeTab === "dms" ? (
          <>
            <div className={showListOnMobile ? "block" : "hidden lg:block"}>
              <ConversationsList
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                currentUserEmail={user.email}
                allUsers={mergedUsers}
                followingUsers={following.map(f => f.following_email)}
                onSelectConversation={setSelectedConversationId}
                onStartConversation={(email) => ensureConversationMutation.mutate(email)}
              />
            </div>
            <div className={!showListOnMobile ? "block" : "hidden lg:block"}>
              <ChatWindow
                conversation={selectedConversation}
                currentUser={user}
                otherUser={otherUser}
                messages={messages}
                onSend={({ content, file_url }) => sendMessageMutation.mutate({ content, file_url })}
                isSending={sendMessageMutation.isPending}
                onBack={() => setSelectedConversationId(null)}
                onDeleteMessage={(id) => deleteMessageMutation.mutate(id)}
              />
            </div>
          </>
        ) : (
          <>
            {/* Group list */}
            <div
              className={`rounded-[1.5rem] lg:rounded-[1.75rem] overflow-hidden flex flex-col h-[calc(100vh-9rem)] lg:h-[72vh] ${showListOnMobile ? "block" : "hidden lg:flex"}`}
              style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}
            >
              <div className="px-4 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
                <h2 className="text-lg font-bold" style={{ color: "#0B1B3D" }}>GlowGroups</h2>
                <p className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>Chat with your group members.</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {myGroups.length === 0 ? (
                  <div className="text-center py-10 px-4 text-sm" style={{ color: "#8A97B5" }}>
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    You're not in any GlowGroups yet.
                    <br />
                    <Link to={createPageUrl("GlowGroups")} className="font-bold hover:underline mt-1 inline-block" style={{ color: "#0B3FD9" }}>Join a group →</Link>
                  </div>
                ) : myGroups.map(group => {
                  const isLeaderGroup = group.leader_email === user.email;
                  const isSelected = selectedGroupId === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition border-b"
                      style={{ borderColor: "#F0F4FA", background: isSelected ? "#EEF3FF" : "transparent" }}
                      onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = "#F6F8FC"; }}
                      onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)" }}>
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate flex items-center gap-1.5" style={{ color: "#0B1B3D" }}>
                          {group.name}
                          {isLeaderGroup && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(255, 208, 0, 0.18)", color: "#CC7A00" }}>Leader</span>}
                        </div>
                        <div className="text-xs truncate" style={{ color: "#6B7FA0" }}>{group.country}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={!showListOnMobile ? "block" : "hidden lg:block"}>
              <GroupChatWindow
                group={selectedGroup}
                currentUser={user}
                allUsers={allUsers}
                onBack={() => setSelectedGroupId(null)}
              />
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}