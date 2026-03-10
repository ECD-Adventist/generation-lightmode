import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function SubmitDropModal({ isOpen, onClose, user }) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ verse: "", reflection: "", hashtags: "", category: "Devotional" });
  const [mood, setMood] = useState("");

  const handleAIAssist = async () => {
    if (!mood) {
      toast.error("Please enter how you're feeling first");
      return;
    }
    setAiLoading(true);
    try {
      const prompt = `The user is feeling: ${mood}. Suggest a comforting or relevant Bible verse and provide a gentle prompt to help them write a reflection about it.
      Return JSON:
      {
        "verse": "The suggested Bible verse reference and text",
        "prompt": "A gentle question or prompt for their reflection"
      }`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            verse: { type: "string" },
            prompt: { type: "string" }
          }
        }
      });
      setFormData(prev => ({
        ...prev,
        verse: res.verse,
        reflection: `[AI Prompt: ${res.prompt}]\n\n`
      }));
      toast.success("AI suggested a verse and prompt!");
    } catch (e) {
      toast.error("AI Assist failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let finalScore = 5;
    let uploadedMediaUrl = null;

    try {
      if (file) {
        setAnalyzing(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise(r => reader.onload = r);
        
        const uploadRes = await base44.integrations.Core.UploadFile({ file: reader.result });
        uploadedMediaUrl = uploadRes.file_url;
      }

      await base44.entities.GlowDrop.create({
        user_email: user.email,
        media_url: uploadedMediaUrl,
        ...formData
      });
      await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + finalScore });
      toast.success(`Glow Drop submitted! +${finalScore} Points earned!`);
      
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
      onClose();
      setFormData({ verse: "", reflection: "", hashtags: "", category: "Devotional" });
      setFile(null);
      setMood("");
    } catch (err) {
      toast.error("Failed to submit Glow Drop");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-[#121826] text-white border-white/10 max-h-[90vh] overflow-y-auto z-[2000]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
            <span className="text-2xl">✨</span> Share Your Light
          </DialogTitle>
          <DialogDescription className="text-[#00CFFF]">Submit a Glow Drop to inspire others and earn points</DialogDescription>
        </DialogHeader>

        <div className="bg-[#0B0F1A]/50 p-5 rounded-xl border border-white/5 mb-4 shadow-inner">
          <Label className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-3 block flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#8A5CFF]" /> AI Draft Assistant</Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input 
              placeholder="How are you feeling today? (e.g. anxious, grateful)" 
              value={mood}
              onChange={e => setMood(e.target.value)}
              className="bg-[#121826] border-white/10 text-white h-12"
            />
            <Button type="button" onClick={handleAIAssist} disabled={aiLoading} className="bg-gradient-to-r from-[#8A5CFF] to-[#00CFFF] text-white font-bold h-12 px-6 whitespace-nowrap hover:shadow-[0_0_15px_rgba(138,92,255,0.4)] transition-all">
              {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Inspire Me"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-gray-300 font-semibold uppercase tracking-wider text-xs ml-1">Bible Verse (Optional)</Label>
            <Input placeholder="e.g. Matthew 5:14" value={formData.verse} onChange={e => setFormData({...formData, verse: e.target.value})} className="bg-[#0B0F1A] border-white/10 text-white" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300 font-semibold uppercase tracking-wider text-xs ml-1">Reflection / Testimony (Optional)</Label>
            <Textarea placeholder="Share your testimony..." value={formData.reflection} onChange={e => setFormData({...formData, reflection: e.target.value})} className="bg-[#0B0F1A] border-white/10 text-white min-h-[120px]" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300 font-semibold uppercase tracking-wider text-xs ml-1">Hashtags</Label>
            <Input placeholder="#FaithAlwaysOn" value={formData.hashtags} onChange={e => setFormData({...formData, hashtags: e.target.value})} className="bg-[#0B0F1A] border-white/10 text-[#FFD000]" />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 font-semibold uppercase tracking-wider text-xs ml-1">Attach Media (Optional)</Label>
            <Input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="bg-[#0B0F1A] border-dashed border-2 border-white/10 text-gray-400 text-sm h-auto px-3 py-3 rounded-xl focus-visible:ring-[#00CFFF]/50 focus-visible:border-[#00CFFF] transition-all file:bg-[#121826] file:text-[#00CFFF] file:border file:border-[#00CFFF]/30 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:font-bold hover:file:bg-[#00CFFF]/10 file:cursor-pointer cursor-pointer hover:border-[#00CFFF]/30" />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full h-12 bg-[#00CFFF] hover:bg-white text-black font-bold text-lg rounded-xl transition-all hover:scale-[1.02]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Glow Drop"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}