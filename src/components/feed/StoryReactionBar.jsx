import React, { useState, useEffect } from "react";
import { Heart, Send, Eye } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { dualWriteSupabase } from "@/lib/dualWriteSupabase";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import StoryViewersModal from "./StoryViewersModal";

const EMOJI_REACTIONS = [
  { type: "fire", emoji: "🔥" },
  { type: "pray", emoji: "🙏" },
  { type: "sparkle", emoji: "✨" },
  { type: "heart_eyes", emoji: "😍" },
  { type: "clap", emoji: "👏" },
];

export default function StoryReactionBar({ story, currentUser, storyAuthor, onPause, onResume }) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [flyEmoji, setFlyEmoji] = useState(null);
  const [showViewers, setShowViewers] = useState(false);
  const queryClient = useQueryClient();

  const isOwnStory = currentUser?.email === story?.user_email;

  // Live reactions and views for this story
  const { data: reactions = [] } = useQuery({
    queryKey: ["storyReactions", story?.id],
    queryFn: () => base44.entities.StoryReaction.filter({ story_id: story.id }),
    enabled: !!story?.id,
  });

  const { data: views = [] } = useQuery({
    queryKey: ["storyViews", story?.id],
    queryFn: () => base44.entities.StoryView.filter({ story_id: story.id }),
    enabled: !!story?.id && isOwnStory,
  });

  const myReaction = reactions.find(r => r.user_email === currentUser?.email);
  const liked = !!myReaction;
  const uniqueViewers = new Set(views.map(v => v.viewer_email)).size;

  const handleLike = async () => {
    if (!currentUser) return;
    if (liked) {
      // Unlike
      setFlyEmoji(null);
      try {
        await base44.entities.StoryReaction.delete(myReaction.id);
        queryClient.invalidateQueries({ queryKey: ["storyReactions", story.id] });
      } catch (e) { toast.error("Could not unlike"); }
      return;
    }

    setFlyEmoji("❤️");
    setTimeout(() => setFlyEmoji(null), 1200);

    try {
      await base44.entities.StoryReaction.create({
        story_id: story.id,
        user_email: currentUser.email,
        reaction_type: "like",
      });
      queryClient.invalidateQueries({ queryKey: ["storyReactions", story.id] });

      if (!isOwnStory) {
        base44.entities.Notification.create({
          user_email: story.user_email,
          type: "like",
          message: `${currentUser.full_name || "Someone"} liked your story`,
          link: createPageUrl("Profile") + `?user=${encodeURIComponent(currentUser.email)}`,
        }).catch(() => {});
      }
      toast.success("Liked! ❤️");
    } catch (e) {
      toast.error("Could not like story");
    }
  };

  const handleEmojiReaction = async (reaction) => {
    if (!currentUser) return;
    setFlyEmoji(reaction.emoji);
    setShowEmojis(false);
    setTimeout(() => setFlyEmoji(null), 1200);

    try {
      // Remove existing reaction first to keep one per user
      if (myReaction) await base44.entities.StoryReaction.delete(myReaction.id);
      await base44.entities.StoryReaction.create({
        story_id: story.id,
        user_email: currentUser.email,
        reaction_type: reaction.type,
      });
      queryClient.invalidateQueries({ queryKey: ["storyReactions", story.id] });

      if (!isOwnStory) {
        base44.entities.Notification.create({
          user_email: story.user_email,
          type: "like",
          message: `${currentUser.full_name || "Someone"} reacted ${reaction.emoji} to your story`,
          link: createPageUrl("Profile") + `?user=${encodeURIComponent(currentUser.email)}`,
        }).catch(() => {});
      }
    } catch (e) {
      toast.error("Could not react");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || sending) return;
    setSending(true);

    // Find or create a DM conversation
    const convos = await base44.entities.DirectConversation.filter({
      participant_a_email: currentUser.email,
      participant_b_email: story.user_email,
    });
    const convos2 = await base44.entities.DirectConversation.filter({
      participant_a_email: story.user_email,
      participant_b_email: currentUser.email,
    });
    
    let conversation = convos[0] || convos2[0];
    if (!conversation) {
      conversation = await base44.entities.DirectConversation.create({
        participant_a_email: currentUser.email,
        participant_b_email: story.user_email,
        last_message: replyText.trim(),
        last_message_at: new Date().toISOString(),
      });
    }

    const replyContent = `📸 Reply to story: ${replyText.trim()}`;
    const dmRec = await base44.entities.DirectMessage.create({
      conversation_id: conversation.id,
      sender_email: currentUser.email,
      recipient_email: story.user_email,
      content: replyContent,
    });
    dualWriteSupabase("direct_messages", dmRec);

    await base44.entities.DirectConversation.update(conversation.id, {
      last_message: replyContent,
      last_message_at: new Date().toISOString(),
    });

    if (!isOwnStory) {
      const notifRec = await base44.entities.Notification.create({
        user_email: story.user_email,
        type: "message",
        message: `${currentUser.full_name || "Someone"} replied to your story`,
        link: createPageUrl("Messages") + `?user=${encodeURIComponent(currentUser.email)}`,
      });
      dualWriteSupabase("notifications", notifRec);
    }

    setReplyText("");
    setSending(false);
    toast.success("Reply sent! 💬");
  };

  return (
    <>
      {/* Flying emoji animation */}
      {flyEmoji && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <span className="text-6xl drop-shadow-lg" style={{ animation: "flyUp 1.2s ease-out forwards" }}>{flyEmoji}</span>
        </div>
      )}

      {/* Emoji reaction picker */}
      {showEmojis && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2">
          {EMOJI_REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => handleEmojiReaction(r)}
              className="text-2xl hover:scale-125 transition-transform active:scale-95"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 inset-x-0 z-30 px-3 pb-4 pt-2">
        <style>{`
          @keyframes flyUp {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-120px) scale(1.5); }
          }
        `}</style>

        {!isOwnStory ? (
          <form onSubmit={handleReply} className="flex items-center gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${storyAuthor?.full_name?.split(" ")[0] || "this story"}...`}
              className="flex-1 h-10 rounded-full px-4 text-sm text-white placeholder:text-white/50 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
              onFocus={() => onPause?.()}
              onBlur={() => { if (!replyText) onResume?.(); }}
            />
            {replyText.trim() ? (
              <button
                type="submit"
                disabled={sending}
                className="w-10 h-10 rounded-full flex items-center justify-center transition"
                style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLike}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition hover:scale-110 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <Heart className={`w-5 h-5 transition ${liked ? "text-red-500 fill-red-500" : "text-white"}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojis(!showEmojis)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  🔥
                </button>
              </>
            )}
          </form>
        ) : (
          <>
            <button
              onClick={() => setShowViewers(true)}
              className="flex items-center justify-center gap-3 text-white/80 text-xs font-medium w-full hover:text-white transition"
            >
              <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {uniqueViewers} view{uniqueViewers !== 1 ? "s" : ""}</span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" fill="currentColor" /> {reactions.length} reaction{reactions.length !== 1 ? "s" : ""}</span>
            </button>
            <StoryViewersModal
              storyId={story?.id}
              isOpen={showViewers}
              onClose={() => setShowViewers(false)}
              allUsers={[]}
            />
          </>
        )}
      </div>
    </>
  );
}