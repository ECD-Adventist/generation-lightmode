import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { Send, Paperclip, Users, Crown, ArrowLeft, MoreVertical, Trash2, Smile, Info, Calendar, Image as ImageIcon, X, MessageCircle, Loader2, LogOut, Bell, BellOff, Search, Check, UserPlus, BarChart3, ChevronDown, BookOpen, Shield } from "lucide-react";
import GroupAnalyticsPanel from "@/components/groups/GroupAnalyticsPanel";
import GroupResourcesTab from "@/components/groups/GroupResourcesTab";
import GroupManagementPanel, { ROLE_META } from "@/components/groups/GroupManagementPanel";
import PendingRequestsDrawer from "@/components/groups/PendingRequestsDrawer";
import useUrlOverlay from "@/hooks/useUrlOverlay";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";
const EMOJIS = ["👍","❤️","🙏","🔥","🎉","😊","😂","😢","💯","✨","🕊️","🙌"];

function parseDate(s) { if (!s) return null; return new Date(s.endsWith("Z") ? s : s + "Z"); }
function formatMessageTime(s) { const d = parseDate(s); if (!d) return ""; if (isToday(d)) return format(d, "HH:mm"); if (isYesterday(d)) return "Yesterday " + format(d, "HH:mm"); return format(d, "MMM d, HH:mm"); }
function formatDayDivider(s) { const d = parseDate(s); if (!d) return ""; if (isToday(d)) return "Today"; if (isYesterday(d)) return "Yesterday"; return format(d, "MMMM d, yyyy"); }

// Build a slug key from a full name for @mention matching: "Jane Doe" -> "jane_doe"
function slugifyName(name) { return (name || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_.]/g, ""); }
function normalizeEmail(value) { return String(value || "").trim().toLowerCase(); }

// Extract @mention slugs from a message. Matches @letters/digits/underscore/dots (up to 40 chars).
function extractMentionSlugs(text) {
  if (!text) return [];
  const matches = text.match(/@([a-zA-Z0-9_.]{1,40})/g) || [];
  return [...new Set(matches.map(m => {
    let slug = m.slice(1).toLowerCase();
    while(slug.endsWith('.')) slug = slug.slice(0, -1);
    return slug;
  }))];
}

