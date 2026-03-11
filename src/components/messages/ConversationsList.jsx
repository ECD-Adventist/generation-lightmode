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
    <div className="bg-[#121826] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[72vh]">
      <div className="px-4 py-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white">Messages</h2>
        <p className="text-sm text-gray-400 mt-1">Chat with people you follow.</p>
        
        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00CFFF]/50 placeholder-gray-500"
          />
        </div>

        {/* Archived Tab */}
        {archivedConversationIds.size > 0 && (
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`mt-3 text-xs font-bold px-3 py-1.5 rounded-full transition border ${
              showArchived 
                ? "bg-[#00CFFF]/10 border-[#00CFFF]/30 text-[#00CFFF]" 
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {showArchived ? "Show Active" : `Archived (${archivedConversationIds.size})`}
          </button>
        )}
      </div>

      <div className="max-h-[72vh] overflow-y-auto flex-1">
        {filteredConversations.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">{showArchived ? "No archived conversations" : "No conversations found"}</p>
          </div>
        )}
        {filteredConversations.map((conversation) => {
          const otherEmail = conversation.participant_a_email === currentUserEmail ? conversation.participant_b_email : conversation.participant_a_email;
          const otherUser = getUser(otherEmail);
          const isOnline = Math.random() > 0.5; // Mock online status

          return (
            <div key={conversation.id} className="relative group">
              <button
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition border-b border-white/5 ${selectedConversationId === conversation.id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                {/* Avatar with Online Status */}
                <div className="relative w-11 h-11 flex-shrink-0">
                  <img src={otherUser.profile_picture_url || defaultAvatar} alt={otherUser.full_name} className="w-11 h-11 rounded-full object-cover border border-white/10" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121826] ${isOnline ? "bg-green-400 shadow-[0_0_5px_#4ade80]" : "bg-gray-500"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white truncate">{otherUser.full_name}</div>
                  <div className="text-sm text-gray-400 truncate">{conversation.last_message || "Start chatting"}</div>
                </div>
              </button>
              
              {/* Archive Menu */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                <button 
                  onClick={() => setActiveMenuId(activeMenuId === conversation.id ? null : conversation.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {activeMenuId === conversation.id && (
                  <div className="absolute right-0 mt-1 bg-[#0B0F1A] border border-white/10 rounded-lg shadow-lg z-50 min-w-32">
                    <button 
                      onClick={(e) => handleArchive(conversation.id, e)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
                    >
                      <Archive className="w-4 h-4" /> Archive
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {newChatOptions.length > 0 && (
          <div className="px-4 py-4 border-t border-white/10">
            <div className="text-xs font-bold uppercase tracking-wider text-[#00CFFF] mb-3">Start a new chat</div>
            <div className="space-y-2">
              {newChatOptions.map((email) => {
                const person = getUser(email);
                return (
                  <button
                    key={email}
                    onClick={() => onStartConversation(email)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/5 transition text-left"
                  >
                    <img src={person.profile_picture_url || defaultAvatar} alt={person.full_name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white truncate">{person.full_name}</div>
                      <div className="text-xs text-gray-500 truncate">{person.email}</div>
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