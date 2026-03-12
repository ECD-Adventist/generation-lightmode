import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Hash, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DailyCodeWidget() {
  const { data: dailyCodes = [], isLoading: loadingDaily } = useQuery({
    queryKey: ["dailyCodesLatest"],
    queryFn: () => base44.entities.DailyCode.list('-date_published', 1),
  });

  const codeId = dailyCodes[0]?.code_id;

  const { data: codes = [], isLoading: loadingCode } = useQuery({
    queryKey: ["codeOfTruth", codeId],
    queryFn: () => base44.entities.CodeOfTruth.filter({ id: codeId }),
    enabled: !!codeId
  });

  const dailyCode = codes[0];

  const handleShare = async () => {
    if (!dailyCode) return;
    const text = `✨ ${dailyCode.slogan_text}\n\n${dailyCode.bible_reference || ''}\n\nJoin the movement at ${window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Code of Truth', text });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  if (loadingDaily || loadingCode) return null;
  if (!dailyCode) return null;

  return (
    <div className="mt-8 bg-gradient-to-br from-[#121826] to-[#0B0F1A] rounded-[24px] p-5 border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#00CFFF]/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex items-center gap-2 mb-3 relative z-10">
        <Hash className="w-4 h-4 text-[#FFD000]" />
        <h3 className="font-black text-xs text-[#FFD000] tracking-widest uppercase">Daily Code</h3>
      </div>
      
      <div className="relative z-10">
        <p className="font-bold text-sm text-white leading-snug mb-2 font-['Space_Grotesk']">
          "{dailyCode.slogan_text}"
        </p>
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 text-xs font-bold text-[#00CFFF] hover:text-white transition mt-3 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg w-full justify-center"
        >
          <Share2 size={14} /> Share Code
        </button>
      </div>
    </div>
  );
}