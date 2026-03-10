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
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ verse: "", reflection: "", hashtags: "", category: "Devotional" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.GlowDrop.create({
        user_email: user.email,
        ...formData
      });
      await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 5 });
      toast.success("Glow Drop submitted! +5 Points");
      setFormData({ verse: "", reflection: "", hashtags: "", category: "Devotional" });
      queryClient.invalidateQueries(["myGlowDrops"]);
    } catch (err) {
      toast.error("Failed to submit Glow Drop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-[#121826] p-6 rounded-xl border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 font-['Space_Grotesk'] text-white">Share Your Light</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label className="text-gray-300">Bible Verse</Label>
          <Input 
            required 
            placeholder="e.g. Matthew 5:14" 
            value={formData.verse} 
            onChange={e => setFormData({...formData, verse: e.target.value})} 
            className="bg-[#1A2033] border-gray-700 text-white mt-1" 
          />
        </div>
        <div>
          <Label className="text-gray-300">Reflection</Label>
          <Textarea 
            required 
            placeholder="What does this verse mean to you today?" 
            value={formData.reflection} 
            onChange={e => setFormData({...formData, reflection: e.target.value})} 
            className="bg-[#1A2033] border-gray-700 text-white mt-1 h-32" 
          />
        </div>
        <div>
          <Label className="text-gray-300">Hashtags</Label>
          <Input 
            placeholder="#FaithAlwaysOn #GlowDrop" 
            value={formData.hashtags} 
            onChange={e => setFormData({...formData, hashtags: e.target.value})} 
            className="bg-[#1A2033] border-gray-700 text-white mt-1" 
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] hover:opacity-90 text-black font-bold border-none">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Post Glow Drop
        </Button>
      </form>
    </div>
  );
}