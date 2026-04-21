import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { updatePostingStreak, updateFaithStreak } from "@/lib/gamification";

export default function SubmitDropTab({ user }) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ verse: "", reflection: "", hashtags: "", category: "Devotional" });
  const [mood, setMood] = useState("");

  const handleAIAssist = async () => {
    if (!mood) { toast.error("Please enter how you're feeling first"); return; }
    setAiLoading(true);
    try {
      const prompt = `The user is feeling: ${mood}. Suggest a comforting or relevant Bible verse and provide a gentle prompt to help them write a reflection about it.
      Return JSON:
      { "verse": "The suggested Bible verse reference and text", "prompt": "A gentle question or prompt for their reflection" }`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: "object", properties: { verse: { type: "string" }, prompt: { type: "string" } } }
      });
      setFormData(prev => ({ ...prev, verse: res.verse, reflection: `[AI Prompt: ${res.prompt}]\n\n` }));
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
        const uploadRes = await base44.integrations.Core.UploadFile({ file: file });
        uploadedMediaUrl = uploadRes.file_url;

        try {
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
            const engagementPoints = (likes * 1) + (shares * 2) + (saves * 2) + Math.floor(views / 10);
            finalScore += Math.min(engagementPoints, 100);
          }
        } catch (extractError) {
          console.log("Could not extract metrics from image, continuing with base score");
        }
        setAnalyzing(false);
      }

      await base44.entities.GlowDrop.create({ user_email: user.email, media_url: uploadedMediaUrl, ...formData });
      const today = new Date().toISOString().split('T')[0];
      const challenges = await base44.entities.UserDailyChallenge.filter({ user_email: user.email, date_string: today });
      let challengeBonus = 0;
      let challengeMsg = "";
      if (!challenges.some(c => c.challenge_id === 'share_verse')) {
        await base44.entities.UserDailyChallenge.create({ user_email: user.email, date_string: today, challenge_id: 'share_verse' });
        challengeBonus = 10;
        challengeMsg = " + Challenge Completed! +10 XP ⚡";
      }

      const streakUser = await updatePostingStreak(base44, user);
      await updateFaithStreak(base44, streakUser);
      await base44.auth.updateMe({ glow_score: (streakUser.glow_score || user.glow_score || 0) + finalScore + challengeBonus });
      toast.success(`Glow Drop submitted! +${finalScore} XP earned!${challengeMsg}`);

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

  const inputClass = "bg-muted border-border text-foreground";

  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 relative font-['Inter']">
      <div className="relative p-8 rounded-[1.75rem] bg-card border border-border shadow-sm">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
            <span className="text-2xl">✨</span>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-foreground">Share Your Light</h2>
            <p className="text-sm font-medium mt-1 text-blue-600 dark:text-blue-400">Submit a Glow Drop to inspire others</p>
          </div>
        </div>

        <div className="p-5 rounded-xl mb-6 bg-muted border border-border">
          <Label className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-muted-foreground"><Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" /> AI Draft Assistant</Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="How are you feeling today? (e.g. anxious, grateful, seeking guidance)" value={mood} onChange={e => setMood(e.target.value)} className={`h-12 bg-background border-border text-foreground ${inputClass}`} />
            <Button type="button" onClick={handleAIAssist} disabled={aiLoading} className="font-bold h-12 px-6 whitespace-nowrap transition-all bg-gradient-to-r from-cyan-400 to-blue-600 text-white border-none shadow-sm hover:opacity-90">
              {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Inspire Me"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="font-semibold uppercase tracking-wider text-xs ml-1 text-muted-foreground">Bible Verse (Optional)</Label>
            <Input placeholder="e.g. Matthew 5:14" value={formData.verse} onChange={e => setFormData({...formData, verse: e.target.value})} className={`text-base py-6 px-4 rounded-xl ${inputClass}`} />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold uppercase tracking-wider text-xs ml-1 text-muted-foreground">Reflection / Testimony (Optional)</Label>
            <Textarea placeholder="What does this verse mean to you? Share your testimony..." value={formData.reflection} onChange={e => setFormData({...formData, reflection: e.target.value})} className={`text-base p-4 rounded-xl min-h-[160px] resize-y ${inputClass}`} />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold uppercase tracking-wider text-xs ml-1 text-muted-foreground">Hashtags</Label>
            <Input placeholder="#FaithAlwaysOn #GlowDrop" value={formData.hashtags} onChange={e => setFormData({...formData, hashtags: e.target.value})} className={`text-base py-6 px-4 rounded-xl text-amber-600 dark:text-amber-400 ${inputClass}`} />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold uppercase tracking-wider text-xs ml-1 text-muted-foreground">Engagement Screenshot (Optional)</Label>
            <p className="text-xs ml-1 mb-2 text-muted-foreground">Upload a screenshot showing likes, shares, or saves to earn extra impact points!</p>
            <Input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="text-sm h-auto px-3 py-3 rounded-xl border-dashed border-2 border-border bg-muted text-foreground file:rounded-lg file:px-4 file:py-2 file:mr-4 file:font-bold file:cursor-pointer file:bg-background file:text-foreground cursor-pointer hover:border-blue-500/50 transition-colors" />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-14 mt-4 text-lg font-bold font-['Space_Grotesk'] rounded-xl border-none transition-all hover:scale-[1.02] bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-sm hover:shadow-md">
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" />{analyzing ? "Analyzing Screenshot..." : "Posting..."}</>
            ) : (
              <><span className="mr-2">⚡</span> Post Glow Drop</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}