// Render message text with clickable @mentions. mentionMap: slug -> {email, full_name}
function renderMessageContent(text, mentionMap, isMine) {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_.]{1,40})/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      let slug = part.slice(1).toLowerCase();
      let trailing = "";
      while(slug.endsWith('.')) { trailing += "."; slug = slug.slice(0, -1); }
      const u = mentionMap[slug];
      if (u) {
        return (
          <React.Fragment key={i}>
            <Link
              to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold hover:underline"
              style={{ color: isMine ? "#FFD000" : "#0B3FD9" }}
            >
              @{u.full_name.replace(/\s+/g, " ")}
            </Link>
            {trailing}
          </React.Fragment>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

export default function GroupChat() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get("id");
  const queryClient = useQueryClient();
  const requestsOverlay = useUrlOverlay("requests");

  const [draft, setDraft] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null); // null when not mentioning; string when "@..." is being typed
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [activeView, setActiveView] = useState("chat"); // "chat" | "resources"
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Redirect if no groupId
  useEffect(() => {
    if (!groupId) navigate(createPageUrl("GlowGroups"));
  }, [groupId, navigate]);

  // Auth check
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(window.location.pathname + window.location.search); return null; }
      return base44.auth.me();
    }
  });

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["glowGroup", groupId],
    queryFn: async () => {
      const results = await base44.entities.GlowGroup.filter({ id: groupId });
      return results[0] || null;
    },
    enabled: !!groupId
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["groupMessages", groupId],
    queryFn: () => base44.entities.GlowGroupMessage.filter({ group_id: groupId }, "created_date"),
    enabled: !!groupId,
  });

  const { data: reactions = [] } = useQuery({
    queryKey: ["groupReactions", groupId],
    queryFn: () => base44.entities.GlowGroupMessageReaction.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: () => base44.entities.GlowGroupMember.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["groupEvents", groupId],
    queryFn: () => base44.entities.GlowGroupEvent.filter({ group_id: groupId }, "-date"),
    enabled: !!groupId,
  });

  const { data: joinRequests = [] } = useQuery({
    queryKey: ["groupPendingJoinRequestDetails", groupId, currentUser?.role],
    queryFn: async () => {
      const response = await base44.functions.invoke("listGroupJoinRequests", { group_ids: [groupId], include_details: true });
      return response.data?.requests || [];
    },
    enabled: !!groupId && !!currentUser,
    staleTime: 15_000,
  });

  const participantEmails = useMemo(() => [...new Set([
    group?.leader_email,
    ...members.map((member) => member.user_email),
    ...joinRequests.map((request) => request.user_email),
  ].map(normalizeEmail).filter(Boolean))], [group?.leader_email, members, joinRequests]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["groupParticipantPublicUsersByEmail", groupId, participantEmails.join("|")],
    queryFn: async () => {
      const response = await base44.functions.invoke("listPublicUsers", { emails: participantEmails });
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: participantEmails.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Real-time
  useEffect(() => {
    if (!groupId) return;
    const unsub = base44.entities.GlowGroupMessage.subscribe((event) => {
      if (event.data?.group_id === groupId) {
        queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] });
      }
    });
    const unsubR = base44.entities.GlowGroupMessageReaction.subscribe((event) => {
      if (event.data?.group_id === groupId) queryClient.invalidateQueries({ queryKey: ["groupReactions", groupId] });
    });
    const unsubRequests = base44.entities.GlowGroupJoinRequest.subscribe((event) => {
      if (event.data?.group_id === groupId) queryClient.invalidateQueries({ queryKey: ["groupPendingJoinRequestDetails", groupId] });
    });
    const unsubMembers = base44.entities.GlowGroupMember.subscribe((event) => {
      if (event.data?.group_id === groupId) queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] });
    });
    return () => { unsub(); unsubR(); unsubRequests(); unsubMembers(); };
  }, [groupId, queryClient]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  useEffect(() => { inputRef.current?.focus(); }, [groupId]);

  useEffect(() => {
    const close = () => { setMenuOpenId(null); setShowEmoji(false); };
    if (menuOpenId || showEmoji) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [menuOpenId, showEmoji]);

  const sendMutation = useMutation({
    mutationFn: async ({ content, file_url }) => {
      await base44.entities.GlowGroupMessage.create({
        group_id: groupId, user_email: currentUser.email, content, file_url: file_url || undefined,
      });

      // Handle @mention notifications + inbox messages (members only)
      const slugs = extractMentionSlugs(content);
      if (slugs.length > 0) {
        const mentionedEmails = [];
        slugs.forEach(slug => {
          const u = mentionMap[slug];
          if (u && u.email !== currentUser.email) mentionedEmails.push(u.email);
        });
        if (mentionedEmails.length > 0) {
          base44.functions.invoke("sendGroupMentionInbox", {
            group_id: groupId,
            mentioned_emails: [...new Set(mentionedEmails)],
            message_preview: content,
            sender_email: currentUser.email,
            sender_name: currentUser.full_name || currentUser.email?.split('@')[0] || 'Someone',
          }).catch(() => {});
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] }),
    onError: () => toast.error("Failed to send message"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => { await base44.entities.GlowGroupMessage.delete(id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] }); toast.success("Message deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const reactMutation = useMutation({
    mutationFn: async ({ message_id, emoji }) => {
      const existing = reactions.find(r => r.message_id === message_id && r.user_email === currentUser.email && r.emoji === emoji);
      if (existing) {
        await base44.entities.GlowGroupMessageReaction.delete(existing.id);
      } else {
        await base44.entities.GlowGroupMessageReaction.create({
          group_id: groupId,
          message_id,
          user_email: currentUser.email,
          emoji
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groupReactions", groupId] })
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const myMembership = members.find(m => m.user_email === currentUser.email);
      if (myMembership) await base44.entities.GlowGroupMember.delete(myMembership.id);
    },
    onSuccess: () => { toast.success("Left the group"); navigate(createPageUrl("GlowGroups")); },
    onError: () => toast.error("Could not leave group"),
  });

  const decideRequestMutation = useMutation({
    mutationFn: async ({ request_id, action }) => {
      const res = await base44.functions.invoke("handleGroupJoinRequest", { request_id, action });
      if (!res.data?.success) throw new Error(res.data?.error || "Failed");
      return res.data;
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["groupPendingJoinRequestDetails", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] });
      toast.success(vars.action === "approve" ? "Member approved ✅" : "Request declined");
    },
    onError: (err) => toast.error(err.message || "Could not process request"),
  });

  const getUser = (email) => email === currentUser?.email ? currentUser : allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0] || "Member", email };

  const isMember = useMemo(() => members.some(m => normalizeEmail(m.user_email) === normalizeEmail(currentUser?.email)), [members, currentUser]);
  const isLeader = normalizeEmail(group?.leader_email) === normalizeEmail(currentUser?.email);
  const canManageRequests = isLeader || currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const leaderUserId = allUsers.find((entry) => normalizeEmail(entry.email) === normalizeEmail(group?.leader_email))?.id;
  const { data: groupFollowers = [] } = useQuery({
    queryKey: ["groupAccountFollowers", groupId, leaderUserId],
    queryFn: () => base44.entities.Follow.filter({ following_id: leaderUserId }, "-created_date", 500),
    enabled: !!leaderUserId,
  });

  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    const q = searchTerm.toLowerCase();
    return messages.filter(m => m.content?.toLowerCase().includes(q));
  }, [messages, searchTerm]);

  const memberDetails = useMemo(() => {
    const seen = new Set();
    const list = [];
    // Leader first
    if (group?.leader_email) { list.push({ ...getUser(group.leader_email), isLeader: true, role: null }); seen.add(group.leader_email); }
    members.forEach(m => { if (!seen.has(m.user_email)) { list.push({ ...getUser(m.user_email), isLeader: false, role: m.role || "member" }); seen.add(m.user_email); } });
    return list;
  }, [members, group, allUsers, currentUser]);

  // Map of slug -> { email, full_name } — ONLY members (so only members render as clickable mentions)
  const mentionMap = useMemo(() => {
    const map = {};
    memberDetails.forEach(m => { if (m.full_name) map[slugifyName(m.full_name)] = { email: m.email, full_name: m.full_name }; });
    return map;
  }, [memberDetails]);

  // Mention autocomplete — ONLY accepted group members (image 2 feedback)
  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase().trim();

    const matches = (u) => {
      if (!u?.full_name || u.email === currentUser?.email) return false;
      if (q === "") return true;
      const name = u.full_name.toLowerCase();
      const slug = slugifyName(u.full_name);
      return name.includes(q) || slug.includes(q) || (u.email || "").toLowerCase().includes(q);
    };

    return memberDetails.filter(matches).slice(0, 8);
  }, [mentionQuery, memberDetails, currentUser]);

  const handleDraftChange = (value) => {
    setDraft(value);
    const el = inputRef.current;
    const cursorPos = el ? el.selectionStart : value.length;
    // Find the last "@" before cursor that starts a mention token (preceded by whitespace or start)
    const before = value.slice(0, cursorPos);
    const match = before.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (user) => {
    const el = inputRef.current;
    const cursorPos = el ? el.selectionStart : draft.length;
    const before = draft.slice(0, cursorPos);
    const after = draft.slice(cursorPos);
    const newBefore = before.replace(/@([a-zA-Z0-9_]*)$/, `@${slugifyName(user.full_name)} `);
    const newValue = newBefore + after;
    setDraft(newValue);
    setMentionQuery(null);
    setTimeout(() => {
      if (el) { el.focus(); const newPos = newBefore.length; el.setSelectionRange(newPos, newPos); }
    }, 0);
  };

  if (!groupId || userLoading || groupLoading || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;
  }
  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F6F8FC" }}>
        <div className="text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-bold mb-2" style={{ color: "#0B1B3D" }}>Group not found</p>
          <Link to={createPageUrl("GlowGroups")} className="font-bold text-sm" style={{ color: "#0B3FD9" }}>← Back to GlowGroups</Link>
        </div>
      </div>
    );
  }

  let lastDay = null;
  const sendContent = (content, file_url) => sendMutation.mutate({ content, file_url: file_url || null });

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <div className="max-w-7xl mx-auto flex h-screen">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 border-r" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
          {/* Header — cinematic hero style with cover/avatar */}
          <div className="relative shrink-0 overflow-hidden border-b" style={{ borderColor: "#E6ECF5" }}>
            {/* Cover background */}
            <div className="absolute inset-0" style={{
              background: group.cover_picture_url
                ? `url(${group.cover_picture_url}) center/cover`
                : "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 60%, #0B1B3D 100%)"
            }} />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,27,61,0.25) 0%, rgba(11,27,61,0.65) 100%)" }} />

            <div className="relative px-4 sm:px-6 py-3 flex items-center gap-3">
              <Link to={createPageUrl("GlowGroups")} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition backdrop-blur-md" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#FFFFFF" }}>
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <button onClick={() => setShowInfoPanel(v => !v)} className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden" style={{
                background: group.profile_picture_url ? `url(${group.profile_picture_url}) center/cover` : "linear-gradient(135deg, #FFD000, #FF9F1A)",
                border: "2px solid rgba(255,255,255,0.8)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.3)"
              }}>
                {!group.profile_picture_url && <span className="text-xl">✨</span>}
              </button>

              <button onClick={() => setShowInfoPanel(v => !v)} className="flex-1 min-w-0 text-left">
                <div className="font-bold text-lg truncate text-white drop-shadow">{group.name}</div>
                <div className="text-xs flex items-center gap-1.5 truncate text-white/85">
                  <Users className="w-3 h-3 shrink-0" /> <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
                  {group.country && <><span className="opacity-60">·</span><span className="truncate">📍 {group.country}</span></>}
                  {group.privacy === "private" && <><span className="opacity-60">·</span><span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(255,208,0,0.25)", border: "1px solid rgba(255,208,0,0.4)" }}>🔒 PRIVATE</span></>}
                </div>
              </button>

              {canManageRequests && (
                <button onClick={() => requestsOverlay.open("true")} className="relative min-h-11 rounded-full px-3 flex items-center gap-1.5 shrink-0 backdrop-blur-md text-xs font-bold" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#FFFFFF" }} aria-label={`${joinRequests.length} pending requests`}>
                  <UserPlus className="w-4 h-4" /><span className="hidden sm:inline">Requests</span>{joinRequests.length > 0 && <span className="min-w-5 h-5 px-1 rounded-full flex items-center justify-center bg-amber-400 text-[10px] text-slate-900">{joinRequests.length}</span>}
                </button>
              )}
              <button onClick={() => setShowSearch(v => !v)} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition backdrop-blur-md" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#FFFFFF" }} aria-label="Search messages">
                <Search className="w-4 h-4" />
              </button>
              <button onClick={() => setShowInfoPanel(v => !v)} className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition backdrop-blur-md" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#FFFFFF" }}>
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View tabs: Chat | Resources */}
          <div className="px-4 sm:px-6 py-2 border-b flex items-center gap-1 shrink-0" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
            <button onClick={() => setActiveView("chat")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition" style={activeView === "chat" ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)" } : { background: "transparent", color: "#4A5878" }}>
              <MessageCircle className="w-3.5 h-3.5" /> Chat
            </button>
            <button onClick={() => setActiveView("resources")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition" style={activeView === "resources" ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)" } : { background: "transparent", color: "#4A5878" }}>
              <BookOpen className="w-3.5 h-3.5" /> Resources
            </button>
          </div>

          {activeView === "resources" ? (
            <GroupResourcesTab group={group} currentUser={currentUser} isLeader={isLeader} />
          ) : (<>
          {/* Search bar */}
          {showSearch && (
            <div className="px-4 py-2 border-b shrink-0" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8A97B5" }} />
                <input autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search messages..." className="w-full rounded-full py-2 pl-9 pr-9 text-sm focus:outline-none" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }} />
                {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8A97B5" }}><X className="w-4 h-4" /></button>}
              </div>
            </div>
          )}

          {/* Events banner (if upcoming) */}
          {events.length > 0 && (
            <div className="px-4 py-2 border-b shrink-0 flex items-center gap-2 overflow-x-auto hide-scrollbar" style={{ borderColor: "#E6ECF5", background: "linear-gradient(90deg, rgba(255,208,0,0.06), rgba(31,184,255,0.04))" }}>
              <Calendar className="w-4 h-4 shrink-0" style={{ color: "#CC7A00" }} />
              {events.slice(0, 3).map(ev => (
                <div key={ev.id} className="text-xs px-3 py-1 rounded-full whitespace-nowrap shrink-0" style={{ background: "#FFFFFF", border: "1px solid #FFE4A0", color: "#0B1B3D" }}>
                  <span className="font-bold">{ev.title}</span> · <span style={{ color: "#6B7FA0" }}>{ev.date ? format(parseDate(ev.date), "MMM d, HH:mm") : ""}</span>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-1" style={{ background: "linear-gradient(180deg, #F6F8FC 0%, #EEF3FF 100%)" }}>
            {filteredMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <div className="relative mb-5">
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }} />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #EEF3FF 100%)", border: "2px solid #FFFFFF", boxShadow: "0 10px 30px rgba(11, 63, 217, 0.15)" }}>
                    <MessageCircle className="w-8 h-8" style={{ color: "#0B3FD9" }} />
                  </div>
                </div>
                <p className="text-lg font-bold" style={{ color: "#0B1B3D", fontFamily: "Space Grotesk, sans-serif" }}>{searchTerm ? "No matching messages" : "No messages yet"}</p>
                <p className="text-sm mt-1.5 text-center max-w-xs" style={{ color: "#6B7FA0" }}>{searchTerm ? "Try a different search term." : "Be the first to spark a conversation ✨ Greet the group and set the tone!"}</p>
              </div>
            )}
            {filteredMessages.map((msg) => {
              const isMine = msg.user_email === currentUser?.email;
              const sender = getUser(msg.user_email);
              const senderIsLeader = msg.user_email === group.leader_email;
              const msgDay = msg.created_date ? formatDayDivider(msg.created_date) : "";
              const showDayDivider = msgDay && msgDay !== lastDay;
              lastDay = msgDay;
              const canDelete = isMine || isLeader;

              const msgReactions = reactions.filter(r => r.message_id === msg.id);
              const groupedReactions = msgReactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {});

              return (
                <React.Fragment key={msg.id}>
                  {showDayDivider && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: "#FFFFFF", color: "#6B7FA0", border: "1px solid #E6ECF5" }}>{msgDay}</span>
                    </div>
                  )}
                  <div className={`flex gap-2 group ${isMine ? "justify-end" : "justify-start"}`}>
                    {!isMine && (
                      <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(msg.user_email)}`} className="shrink-0 mt-1">
                        <img src={sender.profile_picture_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover" style={{ border: "1px solid #E6ECF5" }} alt={sender.full_name} />
                      </Link>
                    )}
                    <div className={`max-w-[80%] sm:max-w-[65%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      {!isMine && (
                        <div className="flex items-center gap-1 mb-0.5 px-1">
                          <span className="text-xs font-bold" style={{ color: "#4A5878" }}>{sender.full_name}</span>
                          {senderIsLeader && <Crown className="w-3 h-3" style={{ color: "#CC7A00" }} />}
                        </div>
                      )}
                      <div className={`flex items-center gap-1 ${isMine ? "flex-row" : "flex-row-reverse"}`}>
                        {/* Actions: always-visible emoji react + hover-only delete */}
                        <div className="relative flex items-center gap-1">
                          {/* Emoji reaction button — always visible */}
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === `emoji-${msg.id}` ? null : `emoji-${msg.id}`); }}
                              className="w-7 h-7 rounded-full flex items-center justify-center transition"
                              style={{ background: "#F0F4FA", border: "1px solid #E0E8F5", color: "#6B7FA0" }}
                              title="React"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                            {menuOpenId === `emoji-${msg.id}` && (
                              <div className={`absolute ${isMine ? 'right-0' : 'left-0'} bottom-full mb-1 bg-white border rounded-2xl shadow-lg p-2 z-50 flex gap-1`} style={{ borderColor: "#E6ECF5" }}>
                                {["👍","❤️","🙏","😂","😢","🔥"].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMenuOpenId(null);
                                      reactMutation.mutate({ message_id: msg.id, emoji });
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-xl transition"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Delete button — only on hover */}
                          {canDelete && (
                            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === msg.id ? null : msg.id); }} className="w-7 h-7 rounded-full flex items-center justify-center transition hover:bg-slate-100" style={{ color: "#6B7FA0" }}>
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              {menuOpenId === msg.id && (
                                <div className={`absolute ${isMine ? 'right-0' : 'left-0'} mt-8 rounded-lg z-50 overflow-hidden`} style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.12)" }}>
                                  <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); deleteMutation.mutate(msg.id); }} className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap transition hover:bg-red-50" style={{ color: "#DC2626" }}>
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <div className="px-4 py-2.5 rounded-2xl text-sm break-words" style={isMine ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", borderTopRightRadius: "0.375rem", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)" } : { background: "#FFFFFF", color: "#0B1B3D", border: "1px solid #E6ECF5", borderTopLeftRadius: "0.375rem" }}>
                          <div className="whitespace-pre-wrap">{renderMessageContent(msg.content, mentionMap, isMine)}</div>
                          {msg.file_url && (
                            <div className="mt-2">
                              {/\.(png|jpe?g|gif|webp)$/i.test(msg.file_url) ? (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer"><img src={msg.file_url} alt="Shared" className="max-w-[240px] rounded-lg" style={{ border: isMine ? "1px solid rgba(255,255,255,0.2)" : "1px solid #E6ECF5" }} /></a>
                              ) : (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold" style={isMine ? { background: "rgba(255,255,255,0.25)", color: "#FFFFFF" } : { background: "#F6F8FC", color: "#0B3FD9" }}>
                                  <Paperclip className="w-3 h-3" /> View file
                                </a>
                              )}
                            </div>
                          )}
                          {msgReactions.length > 0 && (
                            <div className={`absolute ${isMine ? 'right-0' : 'left-0'} -bottom-3 flex items-center bg-white border border-gray-200 rounded-full px-1.5 py-0.5 shadow-sm text-[10px]`}>
                              {Object.entries(groupedReactions).map(([emoji, count]) => (
                                <span key={emoji} className="mr-1">{emoji} {count > 1 ? count : ''}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                      <div className="text-[10px] mt-2 px-1" style={{ color: "#8A97B5" }}>{formatMessageTime(msg.created_date)}</div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          {isMember ? (
            <form onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; sendContent(draft); setDraft(""); setMentionQuery(null); }} className="px-3 sm:px-4 py-3 border-t flex items-center gap-2 shrink-0 relative" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
              {/* @Mention autocomplete — members only */}
              {mentionQuery !== null && mentionCandidates.length > 0 && (
                <div className="absolute bottom-full left-3 right-3 sm:left-4 sm:right-4 mb-2 rounded-2xl p-1.5 z-50 max-h-64 overflow-y-auto" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.15)" }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5" style={{ color: "#8A97B5" }}>Tag a group member {mentionQuery && <span style={{ color: "#0B3FD9" }}>· matching "{mentionQuery}"</span>}</div>
                  {mentionCandidates.map((u, i) => (
                    <button
                      key={u.email}
                      type="button"
                      onClick={() => insertMention(u)}
                      onMouseEnter={() => setMentionIndex(i)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-left"
                      style={{ background: i === mentionIndex ? "#EEF3FF" : "transparent" }}
                    >
                      <img src={u.profile_picture_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover shrink-0" style={{ border: "1px solid #E6ECF5" }} alt={u.full_name} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate flex items-center gap-1" style={{ color: "#0B1B3D" }}>
                          {u.full_name}
                          {u.isLeader && <Crown className="w-3 h-3" style={{ color: "#CC7A00" }} />}
                        </div>
                        <div className="text-[10px] truncate" style={{ color: "#8A97B5" }}>@{slugifyName(u.full_name)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {mentionQuery !== null && mentionCandidates.length === 0 && (
                <div className="absolute bottom-full left-3 right-3 sm:left-4 sm:right-4 mb-2 rounded-2xl p-4 z-50 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.15)" }}>
                  <div className="text-xs font-semibold" style={{ color: "#6B7FA0" }}>No group members match "{mentionQuery}"</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#8A97B5" }}>You can only tag accepted members of this group.</div>
                </div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile || sendMutation.isPending} className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 transition shrink-0 hover:scale-105" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }} title="Attach file">
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setUploadingFile(true);
                try {
                  const res = await base44.integrations.Core.UploadFile({ file });
                  sendContent(draft || `Shared a file`, res.file_url);
                  setDraft(""); e.target.value = "";
                } catch { toast.error("Failed to upload"); } finally { setUploadingFile(false); }
              }} />

              {/* Emoji */}
              <div className="relative">
                <button type="button" onClick={(e) => { e.stopPropagation(); setShowEmoji(v => !v); }} className="w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 hover:scale-105" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }} title="Emoji">
                  <Smile className="w-4 h-4" />
                </button>
                {showEmoji && (
                  <div className="absolute bottom-full mb-2 left-0 rounded-2xl p-2 grid grid-cols-6 gap-1 z-50 w-[280px]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.15)" }}>
                    {EMOJIS.map(e => (
                      <button key={e} type="button" onClick={(ev) => { ev.stopPropagation(); setDraft(d => d + e); setShowEmoji(false); inputRef.current?.focus(); }} className="w-10 h-10 flex items-center justify-center rounded-lg text-xl hover:bg-[#F6F8FC] transition">{e}</button>
                    ))}
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (mentionQuery !== null && mentionCandidates.length > 0) {
                    if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => (i + 1) % mentionCandidates.length); }
                    else if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex(i => (i - 1 + mentionCandidates.length) % mentionCandidates.length); }
                    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionCandidates[mentionIndex]); }
                    else if (e.key === "Escape") { setMentionQuery(null); }
                  }
                }}
                placeholder={`Message ${group.name}... (type @ to tag)`}
                className="flex-1 h-11 rounded-full px-5 text-sm focus:outline-none min-w-0 focus:ring-2 focus:ring-offset-0 transition-all"
                style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
              />
              <button type="submit" disabled={!draft.trim() || sendMutation.isPending || uploadingFile} className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 transition shrink-0 hover:scale-105" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 6px 18px rgba(11, 63, 217, 0.4)" }} title="Send">
                {sendMutation.isPending || uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <JoinRequestBanner group={group} currentUser={currentUser} groupId={groupId} queryClient={queryClient} />
          )}
          </>)}
        </div>

        {/* Info / Members Sidebar (desktop + toggleable mobile) */}
        <div className={`${showInfoPanel ? "fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto" : "hidden lg:flex"} flex-col w-full lg:w-80 xl:w-96 shrink-0 bg-white`}>
          {showInfoPanel && <div className="absolute inset-0 bg-black/30 lg:hidden" onClick={() => setShowInfoPanel(false)} />}
          <div className="relative flex flex-col h-full w-[90%] max-w-sm lg:w-full lg:max-w-none ml-auto bg-white border-l" style={{ borderColor: "#E6ECF5" }}>
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center gap-2 shrink-0" style={{ borderColor: "#E6ECF5", background: "#F6F8FC" }}>
              <button onClick={() => setShowInfoPanel(false)} className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}><X className="w-4 h-4" /></button>
              <h3 className="font-bold text-base" style={{ color: "#0B1B3D" }}>Group Info</h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Group Hero — cinematic cover + avatar */}
              <div className="relative border-b overflow-hidden" style={{ borderColor: "#E6ECF5" }}>
                <div className="relative h-28" style={{ background: group.cover_picture_url ? `url(${group.cover_picture_url}) center/cover` : "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 60%, #0B1B3D 100%)" }}>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,27,61,0.15) 0%, rgba(11,27,61,0.5) 100%)" }} />
                </div>
                <div className="px-5 pb-5 -mt-10 relative">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl mb-3" style={{
                    background: group.profile_picture_url ? `url(${group.profile_picture_url}) center/cover` : "linear-gradient(135deg, #FFD000, #FF9F1A)",
                    border: "4px solid #FFFFFF",
                    boxShadow: "0 6px 20px rgba(11, 63, 217, 0.25)",
                    color: "#FFFFFF"
                  }}>{!group.profile_picture_url && "✨"}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-lg" style={{ color: "#0B1B3D" }}>{group.name}</div>
                    {group.privacy === "private" && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#FFF8E6", color: "#CC7A00", border: "1px solid #FFE4A0" }}>🔒 PRIVATE</span>}
                  </div>
                  {group.country && <div className="text-xs mt-1 flex items-center gap-1" style={{ color: "#6B7FA0" }}>📍 {group.country}</div>}
                  {group.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {group.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "#EEF3FF", color: "#0B3FD9", border: "1px solid #D6E4FF" }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                  {group.description && <div className="text-sm mt-3 leading-relaxed" style={{ color: "#4A5878" }}>{group.description}</div>}

                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      { label: "Members", value: members.length, color: "#0B3FD9", bg: "#EEF3FF" },
                      { label: "Pending", value: joinRequests.length, color: "#CC7A00", bg: "#FFF8E6" },
                      { label: "Followers", value: groupFollowers.length, color: "#16A34A", bg: "#DCFCE7" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
                        <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[9px] uppercase font-bold tracking-wider" style={{ color: s.color, opacity: 0.8 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Welcome message (if set) */}
              {group.welcome_message && (
                <div className="px-5 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
                  <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0" }}>
                    <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5" style={{ color: "#CC7A00" }}>
                      <span>✨</span> Welcome Message
                    </div>
                    <div className="text-sm leading-relaxed italic" style={{ color: "#0B1B3D" }}>"{group.welcome_message}"</div>
                  </div>
                </div>
              )}

              {/* Analytics — Leader only */}
              {isLeader && (
                <div className="border-b" style={{ borderColor: "#E6ECF5" }}>
                  <button onClick={() => setShowAnalytics(v => !v)} className="w-full px-5 py-3 flex items-center justify-between transition" style={{ background: showAnalytics ? "#EEF3FF" : "#FFFFFF" }}>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" style={{ color: "#0B3FD9" }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#0B3FD9" }}>Leader Analytics</span>
                    </div>
                    <ChevronDown className="w-4 h-4 transition-transform" style={{ color: "#0B3FD9", transform: showAnalytics ? "rotate(180deg)" : "none" }} />
                  </button>
                  {showAnalytics && (
                    <div className="px-4 pb-4 pt-2" style={{ background: "#F6F8FC" }}>
                      <GroupAnalyticsPanel group={group} messages={messages} members={members} allUsers={allUsers} />
                    </div>
                  )}
                </div>
              )}

              {/* Management — Leader only */}
              {isLeader && (
                <div className="border-b" style={{ borderColor: "#E6ECF5" }}>
                  <button onClick={() => setShowManagement(v => !v)} className="w-full px-5 py-3 flex items-center justify-between transition" style={{ background: showManagement ? "#EEF3FF" : "#FFFFFF" }}>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" style={{ color: "#0B3FD9" }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#0B3FD9" }}>Leader Controls</span>
                    </div>
                    <ChevronDown className="w-4 h-4 transition-transform" style={{ color: "#0B3FD9", transform: showManagement ? "rotate(180deg)" : "none" }} />
                  </button>
                  {showManagement && (
                    <div className="px-4 pb-4 pt-2" style={{ background: "#F6F8FC" }}>
                      <GroupManagementPanel group={group} members={members} allUsers={allUsers} currentUser={currentUser} />
                    </div>
                  )}
                </div>
              )}

              {/* Pending Join Requests — Leader only */}
              {canManageRequests && joinRequests.length > 0 && (
                <div className="px-5 py-4 border-b" style={{ borderColor: "#E6ECF5", background: "#FFF8E6" }}>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "#CC7A00" }}>
                    <UserPlus className="w-3.5 h-3.5" /> Pending Requests ({joinRequests.length})
                  </div>
                  <div className="space-y-2">
                    {joinRequests.map(req => {
                      const requester = getUser(req.user_email);
                      const isBusy = decideRequestMutation.isPending && decideRequestMutation.variables?.request_id === req.id;
                      return (
                        <div key={req.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#FFFFFF", border: "1px solid #FFE4A0" }}>
                          <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(req.user_email)}`} className="shrink-0">
                            <img src={requester.profile_picture_url || defaultAvatar} className="w-9 h-9 rounded-full object-cover" style={{ border: "1px solid #E6ECF5" }} alt={requester.full_name} />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate" style={{ color: "#0B1B3D" }}>{requester.full_name}</div>
                            <div className="text-[10px] truncate" style={{ color: "#6B7FA0" }}>wants to join</div>
                          </div>
                          <button onClick={() => decideRequestMutation.mutate({ request_id: req.id, action: "approve" })} disabled={isBusy} className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50" style={{ background: "#DCFCE7", color: "#16A34A", border: "1px solid #86EFAC" }} title="Approve">
                            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button onClick={() => decideRequestMutation.mutate({ request_id: req.id, action: "reject" })} disabled={isBusy} className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50" style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" }} title="Reject">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upcoming Events */}
              {events.length > 0 && (
                <div className="px-5 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "#6B7FA0" }}><Calendar className="w-3.5 h-3.5" /> Upcoming Events</div>
                  <div className="space-y-2">
                    {events.slice(0, 3).map(ev => (
                      <div key={ev.id} className="rounded-xl p-3" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                        <div className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{ev.title}</div>
                        {ev.date && <div className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>{format(parseDate(ev.date), "EEE, MMM d · HH:mm")}</div>}
                        {ev.location && <div className="text-xs mt-0.5 truncate" style={{ color: "#6B7FA0" }}>📍 {ev.location}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              <div className="px-5 py-4">
                <div className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "#6B7FA0" }}><Users className="w-3.5 h-3.5" /> Members ({memberDetails.length})</div>
                <div className="space-y-1">
                  {memberDetails.map(m => {
                    const roleMeta = m.role && m.role !== "member" ? ROLE_META[m.role] : null;
                    return (
                      <Link key={m.email} to={createPageUrl("Profile") + `?user=${encodeURIComponent(m.email)}`} className="flex items-center gap-3 px-2 py-2 rounded-lg transition hover:bg-[#F6F8FC] no-underline">
                        <img src={m.profile_picture_url || defaultAvatar} className="w-9 h-9 rounded-full object-cover" style={{ border: "1px solid #E6ECF5" }} alt={m.full_name} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate flex items-center gap-1" style={{ color: "#0B1B3D" }}>
                            {m.full_name} {m.email === currentUser?.email && <span className="text-[10px] font-normal" style={{ color: "#8A97B5" }}>(You)</span>}
                          </div>
                          {m.isLeader ? (
                            <div className="text-[10px] flex items-center gap-1 font-bold" style={{ color: "#CC7A00" }}><Crown className="w-3 h-3" /> Leader</div>
                          ) : roleMeta && (
                            <div className="text-[10px] flex items-center gap-1 font-bold" style={{ color: roleMeta.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: roleMeta.color }} /> {roleMeta.label}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            {isMember && !isLeader && (
              <div className="px-5 py-3 border-t shrink-0" style={{ borderColor: "#E6ECF5" }}>
                <button onClick={() => { if (confirm("Leave this group?")) leaveMutation.mutate(); }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                  <LogOut className="w-4 h-4" /> Leave Group
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <PendingRequestsDrawer
        open={requestsOverlay.value === "true" && canManageRequests}
        onClose={requestsOverlay.close}
        requests={joinRequests}
        getUser={getUser}
        mutation={decideRequestMutation}
      />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        /* Override global cyan/violet scrollbar to match blue palette on this page */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CFD9EA; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #B8C5DC; }
        * { scrollbar-width: thin; scrollbar-color: #CFD9EA transparent; }
      `}</style>
    </div>
  );
}

function JoinRequestBanner({ group, currentUser, groupId, queryClient }) {
  const { data: myRequests = [] } = useQuery({
    queryKey: ["myRequestForGroup", groupId, currentUser?.email],
    queryFn: () => base44.entities.GlowGroupJoinRequest.filter({ group_id: groupId, user_email: currentUser?.email }, "-created_date"),
    enabled: !!groupId && !!currentUser,
  });
  const latest = myRequests[0];
  const isPending = latest?.status === "pending";
  const isRejected = latest?.status === "rejected";

  const requestMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke("requestGroupJoin", { group_id: groupId });
      if (!response.data?.success) throw new Error(response.data?.error || "Could not send request");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRequestForGroup", groupId, currentUser?.email] });
      toast.success("Request sent. Awaiting leader approval. ⏳");
    },
    onError: () => toast.error("Could not send request"),
  });

  if (isPending) {
    return (
      <div className="px-4 py-4 border-t flex items-center justify-between gap-3 shrink-0" style={{ borderColor: "#E6ECF5", background: "#FFF8E6" }}>
        <div className="text-sm" style={{ color: "#854D0E" }}>⏳ Your join request is awaiting leader approval.</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-t flex items-center justify-between gap-3 shrink-0" style={{ borderColor: "#E6ECF5", background: isRejected ? "#FEF2F2" : "#FFFBEB" }}>
      <div className="text-sm" style={{ color: isRejected ? "#991B1B" : "#854D0E" }}>
        {isRejected ? "Your previous request was declined. You can request again." : "Request to join this group to participate."}
      </div>
      <button onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending} className="px-4 py-2 rounded-full text-xs font-bold disabled:opacity-60" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
        {requestMutation.isPending ? "Sending..." : "Request to Join"}
      </button>
    </div>
  );
}