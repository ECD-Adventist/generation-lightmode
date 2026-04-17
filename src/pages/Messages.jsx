import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Users, Home, Bell, Menu, X, Compass, LayoutDashboard, Bot, BookOpen, ExternalLink, Globe, Settings, Zap, Plus, ChevronRight, Trophy, Target, Sparkles, Medal, Handshake, Camera, Search as SearchIcon, PlusSquare, PlaySquare, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import ConversationsList from "@/components/messages/ConversationsList";
import ChatWindow from "@/components/messages/ChatWindow";
import GroupChatWindow from "@/components/messages/GroupChatWindow";
import { isNotificationEnabled } from "@/lib/notifications";

function SidebarLink({ to, icon, label, active, badge, accent }) {
  const baseStyle = active
    ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", border: "none", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }
    : accent ? { color: "#0B3FD9", background: "transparent" }
    : { color: "#3A4A6B", background: "transparent" };
  const iconBoxStyle = active
    ? { background: "rgba(255,255,255,0.25)", color: "#FFFFFF" }
    : { background: "#FFFFFF", color: "#0B3FD9", border: "1px solid #D6E4FF", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.08)" };
  return (
    <Link to={to} className="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200 hover:bg-[#F0F4FA]" style={baseStyle}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition" style={iconBoxStyle}>{icon}</div>
      <span className="text-[13px] font-semibold flex-1">{label}</span>
      {badge && <span className="font-bold text-[9px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1" style={{ background: active ? "rgba(255,255,255,0.3)" : "#FF5A5A", color: "#FFFFFF" }}>{badge}</span>}
    </Link>
  );
}

