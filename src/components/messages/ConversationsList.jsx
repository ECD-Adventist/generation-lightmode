import React from "react";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function ConversationsList({ conversations, selectedConversationId, currentUserEmail, allUsers, followingUsers, onSelectConversation, onStartConversation }) {
  const getUser = (email) => allUsers.find((user) => user.email === email) || { full_name: email?.split("@")[0] || "User", email };
  const existingEmails = new Set(
    conversations.map((conversation) => conversation.participant_a_email === currentUserEmail ? conversation.participant_b_email : conversation.participant_a_email)
  );
  const newChatOptions = followingUsers.filter((email) => !existingEmails.has(email));

  return (
    <div className="bg-[#121826] border border-white/10 rounded-3xl overflow-hidden">
      <div className="px-4 py-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white">Messages</h2>
        <p className="text-sm text-gray-400 mt-1">Chat with people you follow.</p>
      </div>

      <div className="max-h-[72vh] overflow-y-auto">
        {conversations.map((conversation) => {
          const otherEmail = conversation.participant_a_email === currentUserEmail ? conversation.participant_b_email : conversation.participant_a_email;
          const otherUser = getUser(otherEmail);

          return (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition border-b border-white/5 ${selectedConversationId === conversation.id ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <img src={otherUser.profile_picture_url || defaultAvatar} alt={otherUser.full_name} className="w-11 h-11 rounded-full object-cover border border-white/10" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white truncate">{otherUser.full_name}</div>
                <div className="text-sm text-gray-400 truncate">{conversation.last_message || "Start chatting"}</div>
              </div>
            </button>
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