import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function SubmitDropTab({ user }) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ verse: "", reflection: "", hashtags: "", category: "Devotional" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let finalScore = 5; // Base score
    let uploadedMediaUrl = null;

    try {
      if (file) {
        setAnalyzing(true);
        // Convert file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise(r => reader.onload = r);
        const base64File = reader.result;

        // Upload file
        const uploadRes = await base44.integrations.Core.UploadFile({ file: base64File });
        uploadedMediaUrl = uploadRes.file_url;

        // Extract metrics
        const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: uploadedMediaUrl,
          json_schema: {
            type: "object",
            properties: {
              likes: { type: "number", description: "Number of likes shown in the screenshot. Default 0." },
              shares: { type: "number", description: "Number of shares/retweets shown. Default 0." },
              saves: { type: "number", description: "Number of saves/bookmarks shown. Default 0." },
              views: { type: "number", description: "Number of views/impressions shown. Default 0." }
            }
          }
        });

        if (extractRes.status === "success" && extractRes.output) {
          const { likes = 0, shares = 0, saves = 0, views = 0 } = extractRes.output;
          // Calculate additional score
          const engagementPoints = (likes * 1) + (shares * 2) + (saves * 2) + Math.floor(views / 10);
          finalScore += Math.min(engagementPoints, 100); // Cap extra points at 100
        }
        setAnalyzing(false);
      }

      await base44.entities.GlowDrop.create({
        user_email: user.email,
        media_url: uploadedMediaUrl,
        ...formData
      });
      await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + finalScore });
      toast.success(`Glow Drop submitted! +${finalScore} Points earned!`);
      setFormData({ verse: "", reflection: "", hashtags: "", category: "Devotional" });
      setFile(null);
      queryClient.invalidateQueries(["myGlowDrops"]);
    } catch (err) {
      toast.error("Failed to submit Glow Drop");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00CFFF]/30 to-[#8A5CFF]/30 rounded-[1.5rem] blur-xl opacity-50"></div>
      
      <div className="relative bg-[#121826]/90 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00CFFF]/20 to-[#8A5CFF]/20 flex items-center justify-center border border-[#00CFFF]/30">
            <span className="text-2xl">✨</span>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Share Your Light</h2>
            <p className="text-sm text-[#00CFFF] font-medium font-['Inter'] mt-1">Submit a Glow Drop to inspire others</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-300 font-semibold uppercase tracking-wider text-xs ml-1">Bible Verse</Label>
            <Input 
              required 
              placeholder="e.g. Matthew 5:14" 
              value={formData.verse} 
              onChange={e => setFormData({...formData, verse: e.target.value})} 
              className="bg-[#0B0F1A] border-white/10 text-white text-base py-6 px-4 rounded-xl focus-visible:ring-[#00CFFF]/50 focus-visible:border-[#00CFFF] transition-all" 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300 font-semibold uppercase tracking-wider text-xs ml-1">Reflection / Testimony</Label>
            <Textarea 
              required 
              placeholder="What does this verse mean to you? Share your testimony..." 
              value={formData.reflection} 
              onChange={e => setFormData({...formData, reflection: e.target.value})} 
              className="bg-[#0B0F1A] border-white/10 text-white text-base p-4 rounded-xl focus-visible:ring-[#8A5CFF]/50 focus-visible:border-[#8A5CFF] min-h-[160px] transition-all resize-y" 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300 font-semibold uppercase tracking-wider text-xs ml-1">Hashtags</Label>
            <Input 
              placeholder="#FaithAlwaysOn #GlowDrop" 
              value={formData.hashtags} 
              onChange={e => setFormData({...formData, hashtags: e.target.value})} 
              className="bg-[#0B0F1A] border-white/10 text-[#FFD000] text-base py-6 px-4 rounded-xl focus-visible:ring-[#FFD000]/50 focus-visible:border-[#FFD000] transition-all" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 font-semibold uppercase tracking-wider text-xs ml-1">Engagement Screenshot (Optional)</Label>
            <p className="text-xs text-gray-400 ml-1 mb-2">Upload a screenshot showing likes, shares, or saves to earn extra impact points!</p>
            <Input 
              type="file" 
              accept="image/*"
              onChange={e => setFile(e.target.files[0])} 
              className="bg-[#0B0F1A] border-dashed border-2 border-white/10 text-gray-400 text-sm h-auto px-3 py-3 rounded-xl focus-visible:ring-[#00CFFF]/50 focus-visible:border-[#00CFFF] transition-all file:bg-[#121826] file:text-[#00CFFF] file:border file:border-[#00CFFF]/30 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:font-bold hover:file:bg-[#00CFFF]/10 file:cursor-pointer cursor-pointer hover:border-[#00CFFF]/30" 
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-14 mt-4 bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] hover:opacity-90 text-[#0B0F1A] text-lg font-bold font-['Space_Grotesk'] rounded-xl border-none shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(138,92,255,0.6)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> 
                {analyzing ? "Analyzing Screenshot..." : "Posting..."}
              </>
            ) : (
              <><span className="mr-2">⚡</span> Post Glow Drop</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}