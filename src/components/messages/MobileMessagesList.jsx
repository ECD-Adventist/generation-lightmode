import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, X, PenSquare, MessageCircle, Users, ArrowLeft, Crown, Sparkles, UserPlus, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDisplayName } from "@/lib/displayName";
import UserAvatar from "@/components/common/UserAvatar";

/**
 * Mobile-only Messages list — LightMode branded.
 * Palette: cyan #1FB8FF, royal #0B3FD9, gold #FFD000, navy #0B1B3D.
 */
export default function MobileMessagesList({
  activeTab,
  onTabChange,
  // DMs
  conversations,
  selectedConversationId,
  currentUserEmail,
  allUsers,
  followingUsers,
  onSelectConversation,
  onStartConversation,
  // Groups
  myGroups,
  allGroups = [],
  joinRequests = [],
  onRequestJoinGroup,
  isRequestingJoin,
  selectedGroupId,
  onSelectGroup,
  currentUser,
}) {
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const getUser = (email) =>
    allUsers.find((u) => u.email === email) || { username: email?.split("@")[0] || "User", email };

  const existingEmails = useMemo(
    () => new Set(
      conversations.map((c) =>
        c.participant_a_email === currentUserEmail ? c.participant_b_email : c.participant_a_email
      )
    ),
    [conversations, currentUserEmail]
  );

  const uniqueConversations = useMemo(() => {
    const byOther = new Map();
    [...conversations]
      .sort((a, b) => new Date(b.last_message_at || b.updated_date || 0) - new Date(a.last_message_at || a.updated_date || 0))
      .forEach((c) => {
        const otherEmail = c.participant_a_email === currentUserEmail ? c.participant_b_email : c.participant_a_email;
        if (!otherEmail) return;
        if (!byOther.has(otherEmail)) byOther.set(otherEmail, c);
      });
    return Array.from(byOther.values());
  }, [conversations, currentUserEmail]);

  const q = search.trim().toLowerCase();

  const filteredConversations = useMemo(() => uniqueConversations.filter((c) => {
    if (!q) return true;
    const otherEmail = c.participant_a_email === currentUserEmail ? c.participant_b_email : c.participant_a_email;
    const otherUser = getUser(otherEmail);
    return (
      getDisplayName(otherUser)?.toLowerCase().includes(q) ||
      (c.last_message || "").toLowerCase().includes(q)
    );
  }), [uniqueConversations, currentUserEmail, q, allUsers]);

  const myGroupIds = useMemo(() => new Set(myGroups.map(g => g.id)), [myGroups]);
  const pendingRequestIds = useMemo(
    () => new Set(joinRequests.filter(r => r.status === "pending").map(r => r.group_id)),
    [joinRequests]
  );
  const approvedRequestIds = useMemo(
    () => new Set(joinRequests.filter(r => r.status === "approved").map(r => r.group_id)),
    [joinRequests]
  );

  const userLocation = (currentUser?.country || currentUser?.territory || currentUser?.location || "").toLowerCase();

  const groupMatchesSearch = (group) => {
    if (!q) return true;
    return group.name?.toLowerCase().includes(q) ||
      (group.country || "").toLowerCase().includes(q) ||
      (group.description || "").toLowerCase().includes(q) ||
      (group.tags || "").toLowerCase().includes(q);
  };

  const groupMatchesFilter = (group) => {
    if (groupFilter === "local") {
      const groupCountry = (group.country || "").toLowerCase();
      return userLocation ? groupCountry.includes(userLocation) : Boolean(groupCountry.trim());
    }
    if (groupFilter === "interest") return Boolean((group.tags || "").trim() || (group.description || "").trim());
    return true;
  };

  const filteredGroups = useMemo(() => {
    return myGroups.filter(groupMatchesSearch).filter(groupMatchesFilter);
  }, [myGroups, q, groupFilter, userLocation]);

  const discoverGroups = useMemo(() => {
    return allGroups
      .filter(g => g.id && !myGroupIds.has(g.id) && g.leader_email !== currentUserEmail && !approvedRequestIds.has(g.id))
      .filter(groupMatchesSearch)
      .filter(groupMatchesFilter)
      .slice(0, 30);
  }, [allGroups, myGroupIds, currentUserEmail, approvedRequestIds, q, groupFilter, userLocation]);

  const newChatResults = useMemo(() => {
    const nq = newChatQuery.trim().toLowerCase();
    const pool = nq
      ? allUsers.filter(
          (u) =>
            u.email !== currentUserEmail &&
            !existingEmails.has(u.email) &&
            (getDisplayName(u)?.toLowerCase().includes(nq) || (u.email || "").toLowerCase().includes(nq))
        )
      : allUsers.filter((u) => followingUsers.includes(u.email) && !existingEmails.has(u.email));
    return pool.slice(0, 30);
  }, [newChatQuery, allUsers, followingUsers, currentUserEmail, existingEmails]);

  return (
    <div className="min-h-screen font-['Inter'] relative overflow-hidden" style={{ background: "linear-gradient(180deg, #F6F8FC 0%, #EEF3FF 60%, #E2EBFF 100%)", color: "#0B1B3D" }}>
      <style>{`
        @keyframes mm-float { 0%,100% { transform: translateY(0) scale(1); opacity: 0.18 } 50% { transform: translateY(-16px) scale(1.08); opacity: 0.32 } }
        .mm-hide-scrollbar::-webkit-scrollbar { display: none; }
        .mm-hide-scrollbar { scrollbar-width: none; }
      `}</style>

      {/* Ambient orbs */}
      <div className="absolute top-[25%] -left-10 w-48 h-48 rounded-full blur-[80px] pointer-events-none" style={{ background: "#1FB8FF", animation: "mm-float 10s ease-in-out infinite" }} />
      <div className="absolute top-[60%] -right-10 w-56 h-56 rounded-full blur-[90px] pointer-events-none" style={{ background: "#FFD000", opacity: 0.18, animation: "mm-float 14s ease-in-out infinite 2s" }} />

      {/* HERO — extends under the status bar / camera notch */}
      <div className="relative overflow-hidden safe-pt pb-5 px-4" style={{ background: "linear-gradient(135deg, #0B3FD9 0%, #1FB8FF 100%)" }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-40" style={{ background: "#FFD000" }} />
        <div className="absolute -bottom-12 -left-10 w-48 h-48 rounded-full blur-3xl opacity-30" style={{ background: "#7FE0FF" }} />

        <div className="relative flex items-center gap-2 mb-3 pt-3">
          <Link to={createPageUrl("Feed")} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(10px)", color: "#FFFFFF" }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Inbox</div>
            <h1 className="text-xl font-black font-['Space_Grotesk'] text-white leading-tight">Messages</h1>
          </div>
          <button
            onClick={() => { setShowNewChat(true); setNewChatQuery(""); }}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-black active:scale-95 transition"
            style={{ background: "#FFD000", color: "#0B1B3D", boxShadow: "0 6px 16px rgba(255, 208, 0, 0.45)" }}
          >
            <PenSquare className="w-3.5 h-3.5" /> New
          </button>
        </div>

        {/* Search pill */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#0B3FD9" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === "dms" ? "Search chats…" : "Search groups…"}
            className="w-full rounded-full py-3 pl-11 pr-10 text-[14px] font-medium focus:outline-none"
            style={{ background: "#FFFFFF", color: "#0B1B3D", boxShadow: "0 8px 24px rgba(11, 27, 61, 0.18)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 px-3 py-2.5 backdrop-blur-xl" style={{ background: "rgba(246, 248, 252, 0.92)", borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-1.5">
          {[
            { id: "dms", label: "Direct", icon: MessageCircle, count: uniqueConversations.length },
            { id: "groups", label: "Groups", icon: Users, count: myGroups.length },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[12px] font-black transition"
                style={isActive
                  ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" }
                  : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {t.count > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={isActive ? { background: "rgba(255,255,255,0.25)", color: "#FFFFFF" } : { background: "#EEF3FF", color: "#0B3FD9" }}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-3 pb-10 pt-3 space-y-2.5">

        {activeTab === "dms" && (
          <>
            {filteredConversations.length === 0 ? (
              <EmptyState
                emoji="💬"
                title={q ? "No chats found" : "No conversations yet"}
                subtitle={q ? "Try a different name" : "Tap “New” to start a chat"}
                actionLabel={!q ? "Start your first chat" : null}
                onAction={() => { setShowNewChat(true); setNewChatQuery(""); }}
              />
            ) : filteredConversations.map(conversation => {
              const otherEmail = conversation.participant_a_email === currentUserEmail ? conversation.participant_b_email : conversation.participant_a_email;
              const otherUser = getUser(otherEmail);
              const isSelected = selectedConversationId === conversation.id;
              const lastAt = conversation.last_message_at || conversation.updated_date;
              const hasUnread = conversation.last_message && !isSelected; // simple cue

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98]"
                  style={{ background: "#FFFFFF", border: isSelected ? "1px solid #1FB8FF" : "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}
                >
                  <div className="w-12 h-12 rounded-full p-[2px] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
                    <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "2px solid #FFFFFF" }}>
                      <UserAvatar user={otherUser} className="w-full h-full" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-black text-sm truncate" style={{ color: "#0B1B3D" }}>{getDisplayName(otherUser)}</div>
                      {lastAt && (
                        <div className="text-[10px] font-semibold shrink-0" style={{ color: "#8A97B5" }}>
                          {formatDistanceToNow(new Date(lastAt.endsWith?.("Z") ? lastAt : lastAt + "Z"), { addSuffix: false })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="text-[12px] truncate flex-1" style={{ color: "#6B7FA0" }}>
                        {conversation.last_message || "Start chatting"}
                      </div>
                      {hasUnread && (
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#0B3FD9" }} />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {activeTab === "groups" && (
          <>
            <div className="rounded-2xl p-3 space-y-3" style={{ background: "rgba(255,255,255,0.92)", border: "1px solid #E6ECF5", boxShadow: "0 2px 10px rgba(11, 63, 217, 0.05)" }}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#0B3FD9" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Find local or interest-based GlowGroups…"
                  className="w-full rounded-full py-2.5 pl-10 pr-9 text-[13px] font-semibold focus:outline-none"
                  style={{ background: "#F6F8FC", color: "#0B1B3D", border: "1px solid #D6E4FF" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto mm-hide-scrollbar">
                {[
                  { id: "all", label: "All groups" },
                  { id: "local", label: "Local" },
                  { id: "interest", label: "Interest-based" },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setGroupFilter(filter.id)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black transition active:scale-95"
                    style={groupFilter === filter.id
                      ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 3px 10px rgba(11, 63, 217, 0.25)" }
                      : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredGroups.length === 0 && discoverGroups.length === 0 ? (
              <EmptyState
                emoji="👥"
                title={q ? "No groups found" : "No GlowGroups yet"}
                subtitle={q ? "Try a different name" : "Search or ask to join an existing group"}
                actionLabel={!q ? "Explore Groups" : null}
                onActionLink={createPageUrl("GlowGroups")}
              />
            ) : (
              <>
                {filteredGroups.length > 0 && (
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] px-2 pt-1" style={{ color: "#0B3FD9" }}>
                    My Groups
                  </div>
                )}
                {filteredGroups.map(group => {
                  const isLeaderGroup = group.leader_email === currentUser?.email;
                  const isSelected = selectedGroupId === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => onSelectGroup(group.id)}
                      className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98]"
                      style={{ background: "#FFFFFF", border: isSelected ? "1px solid #FFD000" : "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}
                    >
                      <GroupImage group={group} isLeaderGroup={isLeaderGroup} />
                      <GroupInfo group={group} isLeaderGroup={isLeaderGroup} />
                    </button>
                  );
                })}

                {discoverGroups.length > 0 && (
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] px-2 pt-4" style={{ color: "#0B3FD9" }}>
                    Discover Groups
                  </div>
                )}
                {discoverGroups.map(group => {
                  const requested = pendingRequestIds.has(group.id);
                  return (
                    <div
                      key={group.id}
                      className="w-full flex items-center gap-3 rounded-2xl p-3 text-left"
                      style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}
                    >
                      <GroupImage group={group} />
                      <GroupInfo group={group} />
                      <button
                        onClick={() => onRequestJoinGroup?.(group)}
                        disabled={requested || isRequestingJoin}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-black transition active:scale-95 disabled:opacity-70"
                        style={requested
                          ? { background: "#EEF3FF", color: "#0B3FD9" }
                          : { background: "#FFD000", color: "#0B1B3D", boxShadow: "0 3px 10px rgba(255, 208, 0, 0.35)" }}
                      >
                        {requested ? <Clock className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                        {requested ? "Requested" : "Join"}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* New Chat overlay */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#FFFFFF" }}>
          <div className="relative overflow-hidden pt-5 pb-4 px-4" style={{ background: "linear-gradient(135deg, #0B3FD9 0%, #1FB8FF 100%)" }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-40" style={{ background: "#FFD000" }} />
            <div className="relative flex items-center gap-3">
              <button onClick={() => setShowNewChat(false)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.22)", color: "#FFFFFF" }}>
                <X className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Compose</div>
                <h2 className="text-lg font-black font-['Space_Grotesk'] text-white">New Chat</h2>
              </div>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#0B3FD9" }} />
              <input
                autoFocus
                placeholder="Search people by name or email…"
                value={newChatQuery}
                onChange={(e) => setNewChatQuery(e.target.value)}
                className="w-full rounded-full py-2.5 pl-11 pr-4 text-[14px] font-medium focus:outline-none"
                style={{ background: "#FFFFFF", color: "#0B1B3D" }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {!newChatQuery && newChatResults.length > 0 && (
              <div className="text-[10px] font-black uppercase tracking-[0.15em] px-2 pb-2" style={{ color: "#0B3FD9" }}>
                People you follow
              </div>
            )}
            {newChatResults.length === 0 ? (
              <EmptyState emoji="🔍" title="No users found" subtitle={newChatQuery ? "Try a different name" : "Follow people to start chats"} />
            ) : (
              <div className="space-y-2">
                {newChatResults.map(person => (
                  <button
                    key={person.email}
                    onClick={() => { onStartConversation(person.email); setShowNewChat(false); }}
                    className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98]"
                    style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}
                  >
                    <div className="w-11 h-11 rounded-full p-[2px] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
                      <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "2px solid #FFFFFF" }}>
                        <UserAvatar user={person} className="w-full h-full" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm truncate" style={{ color: "#0B1B3D" }}>{getDisplayName(person)}</div>
                      <div className="text-[11px] truncate" style={{ color: "#8A97B5" }}>{person.location || person.country || "LightMode member"}</div>
                    </div>
                    <div className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>Chat</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupImage({ group, isLeaderGroup }) {
  const imageUrl = group.cover_picture_url || group.profile_picture_url;
  return (
    <div className="w-16 h-12 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 relative" style={{
      background: imageUrl ? `url(${imageUrl}) center/cover` : "linear-gradient(135deg, #1FB8FF, #0B3FD9)",
      boxShadow: "0 4px 10px rgba(11, 63, 217, 0.2)"
    }}>
      {!imageUrl && <Users className="w-5 h-5 text-white" />}
      {imageUrl && <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(11, 27, 61, 0.22))" }} />}
      {isLeaderGroup && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#FFD000", boxShadow: "0 2px 6px rgba(255, 208, 0, 0.5)" }}>
          <Crown className="w-2.5 h-2.5" style={{ color: "#0B1B3D" }} />
        </div>
      )}
    </div>
  );
}

function GroupInfo({ group, isLeaderGroup }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <div className="font-black text-sm truncate flex-1" style={{ color: "#0B1B3D" }}>{group.name}</div>
        {isLeaderGroup && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black shrink-0" style={{ background: "#FFF8E6", color: "#CC7A00" }}>Leader</span>
        )}
      </div>
      <div className="text-[12px] truncate mt-0.5 flex items-center gap-1" style={{ color: "#6B7FA0" }}>
        <Sparkles className="w-3 h-3" style={{ color: "#1FB8FF" }} />
        {group.country || "Global"}
        {group.privacy === "private" && (
          <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>🔒</span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ emoji, title, subtitle, actionLabel, onAction, onActionLink }) {
  const btnStyle = { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" };
  return (
    <div className="py-16 text-center rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
      <div className="text-4xl mb-2">{emoji}</div>
      <div className="text-sm font-bold mb-1" style={{ color: "#0B1B3D" }}>{title}</div>
      <div className="text-xs" style={{ color: "#8A97B5" }}>{subtitle}</div>
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-4 px-5 py-2 rounded-full text-xs font-black" style={btnStyle}>{actionLabel}</button>
      )}
      {actionLabel && onActionLink && (
        <Link to={onActionLink} className="inline-block mt-4 px-5 py-2 rounded-full text-xs font-black no-underline" style={btnStyle}>{actionLabel}</Link>
      )}
    </div>
  );
}