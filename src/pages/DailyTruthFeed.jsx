import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, BookOpen, Hash, Share2, MoreVertical, Heart, MessageCircle, Bookmark, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import TruthCardComments from "@/components/daily-drops/TruthCardComments";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileDailyTruthFeed from "@/components/daily-drops/MobileDailyTruthFeed";
import LightModePostArtwork from "@/components/feed/LightModePostArtwork";

export default function DailyDropsPage() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get("tab") || "codes_of_truth";
  const [activeTab, setActiveTab] = useState(["codes_of_truth", "keeping_it_100", "daily_verse"].includes(initialTab) ? initialTab : "codes_of_truth");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
    });
  }, []);

  // Fetch ONLY system-published daily drops
  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["dailySystemDrops"],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: "system@lightmode.com", status: "approved" }, '-created_date', 100),
  });

  // Filter by category (reliable) — hashtags may be null on older drops
  const codeTruthDrops = useMemo(() => drops.filter(d => d.category === "Code of Truth"), [drops]);
  const keepIt100Drops = useMemo(() => drops.filter(d => d.category === "Keep It 100"), [drops]);
  const dailyVerseDrops = useMemo(() => drops.filter(d => d.category === "Daily Verse"), [drops]);

  const activeDrops = activeTab === "codes_of_truth" ? codeTruthDrops : activeTab === "keeping_it_100" ? keepIt100Drops : dailyVerseDrops;

  const handleShare = async (drop) => {
    const catLabel = activeTab === "codes_of_truth" ? "Code of Truth" : activeTab === "keeping_it_100" ? "Keep It 100" : "Daily Verse";
    const text = `✨ ${catLabel}\n\n"${drop.reflection || drop.verse || ''}"\n\n${drop.verse && drop.reflection ? drop.verse : ''}\n\nJoin Generation LightMode: ${window.location.origin}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "Generation LightMode", text });
      } catch (err) {
        if (err.name !== 'AbortError') console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  if (isMobile) {
    return (
      <MobileDailyTruthFeed
        activeTab={activeTab} setActiveTab={setActiveTab}
        activeDrops={activeDrops} isLoading={isLoading}
        TruthCard={TruthCard} handleShare={handleShare} user={user}
      />
    );
  }

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to={createPageUrl("Feed")} className="w-10 h-10 rounded-full flex items-center justify-center transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Daily Drops</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("codes_of_truth")}
            className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
            style={activeTab === "codes_of_truth"
              ? { background: "rgba(11, 63, 217, 0.08)", color: "#0B3FD9", border: "1px solid #B8E5FF" }
              : { background: "#FFFFFF", color: "#6B7FA0", border: "1px solid #E6ECF5" }}
          >
            🔐 Codes of Truth
          </button>
          <button
            onClick={() => setActiveTab("keeping_it_100")}
            className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
            style={activeTab === "keeping_it_100"
              ? { background: "rgba(255, 208, 0, 0.1)", color: "#CC7A00", border: "1px solid #FFE4A0" }
              : { background: "#FFFFFF", color: "#6B7FA0", border: "1px solid #E6ECF5" }}
          >
            💯 Keep It 100
          </button>
          <button
            onClick={() => setActiveTab("daily_verse")}
            className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
            style={activeTab === "daily_verse"
              ? { background: "rgba(138, 92, 255, 0.1)", color: "#8A5CFF", border: "1px solid rgba(138, 92, 255, 0.3)" }
              : { background: "#FFFFFF", color: "#6B7FA0", border: "1px solid #E6ECF5" }}
          >
            📖 Daily Verse
          </button>
        </div>

        {/* Today's Pick */}
        {activeDrops.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: activeTab === "codes_of_truth" ? "#0B3FD9" : "#CC7A00" }}></div>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#8A97B5" }}>Today's Pick</span>
            </div>
            <TruthCard drop={activeDrops[0]} onShare={handleShare} user={user} featured />
          </div>
        )}

        {/* Past Drops */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
          </div>
        ) : activeDrops.length > 1 ? (
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "#8A97B5" }}>Previous Posts</h3>
            <div className="space-y-4 pb-24">
              {activeDrops.slice(1).map(drop => (
                <TruthCard key={drop.id} drop={drop} onShare={handleShare} user={user} />
              ))}
            </div>
          </div>
        ) : activeDrops.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#8A97B5" }}>
            <div className="text-4xl mb-4">{activeTab === "codes_of_truth" ? "🔐" : activeTab === "keeping_it_100" ? "💯" : "📖"}</div>
            <p>No daily posts yet. Check back soon!</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TruthCard({ drop, onShare, user, featured }) {
  const postedDate = drop.created_date ? new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z') : null;
  const queryClient = useQueryClient();
  
  const isSystemPost = drop.user_email === "system@lightmode.com";

  const { data: creatorUser } = useQuery({
    queryKey: ["userProfile", drop.user_email],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data?.find(u => u.email === drop.user_email);
    },
    enabled: Boolean(drop.user_email && !isSystemPost)
  });
  
  const repostMutation = useMutation({
    mutationFn: async () => {
      if (!user) { toast.error("Please log in to repost"); return; }
      await base44.entities.GlowDrop.create({
        user_email: user.email,
        verse: drop.verse,
        reflection: drop.reflection || "",
        category: drop.category,
        hashtags: drop.hashtags || "",
        status: "approved"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      toast.success("Posted to your profile! ⚡");
    }
  });

  return (
    <div className="rounded-3xl overflow-hidden transition-all" style={featured
      ? { background: "#FFFFFF", border: "1px solid #B8E5FF", boxShadow: "0 4px 16px rgba(31, 184, 255, 0.1)" }
      : { background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }
    }>
      <div className="p-3 bg-[#02071f]">
        {drop.media_url ? (
          <img src={drop.media_url} alt="" className="w-full max-h-80 object-contain bg-black rounded-2xl" />
        ) : (
          <LightModePostArtwork verse={drop.verse} reflection={drop.reflection} category={drop.category} />
        )}
      </div>
      <div className="p-5">
         {isSystemPost ? (
           <Link to={createPageUrl("GenerationLightMode")} className="flex items-center gap-2 mb-4 pb-4 border-b hover:opacity-80 transition" style={{ borderColor: "#E6ECF5" }}>
             <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden" style={{ border: "1px solid #FFE4A0", background: "#FFFFFF" }}>
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate" style={{ color: "#CC7A00" }}>Generation LightMode</div>
              <div className="text-[10px]" style={{ color: "#8A97B5" }}>Official Daily Drop</div>
            </div>
           </Link>
         ) : creatorUser && (
           <Link to={`${createPageUrl("Profile")}?user=${encodeURIComponent(drop.user_email)}`} className="flex items-center gap-2 mb-4 pb-4 border-b hover:opacity-80 transition" style={{ borderColor: "#E6ECF5" }}>
              <div className="w-8 h-8 rounded-full p-[2px] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
                <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden text-xs font-bold" style={{ background: "#FFFFFF" }}>
                 <img src={creatorUser.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
               </div>
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-sm font-bold truncate" style={{ color: "#0B1B3D" }}>{creatorUser.full_name}</div>
               <div className="text-[10px]" style={{ color: "#8A97B5" }}>View profile</div>
             </div>
           </Link>
         )}
         {drop.verse && (
           <div className="flex items-center gap-2 mb-2">
             <BookOpen className="w-4 h-4 shrink-0" style={{ color: "#0B3FD9" }} />
             <span className="text-sm font-bold" style={{ color: "#0B3FD9" }}>{drop.verse}</span>
           </div>
         )}
         {drop.reflection && (
           <p className="text-base leading-relaxed font-['Inter'] whitespace-pre-line" style={{ color: "#0B1B3D" }}>{drop.reflection}</p>
         )}
         <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "#E6ECF5" }}>
          <span className="text-[10px]" style={{ color: "#8A97B5" }}>
            {postedDate ? format(postedDate, "MMM d, yyyy 'at' h:mm a") : ""}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs font-bold transition px-3 py-1.5 rounded-lg" style={{ color: "#0B3FD9", background: "#EEF3FF" }}>
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
              <DropdownMenuItem 
                onClick={() => repostMutation.mutate()}
                disabled={repostMutation.isPending}
                className="cursor-pointer flex items-center gap-2"
              >
                <span className="text-base">⚡</span> Post to LightMode
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onShare(drop)}
                className="cursor-pointer flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share on Social Media
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {drop.hashtags && (
          <div className="mt-2 text-xs font-medium" style={{ color: "#0B3FD9" }}>{drop.hashtags}</div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center gap-5 mt-3 pt-3 border-t text-xs" style={{ borderColor: "#E6ECF5", color: "#6B7FA0" }}>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" fill="currentColor" />
            <span className="font-semibold">{drop.likes_count || 0}</span>
            <span>Lights</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Comments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            <span className="font-semibold">{drop.shares_count || 0}</span>
            <span>Shares</span>
          </div>
        </div>

        <TruthCardComments dropId={drop.id} user={user} />
      </div>
    </div>
  );
}