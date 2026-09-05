import React, { useState, useMemo } from "react";
import { Search, Archive, MoreVertical, PenSquare, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDisplayName } from "@/lib/displayName";
import UserAvatar from "@/components/common/UserAvatar";

// The conversation row carries `last_message` (written on every send), so the list
// no longer runs one DirectMessage query per conversation (was N+1 for 200 rows).
function ConversationPreviewMessage({ defaultMessage, isSelected }) {
  const text = defaultMessage || "Start chatting";
  const truncated = text.length > 40 ? text.substring(0, 40) + "..." : text;
  return (
    <div className="text-sm truncate mt-0.5" style={{ color: isSelected ? "#4A5878" : "#6B7FA0" }}>
      {truncated}
    </div>
  );
}

export default function ConversationsList({
  conversations,
  selectedConversationId,
  currentUserEmail,
  allUsers,
  followingUsers,
  onSelectConversation,
  onStartConversation,
  onArchiveConversation = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState(new Set());
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState("");

  const getUser = (email) =>
    allUsers.find((u) => u.email === email) || { username: email?.split("@")[0] || "User", email };

  const existingEmails = useMemo(
    () =>
      new Set(
        conversations.map((c) =>
          c.participant_a_email === currentUserEmail ? c.participant_b_email : c.participant_a_email
        )
      ),
    [conversations, currentUserEmail]
  );

  // Deduplicate: keep only one conversation per unique participant pair (the most recent one)
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

  const filteredConversations = useMemo(() => {
    return uniqueConversations.filter((c) => {
      const otherEmail = c.participant_a_email === currentUserEmail ? c.participant_b_email : c.participant_a_email;
      const otherUser = getUser(otherEmail);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        getDisplayName(otherUser).toLowerCase().includes(q) ||
        (c.last_message || "").toLowerCase().includes(q);
      const isArchived = archivedIds.has(c.id);
      return matchesSearch && (showArchived ? isArchived : !isArchived);
    });
  }, [uniqueConversations, currentUserEmail, searchQuery, showArchived, archivedIds, allUsers]);

  const newChatResults = useMemo(() => {
    const q = newChatQuery.trim().toLowerCase();
    const pool = q
      ? allUsers.filter(
          (u) =>
            u.email !== currentUserEmail &&
            !existingEmails.has(u.email) &&
            ((getDisplayName(u) || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q))
        )
      : allUsers.filter((u) => followingUsers.includes(u.email) && !existingEmails.has(u.email));
    return pool.slice(0, 20);
  }, [newChatQuery, allUsers, followingUsers, currentUserEmail, existingEmails]);

  const handleArchive = (conversationId, e) => {
    e.stopPropagation();
    const newSet = new Set(archivedIds);
    newSet.add(conversationId);
    setArchivedIds(newSet);
    setActiveMenuId(null);
    onArchiveConversation(conversationId);
  };

  return (
    <div
      className="relative rounded-[1.5rem] lg:rounded-[1.75rem] overflow-hidden flex flex-col h-[calc(100vh-9rem)] lg:h-[72vh] font-['Inter']"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6ECF5",
        boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)",
      }}
    >
      <div className="px-4 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#0B1B3D" }}>
              Chats
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>
              {uniqueConversations.length} conversation{uniqueConversations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { setShowNewChat(true); setNewChatQuery(""); }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition"
            style={{
              background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)",
              color: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(11, 63, 217, 0.25)",
            }}
            title="New chat"
          >
            <PenSquare className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8A97B5" }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none"
            style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
          />
        </div>

        {archivedIds.size > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="mt-3 text-xs font-bold px-3 py-1.5 rounded-full transition"
            style={
              showArchived
                ? { background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF", color: "#0B3FD9" }
                : { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }
            }
          >
            {showArchived ? "Show Active" : `Archived (${archivedIds.size})`}
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {filteredConversations.length === 0 && (
          <div className="text-center py-10 px-4" style={{ color: "#8A97B5" }}>
            <p className="text-sm">{showArchived ? "No archived conversations" : "No conversations yet"}</p>
            {!showArchived && (
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-3 text-xs font-bold px-4 py-2 rounded-full transition"
                style={{ background: "#EEF3FF", color: "#0B3FD9" }}
              >
                Start your first chat
              </button>
            )}
          </div>
        )}
        {filteredConversations.map((conversation) => {
          const otherEmail =
            conversation.participant_a_email === currentUserEmail
              ? conversation.participant_b_email
              : conversation.participant_a_email;
          const otherUser = getUser(otherEmail);
          const isSelected = selectedConversationId === conversation.id;
          const lastAt = conversation.last_message_at || conversation.updated_date;

          return (
            <div key={conversation.id} className="relative group">
              <button
                onClick={() => onSelectConversation(conversation.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition border-b"
                style={{
                  borderColor: "#F0F4FA",
                  background: isSelected ? "#EEF3FF" : "transparent",
                }}
                onMouseOver={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#F6F8FC";
                }}
                onMouseOut={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar
                    user={otherUser}
                    alt={getDisplayName(otherUser)}
                    className="flex-shrink-0"
                    style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", overflow: "hidden", border: isSelected ? "2px solid #1FB8FF" : "1px solid #E6ECF5" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate" style={{ color: "#0B1B3D" }}>
                      {getDisplayName(otherUser)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {lastAt && (
                        <div className="text-[10px]" style={{ color: "#8A97B5" }}>
                          {formatDistanceToNow(new Date(lastAt.endsWith?.("Z") ? lastAt : lastAt + "Z"), { addSuffix: false })}
                        </div>
                      )}
                    </div>
                  </div>
                  <ConversationPreviewMessage defaultMessage={conversation.last_message} isSelected={isSelected} />
                </div>
              </button>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === conversation.id ? null : conversation.id);
                  }}
                  className="p-1.5 rounded-lg transition"
                  style={{ color: "#8A97B5", background: "rgba(255,255,255,0.8)" }}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {activeMenuId === conversation.id && (
                  <div
                    className="absolute right-0 mt-1 rounded-lg z-50 min-w-32 overflow-hidden"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E6ECF5",
                      boxShadow: "0 8px 24px rgba(11, 63, 217, 0.12)",
                    }}
                  >
                    <button
                      onClick={(e) => handleArchive(conversation.id, e)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition"
                      style={{ color: "#4A5878" }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#F6F8FC";
                        e.currentTarget.style.color = "#0B3FD9";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#4A5878";
                      }}
                    >
                      <Archive className="w-4 h-4" /> Archive
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showNewChat && (
        <div className="absolute inset-0 z-40 flex flex-col" style={{ background: "#FFFFFF" }}>
          <div className="px-4 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E6ECF5" }}>
            <div>
              <h3 className="text-base font-bold" style={{ color: "#0B1B3D" }}>New Chat</h3>
              <p className="text-xs" style={{ color: "#6B7FA0" }}>Search by name or email</p>
            </div>
            <button
              onClick={() => setShowNewChat(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition"
              style={{ background: "#F6F8FC", color: "#4A5878" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#E6ECF5" }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8A97B5" }} />
              <input
                autoFocus
                type="text"
                placeholder="Search people..."
                value={newChatQuery}
                onChange={(e) => setNewChatQuery(e.target.value)}
                className="w-full rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none"
                style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!newChatQuery && newChatResults.length > 0 && (
              <div className="text-[10px] font-bold uppercase tracking-wider px-4 pt-3 pb-1" style={{ color: "#0B3FD9" }}>
                People you follow
              </div>
            )}
            {newChatResults.length === 0 && (
              <div className="text-center py-10 px-4 text-sm" style={{ color: "#8A97B5" }}>
                {newChatQuery ? "No users found." : "Follow people to start chats, or search by name."}
              </div>
            )}
            {newChatResults.map((person) => (
              <button
                key={person.email}
                onClick={() => {
                  onStartConversation(person.email);
                  setShowNewChat(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition border-b"
                style={{ borderColor: "#F0F4FA" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#F6F8FC")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <UserAvatar
                  user={person}
                  alt={getDisplayName(person)}
                  className="flex-shrink-0"
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", overflow: "hidden", border: "1px solid #E6ECF5" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate" style={{ color: "#0B1B3D" }}>
                    {getDisplayName(person)}
                  </div>
                  <div className="text-xs truncate" style={{ color: "#8A97B5" }}>
                    {person.location || person.country || "LightMode member"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}