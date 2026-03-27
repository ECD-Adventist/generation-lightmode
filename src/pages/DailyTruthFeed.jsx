import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, BookOpen, Hash, Share2, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function DailyDrops() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get("tab") || "codes_of_truth";
  const [activeTab, setActiveTab] = useState(initialTab);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
    });
  }, []);

  // Fetch all daily system drops (Code of Truth + Keep It 100)
  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["dailySystemDrops"],
    queryFn: () => base44.entities.GlowDrop.list('-created_date', 100),
  });

  // Filter by hashtag since category varies
  const codeTruthDrops = useMemo(() => drops.filter(d => d.hashtags?.includes("#CodesOfTruth")), [drops]);
  const keepIt100Drops = useMemo(() => drops.filter(d => d.hashtags?.includes("#KeepIt100")), [drops]);

  const activeDrops = activeTab === "codes_of_truth" ? codeTruthDrops : keepIt100Drops;

  const handleShare = async (drop) => {
    const text = `✨ ${activeTab === "codes_of_truth" ? "Code of Truth" : "Keep It 100"}\n\n"${drop.reflection || drop.verse || ''}"\n\n${drop.verse && drop.reflection ? drop.verse : ''}\n\nJoin Generation LightMode: ${window.location.origin}`;
    
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

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to={createPageUrl("Feed")} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-lg font-black font-['Space_Grotesk']">Daily Drops</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab("codes_of_truth")}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "codes_of_truth"
                ? "bg-[#8A5CFF]/20 text-[#8A5CFF] border border-[#8A5CFF]/40"
                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            🔐 Codes of Truth
          </button>
          <button
            onClick={() => setActiveTab("keeping_it_100")}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "keeping_it_100"
                ? "bg-[#FFD000]/20 text-[#FFD000] border border-[#FFD000]/40"
                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            💯 Keep It 100
          </button>
        </div>

        {/* Today's Pick */}
        {activeDrops.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${activeTab === "codes_of_truth" ? "bg-[#8A5CFF]" : "bg-[#FFD000]"} animate-pulse`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Today's Pick</span>
            </div>
            <TruthCard drop={activeDrops[0]} onShare={handleShare} user={user} featured />
          </div>
        )}

        {/* Past Drops */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
          </div>
        ) : activeDrops.length > 1 ? (
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Previous Posts</h3>
            <div className="space-y-4 pb-24">
              {activeDrops.slice(1).map(drop => (
                <TruthCard key={drop.id} drop={drop} onShare={handleShare} user={user} />
              ))}
            </div>
          </div>
        ) : activeDrops.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-4">{activeTab === "codes_of_truth" ? "🔐" : "💯"}</div>
            <p>No daily posts yet. Check back soon!</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TruthCard({ drop, onShare, user, featured }) {
  const postedDate = drop.created_date ? new Date(drop.created_date + (drop.created_date.endsWith('Z') ? '' : 'Z')) : null;
  const queryClient = useQueryClient();
  
  const { data: creatorUser } = useQuery({
    queryKey: ["userProfile", drop.user_email],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data?.find(u => u.email === drop.user_email);
    },
    enabled: Boolean(drop.user_email && drop.user_email !== "system@lightmode.com")
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
    <div className={`rounded-3xl overflow-hidden border transition-all ${
      featured 
        ? "bg-gradient-to-br from-[#121826] to-[#0B0F1A] border-[#00CFFF]/20 shadow-[0_0_30px_rgba(0,207,255,0.1)]" 
        : "bg-[#121826]/80 border-white/5 hover:border-white/10"
    }`}>
      {drop.media_url && (
        <img src={drop.media_url} alt="" className="w-full max-h-80 object-contain bg-black" />
      )}
      <div className="p-5">
         {creatorUser && drop.user_email !== "system@lightmode.com" && (
           <Link to={`${createPageUrl("Profile")}?user=${encodeURIComponent(drop.user_email)}`} className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5 hover:opacity-80 transition">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px] shrink-0">
               <div className="w-full h-full rounded-full bg-[#0B0F1A] flex items-center justify-center overflow-hidden text-xs font-bold">
                 <img src={creatorUser.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
               </div>
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-sm font-bold text-white truncate">{creatorUser.full_name}</div>
               <div className="text-[10px] text-gray-500">View profile</div>
             </div>
           </Link>
         )}
         {drop.verse && (
           <div className="flex items-center gap-2 mb-2">
             <BookOpen className="w-4 h-4 text-[#00CFFF] shrink-0" />
             <span className="text-sm font-bold text-[#00CFFF]">{drop.verse}</span>
           </div>
         )}
         {drop.reflection && (
           <p className="text-white text-base leading-relaxed font-['Inter'] whitespace-pre-line">{drop.reflection}</p>
         )}
         <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <span className="text-[10px] text-gray-500">
            {postedDate ? format(postedDate, "MMM d, yyyy 'at' h:mm a") : ""}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs font-bold text-[#00CFFF] hover:text-white transition bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#121826] border-white/10 text-white w-48">
              <DropdownMenuItem 
                onClick={() => repostMutation.mutate()}
                disabled={repostMutation.isPending}
                className="hover:bg-white/10 cursor-pointer flex items-center gap-2"
              >
                <span className="text-base">⚡</span> Post to LightMode
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onShare(drop)}
                className="hover:bg-white/10 cursor-pointer flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share on Social Media
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {drop.hashtags && (
          <div className="mt-2 text-xs text-[#8A5CFF] font-medium">{drop.hashtags}</div>
        )}
      </div>
    </div>
  );
}