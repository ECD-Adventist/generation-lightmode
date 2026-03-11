import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ConversationsList from "@/components/messages/ConversationsList";
import ChatWindow from "@/components/messages/ChatWindow";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
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

  const conversations = useMemo(() => allConversations.filter((conversation) => conversation.participant_a_email === user?.email || conversation.participant_b_email === user?.email), [allConversations, user?.email]);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) || null;
  const otherEmail = selectedConversation ? (selectedConversation.participant_a_email === user?.email ? selectedConversation.participant_b_email : selectedConversation.participant_a_email) : null;
  const otherUser = allUsers.find((person) => person.email === otherEmail) || null;

  const { data: messages = [] } = useQuery({
    queryKey: ["directMessages", selectedConversationId],
    queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: selectedConversationId }, "created_date"),
    enabled: !!selectedConversationId,
  });

  const ensureConversationMutation = useMutation({
    mutationFn: async (email) => {
      const existing = conversations.find((conversation) => {
        const pair = [conversation.participant_a_email, conversation.participant_b_email].sort().join("::");
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
    mutationFn: async (content) => {
      await base44.entities.DirectMessage.create({
        conversation_id: selectedConversation.id,
        sender_email: user.email,
        recipient_email: otherEmail,
        content,
      });
      await base44.entities.DirectConversation.update(selectedConversation.id, {
        last_message: content,
        last_message_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directMessages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["directConversations", user?.email] });
    },
  });

  useEffect(() => {
    if (!user?.email) return;
    const unsubscribeMessages = base44.entities.DirectMessage.subscribe((event) => {
      if (event.data?.recipient_email === user.email || event.data?.sender_email === user.email) {
        queryClient.invalidateQueries({ queryKey: ["directMessages", selectedConversationId] });
        queryClient.invalidateQueries({ queryKey: ["directConversations", user.email] });
      }
    });
    const unsubscribeConversations = base44.entities.DirectConversation.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["directConversations", user.email] });
    });
    return () => {
      unsubscribeMessages();
      unsubscribeConversations();
    };
  }, [user?.email, selectedConversationId, queryClient]);

  useEffect(() => {
    if (!user?.email || !selectedConversationId || messages.length === 0) return;
    const unread = messages.filter((message) => message.recipient_email === user.email && !message.read);
    if (unread.length > 0) Promise.all(unread.map((message) => base44.entities.DirectMessage.update(message.id, { read: true })));
  }, [messages, selectedConversationId, user?.email]);

  useEffect(() => {
    if (!user?.email || !targetEmail) return;
    const alreadyFollowing = following.some((entry) => entry.following_email === targetEmail);
    if (!alreadyFollowing) return;
    ensureConversationMutation.mutate(targetEmail);
  }, [targetEmail, user?.email, following.length]);

  useEffect(() => {
    const conversationFromUrl = urlParams.get("conversation");
    if (conversationFromUrl) setSelectedConversationId(conversationFromUrl);
    else if (conversations[0] && !selectedConversationId) setSelectedConversationId(conversations[0].id);
  }, [conversations.length]);

  if (!user) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">Loading messages...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white px-4 py-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
        <ConversationsList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          currentUserEmail={user.email}
          allUsers={allUsers}
          followingUsers={following.map((entry) => entry.following_email)}
          onSelectConversation={(id) => setSelectedConversationId(id)}
          onStartConversation={(email) => ensureConversationMutation.mutate(email)}
        />
        <ChatWindow
          conversation={selectedConversation}
          currentUser={user}
          otherUser={otherUser}
          messages={messages}
          onSend={(content) => sendMessageMutation.mutate(content)}
          isSending={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
}