export default function Messages() {
  const [user, setUser] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState("dms");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const targetEmail = urlParams.get("user");

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname + window.location.search);
    });
  }, []);

  const { data: allUsers = [] } = useQuery({ queryKey: ["allUsers"], queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; }, enabled: !!user });
  const { data: following = [] } = useQuery({ queryKey: ["following", user?.email], queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }), enabled: !!user });
  const { data: allConversations = [] } = useQuery({ queryKey: ["directConversations", user?.email], queryFn: () => base44.entities.DirectConversation.list("-updated_date", 200), enabled: !!user });
  const { data: myMemberships = [] } = useQuery({ queryKey: ["myGroupMemberships", user?.email], queryFn: () => base44.entities.GlowGroupMember.filter({ user_email: user?.email }), enabled: !!user });
  const { data: myLeaderGroups = [] } = useQuery({ queryKey: ["myLeaderGroups", user?.email], queryFn: () => base44.entities.GlowGroup.filter({ leader_email: user?.email }), enabled: !!user });
  const { data: allGroups = [] } = useQuery({ queryKey: ["allGlowGroups"], queryFn: () => base44.entities.GlowGroup.list(), enabled: !!user });
  const { data: notifications = [] } = useQuery({ queryKey: ["notifications", user?.email], queryFn: () => base44.entities.Notification.filter({ user_email: user.email, read: false }), enabled: !!user });

  const myGroups = useMemo(() => {
    const memberIds = new Set(myMemberships.map(m => m.group_id));
    const leaderIds = new Set(myLeaderGroups.map(g => g.id));
    return allGroups.filter(g => memberIds.has(g.id) || leaderIds.has(g.id));
  }, [allGroups, myMemberships, myLeaderGroups]);

  const selectedGroup = myGroups.find(g => g.id === selectedGroupId) || null;
  const conversations = useMemo(() => allConversations.filter(c => c.participant_a_email === user?.email || c.participant_b_email === user?.email), [allConversations, user?.email]);
  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;
  const otherEmail = selectedConversation ? (selectedConversation.participant_a_email === user?.email ? selectedConversation.participant_b_email : selectedConversation.participant_a_email) : null;
  const otherUser = allUsers.find(u => u.email === otherEmail) || null;
  const { data: messages = [] } = useQuery({ queryKey: ["directMessages", selectedConversationId], queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: selectedConversationId }, "created_date"), enabled: !!selectedConversationId });

  const ensureConversationMutation = useMutation({
    mutationFn: async (email) => {
      const existing = conversations.find(c => [c.participant_a_email, c.participant_b_email].sort().join("::") === [user.email, email].sort().join("::"));
      if (existing) return existing;
      return await base44.entities.DirectConversation.create({ participant_a_email: [user.email, email].sort()[0], participant_b_email: [user.email, email].sort()[1], last_message: "", last_message_at: new Date().toISOString() });
    },
    onSuccess: (conversation, email) => { setSelectedConversationId(conversation.id); window.history.replaceState({}, "", `${window.location.pathname}?user=${encodeURIComponent(email)}&conversation=${conversation.id}`); queryClient.invalidateQueries({ queryKey: ["directConversations", user?.email] }); },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, file_url }) => {
      if (!user) { toast.error("Please log in to send messages"); return; }
      if (!content?.trim() && !file_url) return;
      const message = await base44.entities.DirectMessage.create({ conversation_id: selectedConversation.id, sender_email: user.email, recipient_email: otherEmail, content: content?.trim() || `Shared a file`, file_url: file_url || undefined, status: "sent" });
      await base44.entities.DirectConversation.update(selectedConversation.id, { last_message: content?.trim() || `Shared a file`, last_message_at: new Date().toISOString() });
      if (otherEmail && otherEmail !== user.email && isNotificationEnabled(otherUser, "messages")) {
        base44.entities.Notification.create({ user_email: otherEmail, type: "message", message: `${user.full_name || 'Someone'} sent you a message: "${(content?.trim() || 'shared a file').slice(0, 60)}"`, link: `/Messages?user=${encodeURIComponent(user.email)}` }).catch(() => {});
      }
      await base44.entities.DirectMessage.update(message.id, { status: "delivered" });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["directMessages", selectedConversationId] }); queryClient.invalidateQueries({ queryKey: ["directConversations", user?.email] }); toast.success("Message sent!"); },
    onError: () => { toast.error("Failed to send message. Try again."); }
  });

  useEffect(() => {
    if (!user?.email) return;
    const unsubMsgs = base44.entities.DirectMessage.subscribe((event) => { if (event.data?.recipient_email === user.email || event.data?.sender_email === user.email) { queryClient.invalidateQueries({ queryKey: ["directMessages", selectedConversationId] }); queryClient.invalidateQueries({ queryKey: ["directConversations", user.email] }); } });
    const unsubConvs = base44.entities.DirectConversation.subscribe(() => { queryClient.invalidateQueries({ queryKey: ["directConversations", user.email] }); });
    return () => { unsubMsgs(); unsubConvs(); };
  }, [user?.email, selectedConversationId, queryClient]);

  useEffect(() => { if (!user?.email || !selectedConversationId || messages.length === 0) return; const unread = messages.filter(m => m.recipient_email === user.email && !m.read); if (unread.length > 0) Promise.all(unread.map(m => base44.entities.DirectMessage.update(m.id, { read: true, status: "read" }))); }, [messages, selectedConversationId, user?.email]);
  useEffect(() => { if (!user?.email || !targetEmail) return; const existing = conversations.find(c => [c.participant_a_email, c.participant_b_email].sort().join("::") === [user.email, targetEmail].sort().join("::")); if (existing) { setSelectedConversationId(existing.id); return; } if (!ensureConversationMutation.isPending) ensureConversationMutation.mutate(targetEmail); }, [targetEmail, user?.email, conversations]);
  useEffect(() => { const conversationFromUrl = urlParams.get("conversation"); if (conversationFromUrl) setSelectedConversationId(conversationFromUrl); else if (conversations[0] && !selectedConversationId) setSelectedConversationId(conversations[0].id); }, [conversations.length]);

  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><div className="w-8 h-8 border-4 border-slate-200 border-t-[#1FB8FF] rounded-full animate-spin" /></div>;

  return (
    <div className="h-[100dvh] relative overflow-hidden font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <div className="h-full grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-0">

        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col py-6 px-4 sticky top-0 h-[100dvh] border-r overflow-y-auto hide-scrollbar" style={{ background: "linear-gradient(165deg, #FFFEF9 0%, #FFF7DE 35%, #FFEFC7 70%, #FFE9B5 100%)", borderColor: "#F0DFA0" }}>
          <Link to={createPageUrl("Home")} className="flex items-center mb-8 px-2">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 56, width: "auto", objectFit: "contain" }} />
          </Link>
          <nav className="flex flex-col gap-1 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] px-3 mb-1.5" style={{ color: "#8A97B5" }}>Main</p>
            <SidebarLink to={createPageUrl("Feed")} icon={<Home className="w-[18px] h-[18px]" />} label="Home" />
            <SidebarLink to={createPageUrl("Messages")} icon={<MessageCircle className="w-[18px] h-[18px]" />} label="Messages" active />
            <SidebarLink to={createPageUrl("GlowGroups")} icon={<Globe className="w-[18px] h-[18px]" />} label="Explore" />
            <SidebarLink to={createPageUrl("Discover")} icon={<Compass className="w-[18px] h-[18px]" />} label="Discover" />
            <SidebarLink to={createPageUrl("Notifications")} icon={<Bell className="w-[18px] h-[18px]" />} label="Notifications" badge={notifications.length > 0 ? notifications.length : null} />
            <SidebarLink to={createPageUrl("Dashboard")} icon={<LayoutDashboard className="w-[18px] h-[18px]" />} label="Dashboard" />
            <SidebarLink to={createPageUrl("Profile")} icon={
              <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0" style={{ border: "1px solid #D5E3F0" }}>
                <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
            } label="Profile" />

            <p className="text-[10px] font-black uppercase tracking-[0.18em] px-3 mt-4 mb-1.5" style={{ color: "#8A97B5" }}>Tools</p>
            <SidebarLink to={createPageUrl("Assistant")} icon={<Bot className="w-[18px] h-[18px]" />} label="AI Assistant" accent />

            <button onClick={() => setIsResourcesOpen(v => !v)} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{ background: "#F0F4FA" }}>📚</div>
              <span className="text-sm font-semibold flex-1">Resources</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isResourcesOpen ? "rotate-90" : ""}`} style={{ color: "#8A97B5" }} />
            </button>
            {isResourcesOpen && (
              <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l" style={{ borderColor: "#E0EAF5" }}>
                <Link to={createPageUrl("KeepIt100")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><span>💯</span> Keep It 100</Link>
                <Link to={createPageUrl("CodesOfTruth")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><span>🔐</span> Codes of Truth</Link>
                <Link to={createPageUrl("Resources")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><span>🌍</span> Other Resources</Link>
              </div>
            )}
            <SidebarLink to={createPageUrl("DailyDevotion")} icon={<BookOpen className="w-[18px] h-[18px]" />} label="Bible School" />
            <SidebarLink to={createPageUrl("Home")} icon={<ExternalLink className="w-[18px] h-[18px]" />} label="Back to Website" />

            <button onClick={() => setIsMoreOpen(v => !v)} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left mt-4 hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F0F4FA", color: "#5A6A8A" }}><Settings className="w-[16px] h-[16px]" /></div>
              <span className="text-sm font-semibold flex-1">More</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? "rotate-90" : ""}`} style={{ color: "#8A97B5" }} />
            </button>
            {isMoreOpen && (
              <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l" style={{ borderColor: "#E0EAF5" }}>
                <Link to={createPageUrl("Milestones")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Trophy className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Milestones</Link>
                <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Globe className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Global Reach</Link>
                <Link to={createPageUrl("PrayerWall")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Handshake className="w-3.5 h-3.5" style={{ color: "#5AC8FF" }} /> Prayer Wall</Link>
                <Link to="/Settings" className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Settings className="w-3.5 h-3.5" /> Settings</Link>
              </div>
            )}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex flex-col h-[100dvh] overflow-hidden">
          {/* Top Nav */}
          <div className="sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-3 shrink-0" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileNavOpen(true)} className="lg:hidden" style={{ color: "#4A5878" }}><Menu className="w-6 h-6" /></button>
                <Link to={createPageUrl("Feed")} className="flex items-center gap-2 shrink-0 lg:hidden" style={{ color: "#0B1B3D" }}><ArrowLeft className="w-5 h-5" /></Link>
                <h1 className="text-xl font-bold" style={{ color: "#0B1B3D" }}>Messages</h1>
              </div>
              <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.06)" }}>
                <button onClick={() => setActiveTab("dms")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition" style={activeTab === "dms" ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.25)" } : { background: "transparent", color: "#4A5878" }}>
                  <MessageCircle className="w-4 h-4" /> Direct
                </button>
                <button onClick={() => setActiveTab("groups")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition" style={activeTab === "groups" ? { background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 2px 8px rgba(255, 159, 26, 0.3)" } : { background: "transparent", color: "#4A5878" }}>
                  <Users className="w-4 h-4" /> Groups {myGroups.length > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={activeTab === "groups" ? { background: "rgba(11, 27, 61, 0.15)", color: "#0B1B3D" } : { background: "#EEF3FF", color: "#0B3FD9" }}>{myGroups.length}</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4 px-4 py-4 h-full">
              {activeTab === "dms" ? (
                <>
                  <ConversationsList conversations={conversations} selectedConversationId={selectedConversationId} currentUserEmail={user.email} allUsers={allUsers} followingUsers={following.map(f => f.following_email)} onSelectConversation={setSelectedConversationId} onStartConversation={(email) => ensureConversationMutation.mutate(email)} />
                  <ChatWindow conversation={selectedConversation} currentUser={user} otherUser={otherUser} messages={messages} onSend={({ content, file_url }) => sendMessageMutation.mutate({ content, file_url })} isSending={sendMessageMutation.isPending} />
                </>
              ) : (
                <>
                  <div className="rounded-[1.5rem] overflow-hidden flex flex-col" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)", maxHeight: "calc(100dvh - 120px)" }}>
                    <div className="px-4 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
                      <h2 className="text-lg font-bold" style={{ color: "#0B1B3D" }}>GlowGroups</h2>
                      <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Chat with your group members.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {myGroups.length === 0 ? (
                        <div className="text-center py-10 px-4 text-sm" style={{ color: "#8A97B5" }}>
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />You're not in any GlowGroups yet.<br />
                          <Link to={createPageUrl("GlowGroups")} className="font-bold hover:underline mt-1 inline-block" style={{ color: "#0B3FD9" }}>Join a group →</Link>
                        </div>
                      ) : myGroups.map(group => (
                        <button key={group.id} onClick={() => setSelectedGroupId(group.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition border-b" style={{ borderColor: "#F0F4FA", background: selectedGroupId === group.id ? "#EEF3FF" : "transparent" }}
                          onMouseOver={e => { if (selectedGroupId !== group.id) e.currentTarget.style.background = "#F6F8FC"; }}
                          onMouseOut={e => { if (selectedGroupId !== group.id) e.currentTarget.style.background = "transparent"; }}
                        >
                          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)" }}><Users className="w-5 h-5 text-white" /></div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate flex items-center gap-1.5" style={{ color: "#0B1B3D" }}>
                              {group.name}
                              {group.leader_email === user.email && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(255, 208, 0, 0.18)", color: "#CC7A00" }}>Leader</span>}
                            </div>
                            <div className="text-xs truncate" style={{ color: "#6B7FA0" }}>{group.country}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <GroupChatWindow group={selectedGroup} currentUser={user} allUsers={allUsers} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(10, 26, 61, 0.4)" }} onClick={() => setIsMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 border-r flex flex-col py-8 px-6 overflow-y-auto" style={{ background: "#FFFFFF", borderColor: "#E0EAF5" }}>
            <Link to={createPageUrl("Home")} className="flex items-center mb-10">
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 56, width: "auto", objectFit: "contain" }} />
            </Link>
            <nav className="flex flex-col gap-1 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] px-3 mb-1.5" style={{ color: "#8A97B5" }}>Main</p>
              <SidebarLink to={createPageUrl("Feed")} icon={<Home className="w-[18px] h-[18px]" />} label="Home" />
              <SidebarLink to={createPageUrl("Messages")} icon={<MessageCircle className="w-[18px] h-[18px]" />} label="Messages" active />
              <SidebarLink to={createPageUrl("GlowGroups")} icon={<Globe className="w-[18px] h-[18px]" />} label="Explore" />
              <SidebarLink to={createPageUrl("Discover")} icon={<Compass className="w-[18px] h-[18px]" />} label="Discover" />
              <SidebarLink to={createPageUrl("Notifications")} icon={<Bell className="w-[18px] h-[18px]" />} label="Notifications" badge={notifications.length > 0 ? notifications.length : null} />
              <SidebarLink to={createPageUrl("Dashboard")} icon={<LayoutDashboard className="w-[18px] h-[18px]" />} label="Dashboard" />
              <SidebarLink to={createPageUrl("Profile")} icon={
                <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0" style={{ border: "1px solid #D5E3F0" }}>
                  <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
              } label="Profile" />
              <p className="text-[10px] font-black uppercase tracking-[0.18em] px-3 mt-4 mb-1.5" style={{ color: "#8A97B5" }}>Tools</p>
              <SidebarLink to={createPageUrl("Assistant")} icon={<Bot className="w-[18px] h-[18px]" />} label="AI Assistant" accent />
              <SidebarLink to={createPageUrl("DailyDevotion")} icon={<BookOpen className="w-[18px] h-[18px]" />} label="Bible School" />
              <SidebarLink to={createPageUrl("Home")} icon={<ExternalLink className="w-[18px] h-[18px]" />} label="Back to Website" />
              <SidebarLink to="/Settings" icon={<Settings className="w-[18px] h-[18px]" />} label="Settings" />
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t flex justify-around items-center py-3 px-6 z-50 pb-6 sm:max-w-xl sm:mx-auto sm:border-x lg:hidden" style={{ background: "rgba(246, 248, 252, 0.95)", borderColor: "#E2E8F0" }}>
        <Link to={createPageUrl("Feed")}><Home className="w-6 h-6" style={{ color: "#0B1B3D" }} /></Link>
        <Link to={createPageUrl("Messages")}><MessageCircle className="w-6 h-6" fill="#0B3FD9" style={{ color: "#0B3FD9" }} /></Link>
        <Link to={createPageUrl("Dashboard")}><PlusSquare className="w-6 h-6" style={{ color: "#0B1B3D" }} /></Link>
        <Link to={createPageUrl("GlobalReach")}><Globe className="w-6 h-6" style={{ color: "#0B1B3D" }} /></Link>
        <Link to={createPageUrl("Profile")}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden" style={{ border: "2px solid #1FB8FF" }}>
            <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
          </div>
        </Link>
      </div>
    </div>
  );
}