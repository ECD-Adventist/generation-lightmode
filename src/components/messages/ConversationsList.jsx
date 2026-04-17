import React, { useState } from "react";
import { Search, Archive, MoreVertical } from "lucide-react";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function ConversationsList({ conversations, selectedConversationId, currentUserEmail, allUsers, followingUsers, onSelectConversation, onStartConversation, onArchiveConversation = () => {} }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [archivedConversationIds, setArchivedConversationIds] = useState(new Set());
  const [activeMenuId, setActiveMenuId] = useState(null);

  const getUser = (email) => allUsers.find((user) => user.email === email) || { full_name: email?.split("@")[0] || "User", email };

  const existingEmails = new Set(
    conversations.map((conversation) => conversation.participant_a_email === currentUserEmail ? conversation.participant_b_email : conversation.participant_a_email)
  );
  const newChatOptions = followingUsers.filter((email) => !existingEmails.has(email));

  const filteredConversations = conversations.filter((conversation) => {
    const otherEmail = conversation.participant_a_email === currentUserEmail ? conversation.participant_b_email : conversation.participant_a_email;
    const otherUser = getUser(otherEmail);
    const matchesSearch = otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (conversation.last_message || "").toLowerCase().includes(searchQuery.toLowerCase());
    const isArchived = archivedConversationIds.has(conversation.id);
    return matchesSearch && (showArchived ? isArchived : !isArchived);
  });

  const handleArchive = (conversationId, e) => {
    e.stopPropagation();
    const newSet = new Set(archivedConversationIds);
    newSet.add(conversationId);
    setArchivedConversationIds(newSet);
    setActiveMenuId(null);
    onArchiveConversation(conversationId);
  };

  return (
    <div className="rounded-[1.75rem] overflow-hidden flex flex-col h-[72vh] font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
      <div className="px-4 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
        <h2 className="text-lg font-bold" style={{ color: "#0B1B3D" }}>Messages</h2>
        <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Chat with people you follow.</p>

        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "#8A97B5" }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none"
            style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
          />
        </div>

        {archivedConversationIds.size > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="mt-3 text-xs font-bold px-3 py-1.5 rounded-full transition"
            style={showArchived
              ? { background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF", color: "#0B3FD9" }
              : { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}
          >
            {showArchived ? "Show Active" : `Archived (${archivedConversationIds.size})`}
          </button>
        )}
      </div>

      <div className="max-h-[72vh] overflow-y-auto flex-1">
        {filteredConversations.length === 0 && (
          <div className="text-center py-8" style={{ color: "#8A97B5" }}>
            <p className="text-sm">{showArchived ? "No archived conversations" : "No conversations found"}</p>
          </div>
        )}
        {filteredConversations.map((conversation) => {
          const otherEmail = conversation.participant_a_email === currentUserEmail ? conversation.participant_b_email : conversation.participant_a_email;
          const otherUser = getUser(otherEmail);
          const isOnline = Math.random() > 0.5;

          return (
            <div key={conversation.id} className="relative group">
              <button
                onClick={() => onSelectConversation(conversation.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition border-b"
                style={{ borderColor: "#F0F4FA", background: selectedConversationId === conversation.id ? "#EEF3FF" : "transparent" }}
                onMouseOver={e => { if (selectedConversationId !== conversation.id) e.currentTarget.style.background = "#F6F8FC"; }}
                onMouseOut={e => { if (selectedConversationId !== conversation.id) e.currentTarget.style.background = "transparent"; }}
              >
                <div className="relative w-11 h-11 flex-shrink-0">
                  <img src={otherUser.profile_picture_url || defaultAvatar} alt={otherUser.full_name} className="w-11 h-11 rounded-full object-cover" style={{ border: "1px solid #E6ECF5" }} />
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full" style={{ border: "2px solid #FFFFFF", background: isOnline ? "#22C55E" : "#8A97B5", boxShadow: isOnline ? "0 0 4px rgba(34,197,94,0.5)" : "none" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate" style={{ color: "#0B1B3D" }}>{otherUser.full_name}</div>
                  <div className="text-sm truncate" style={{ color: "#6B7FA0" }}>{conversation.last_message || "Start chatting"}</div>
                </div>
              </button>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => setActiveMenuId(activeMenuId === conversation.id ? null : conversation.id)}
                  className="p-1.5 rounded-lg transition"
                  style={{ color: "#8A97B5" }}
                  onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8A97B5"; }}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {activeMenuId === conversation.id && (
                  <div className="absolute right-0 mt-1 rounded-lg z-50 min-w-32" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.12)" }}>
                    <button
                      onClick={(e) => handleArchive(conversation.id, e)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm rounded-lg transition"
                      style={{ color: "#4A5878" }}
                      onMouseOver={e => { e.currentTarget.style.background = "#F6F8FC"; e.currentTarget.style.color = "#0B3FD9"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}
                    >
                      <Archive className="w-4 h-4" /> Archive
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!showArchived && newChatOptions.length > 0 && (
          <div className="px-4 py-4 border-t" style={{ borderColor: "#E6ECF5" }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#0B3FD9" }}>Start a new chat</div>
            <div className="space-y-2">
              {newChatOptions.map((email) => {
                const person = getUser(email);
                const isOnline = Math.random() > 0.5;
                return (
                  <button
                    key={email}
                    onClick={() => onStartConversation(email)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl transition text-left"
                    onMouseOver={e => { e.currentTarget.style.background = "#F6F8FC"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <img src={person.profile_picture_url || defaultAvatar} alt={person.full_name} className="w-10 h-10 rounded-full object-cover" style={{ border: "1px solid #E6ECF5" }} />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full" style={{ border: "2px solid #FFFFFF", background: isOnline ? "#22C55E" : "#8A97B5" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate" style={{ color: "#0B1B3D" }}>{person.full_name}</div>
                      <div className="text-xs truncate" style={{ color: "#8A97B5" }}>{person.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}