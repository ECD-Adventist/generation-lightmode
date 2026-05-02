import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Download, Share2, Repeat2, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";

export default function CodeCard({ code, user }) {
  const queryClient = useQueryClient();
  const [isSharing, setIsSharing] = useState(false);
  const isKeepIt100 = code.source_document === "keeping_it_100";

  const { data: engagementList = [] } = useQuery({
    queryKey: ["codeEngagement", code.id],
    queryFn: () => base44.entities.CodeEngagement.filter({ code_id: code.id }),
  });
  
  const engagement = engagementList[0] || { shares_count: 0, downloads_count: 0, reposts_count: 0 };

  const updateEngagement = async (field) => {
    try {
      if (engagement.id) {
        await base44.entities.CodeEngagement.update(engagement.id, {
          [field]: (engagement[field] || 0) + 1
        });
      } else {
        await base44.entities.CodeEngagement.create({
          code_id: code.id,
          shares_count: field === 'shares_count' ? 1 : 0,
          downloads_count: field === 'downloads_count' ? 1 : 0,
          reposts_count: field === 'reposts_count' ? 1 : 0,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["codeEngagement", code.id] });
    } catch (err) {
      console.error("Failed to update engagement", err);
    }
  };

  const handleShare = async () => {
    const text = `✨ ${code.slogan_text}\n\n${code.bible_reference || ''}\n\nJoin the movement at ${window.location.origin}`;
    try {
      if (navigator.share && navigator.canShare?.({ text })) {
        const shareData = { title: 'Code of Truth', text };
        if (code.poster_image_url) {
          const res = await fetch(code.poster_image_url);
          const blob = await res.blob();
          const file = new File([blob], `code-${code.id}.png`, { type: blob.type });
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        }
        await navigator.share(shareData);
        await updateEngagement('shares_count');
        return;
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
    // Fallback: copy to clipboard
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    await updateEngagement('shares_count');
    toast.success("Copied to clipboard!");
  };

  const handleWhatsApp = async () => {
    const title = code.title ? `*${code.title}*\n\n` : "";
    const imageLink = code.poster_image_url ? `\n🖼️ ${code.poster_image_url}` : "";
    const text = encodeURIComponent(`💯 ${title}"${code.slogan_text}"\n\n📖 ${code.bible_reference || ""}\n\n✝️ Generation LightMode — Keeping It 100${imageLink}\n${window.location.origin}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    await updateEngagement('shares_count');
  };

  const handleDownload = async () => {
    if (code.poster_image_url) {
      try {
        const response = await fetch(code.poster_image_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CodeOfTruth-${code.id}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        await updateEngagement('downloads_count');
        toast.success("Downloaded successfully!");
      } catch (err) {
        toast.error("Failed to download image");
      }
    } else {
      toast.error("No poster image available");
    }
  };

  const handleRepost = async () => {
    if (!user) {
      toast.error("Please log in to repost");
      return;
    }
    setIsSharing(true);
    try {
      await base44.entities.GlowDrop.create({
        user_email: user.email,
        verse: code.bible_reference || "Code of Truth",
        reflection: code.slogan_text,
        media_url: code.poster_image_url,
        category: "Code of Truth",
        status: "approved"
      });
      await updateEngagement('reposts_count');
      toast.success("Reposted to your Glow Drops! ⚡");
    } catch (err) {
      toast.error("Failed to repost");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="bg-[#121826] border border-white/10 rounded-2xl overflow-hidden flex flex-col group transition-all hover:border-[#00CFFF]/50 hover:shadow-[0_0_20px_rgba(0,207,255,0.1)]">
      {/* Poster Image / Content */}
      <div className="aspect-square relative bg-gradient-to-br from-[#0B0F1A] to-[#121826] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        {isKeepIt100 ? (
          <KeepIt100Poster text={code.slogan_text} verse={code.bible_reference} className="absolute inset-0 w-full h-full" />
        ) : code.poster_image_url ? (
          <img src={code.poster_image_url} alt={code.title || "Poster"} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00CFFF]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8A5CFF]/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <span className="text-[10px] font-bold text-[#FFD000] uppercase tracking-widest mb-4 z-10 border border-[#FFD000]/30 px-3 py-1 rounded-full bg-[#FFD000]/10">
              {code.category || "Truth"}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-white mb-6 z-10 leading-tight drop-shadow-md">
              "{code.slogan_text}"
            </h3>
            {code.bible_reference && (
              <p className="text-sm font-bold text-[#00CFFF] z-10">{code.bible_reference}</p>
            )}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10 opacity-50">
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/7e2f8baa1_FAVICON.png" alt="GLM" className="w-6 h-6 grayscale brightness-200" />
            </div>
          </>
        )}
      </div>

      {/* Actions & Metrics */}
      <div className="p-4 bg-[#0B0F1A] border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-4 px-2">
          <span className="flex items-center gap-1.5"><Share2 size={14} className="text-[#00CFFF]" /> {engagement.shares_count || 0}</span>
          <span className="flex items-center gap-1.5"><Download size={14} className="text-[#FFD000]" /> {engagement.downloads_count || 0}</span>
          <span className="flex items-center gap-1.5"><Repeat2 size={14} className="text-[#8A5CFF]" /> {engagement.reposts_count || 0}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition"
          >
            <Share2 size={16} /> Share
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition"
          >
            <Download size={16} /> Save
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-bold transition"
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button 
            onClick={handleRepost}
            disabled={isSharing}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00CFFF]/10 hover:bg-[#00CFFF]/20 border border-[#00CFFF]/30 text-[#00CFFF] text-xs font-bold transition disabled:opacity-50"
          >
            {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Repeat2 size={16} />}
            Repost
          </button>
        </div>
      </div>
    </div>
  );
}