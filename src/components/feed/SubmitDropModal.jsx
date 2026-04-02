import React, { useState, useRef } from "react";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles, ImagePlus, X, Zap, Hash, BookOpen, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { updatePostingStreak, updateFaithStreak } from "@/lib/gamification";
import ImageCropperModal from "@/components/feed/ImageCropperModal";


const categories = ["Devotional", "Testimony", "Encouragement", "Worship", "Prayer"];

export default function SubmitDropModal({ isOpen, onClose, user }) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // 0-100 or null
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [mood, setMood] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(true);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ verse: "", reflection: "", hashtags: "#FaithAlwaysOn", category: "Devotional" });

  // Fetch daily code suggestion
  const { data: dailyCodes = [] } = useQuery({
    queryKey: ["dailyCodesLatest"],
    queryFn: () => base44.entities.DailyCode.list('-date_published', 1),
  });
  const codeId = dailyCodes[0]?.code_id;
  const { data: codes = [] } = useQuery({
    queryKey: ["codeOfTruth", codeId],
    queryFn: () => base44.entities.CodeOfTruth.filter({ id: codeId }),
    enabled: !!codeId
  });
  const dailyCode = codes[0];

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    // Open cropper
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(selected);
    e.target.value = null;
  };

  const handleCropDone = async (blob) => {
    const croppedFile = new File([blob], "cropped.jpg", { type: "image/jpeg" });
    setFile(croppedFile);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(croppedFile);
    setCropSrc(null);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const adoptDailyCode = () => {
    if (!dailyCode) return;
    const source = dailyCode.source_document === 'keeping_it_100' ? 'Keep It 100' : 'Code of Truth';
    setFormData(prev => ({
      ...prev,
      verse: dailyCode.bible_reference || prev.verse,
      reflection: dailyCode.slogan_text,
      hashtags: `#${source.replace(/\s/g, '')} #FaithAlwaysOn`,
      category: "Devotional"
    }));
    setShowSuggestion(false);
    toast.success(`${source} adopted! Edit and make it yours.`);
  };

  const handleAIAssist = async () => {
    if (!mood.trim()) { toast.error("Tell me how you're feeling first"); return; }
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `The user is feeling: ${mood}. Suggest a comforting Bible verse and a gentle reflection prompt. Return JSON: {"verse": "reference — text", "prompt": "a gentle prompt"}`,
        response_json_schema: { type: "object", properties: { verse: { type: "string" }, prompt: { type: "string" } } }
      });
      setFormData(prev => ({ ...prev, verse: res.verse, reflection: res.prompt }));
      toast.success("✨ AI inspiration ready!");
    } catch { toast.error("AI Assist failed."); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.verse && !formData.reflection && !file) {
      toast.error("Add a verse, reflection, or image to post");
      return;
    }

    // Check 10 posts per 24h limit
    const limitCheck = await checkPostLimitAsync();
    if (!limitCheck.allowed) {
      toast.error(`You've reached 10 posts in 24h. Try again in ${limitCheck.hoursUntil}h`);
      return;
    }

    setLoading(true);
    try {
      let uploadedMediaUrl = null;
      if (file) {
        // Simulate progress while uploading
        setUploadProgress(0);
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 85) { clearInterval(progressInterval); return 85; }
            return prev + Math.floor(Math.random() * 15 + 5);
          });
        }, 300);

        try {
          const uploadRes = await base44.integrations.Core.UploadFile({ file });
          clearInterval(progressInterval);
          setUploadProgress(100);
          uploadedMediaUrl = uploadRes.file_url;
          await new Promise(r => setTimeout(r, 400)); // brief pause to show 100%
        } finally {
          clearInterval(progressInterval);
          setUploadProgress(null);
        }
      }

      await base44.entities.GlowDrop.create({
        user_email: user.email,
        media_url: uploadedMediaUrl,
        ...formData
      });

      const today = new Date().toISOString().split('T')[0];
      const challenges = await base44.entities.UserDailyChallenge.filter({ user_email: user.email, date_string: today });
      let challengeBonus = 0;
      if (!challenges.some(c => c.challenge_id === 'share_verse')) {
        await base44.entities.UserDailyChallenge.create({ user_email: user.email, date_string: today, challenge_id: 'share_verse' });
        challengeBonus = 10;
      }

      const streakUser = await updatePostingStreak(base44, user);
      await updateFaithStreak(base44, streakUser);
      await base44.auth.updateMe({ glow_score: (streakUser.glow_score || user.glow_score || 0) + 5 + challengeBonus });

      // Notify followers about new post (fire and forget)
      base44.entities.Follow.filter({ following_email: user.email }).then(followers => {
        followers.forEach(f => {
          base44.entities.Notification.create({
            user_email: f.follower_email,
            type: "system",
            message: `${user.full_name || "Someone you follow"} just posted a new Glow Drop!`,
            link: `/Feed`
          }).catch(() => {});
        });
      }).catch(() => {});

      toast.success(`Glow Drop posted! +${5 + challengeBonus} XP ⚡`);
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      queryClient.invalidateQueries({ queryKey: ["dailyChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
      resetAndClose();
    } catch {
      toast.error("Failed to post. Try again.");
    } finally { setLoading(false); }
  };

  const resetAndClose = () => {
    setFormData({ verse: "", reflection: "", hashtags: "#FaithAlwaysOn", category: "Devotional" });
    setFile(null);
    setPreview(null);
    setCropSrc(null);
    setMood("");
    setShowSuggestion(true);
    setUploadProgress(null);
    onClose();
  };

  // Check 10 posts per 24h limit
  const checkPostLimitAsync = async () => {
    if (!user?.email) return { allowed: true };
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentDrops = await base44.entities.GlowDrop.filter({ user_email: user.email });
      const postsInLast24h = recentDrops.filter(d => {
        const createdDate = d.created_date ? new Date(d.created_date.endsWith('Z') ? d.created_date : d.created_date + 'Z') : null;
        return createdDate && createdDate > oneDayAgo;
      });
      
      if (postsInLast24h.length >= 10) {
        const oldestPost = postsInLast24h.sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0))[0];
        const nextPostTime = new Date(new Date(oldestPost.created_date || 0).getTime() + 24 * 60 * 60 * 1000);
        const hoursUntil = Math.ceil((nextPostTime - now) / (1000 * 60 * 60));
        return { allowed: false, hoursUntil, postsCount: postsInLast24h.length };
      }
      return { allowed: true, postsCount: postsInLast24h.length };
    } catch (err) {
      console.error("Error checking post limit:", err);
      return { allowed: true };
    }
  };

  return (
    <>
    {cropSrc && (
      <ImageCropperModal
        src={cropSrc}
        onCrop={handleCropDone}
        onCancel={() => setCropSrc(null)}
      />
    )}
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg bg-[#0B0F1A] text-white border border-[#00CFFF]/20 max-h-[92vh] overflow-y-auto z-[2000] p-0 rounded-3xl shadow-[0_0_60px_rgba(0,207,255,0.15)] [&>button]:text-white [&>button]:hover:text-[#00CFFF]">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00CFFF] via-[#8A5CFF] to-[#FFD000] rounded-t-3xl" />
          <h2 className="text-2xl font-black font-['Space_Grotesk'] flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#FFD000]" /> Share Your Light
          </h2>
          <p className="text-sm text-gray-400 mt-1">Inspire others and earn XP</p>
        </div>

        {/* Daily Code Suggestion */}
        {dailyCode && showSuggestion && (
          <div className="mx-6 mb-4">
            <button
              onClick={adoptDailyCode}
              className="w-full text-left bg-gradient-to-r from-[#FFD000]/10 to-[#00CFFF]/10 border border-[#FFD000]/30 rounded-2xl p-4 hover:border-[#FFD000]/60 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[#FFD000]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD000]">
                    Today's {dailyCode.source_document === 'keeping_it_100' ? 'Keep It 100' : 'Code of Truth'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#00CFFF] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Use this</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <p className="text-white font-bold text-sm leading-snug font-['Space_Grotesk'] mb-1">"{dailyCode.slogan_text}"</p>
              {dailyCode.bible_reference && (
                <p className="text-xs text-gray-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {dailyCode.bible_reference}</p>
              )}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* AI Assist */}
          <div className="bg-[#121826] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#8A5CFF]" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">AI Draft Assistant</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="How are you feeling? (grateful, anxious...)"
                value={mood}
                onChange={e => setMood(e.target.value)}
                className="bg-[#0B0F1A] border-white/10 text-white h-11 rounded-xl flex-1"
              />
              <Button type="button" onClick={handleAIAssist} disabled={aiLoading} className="bg-gradient-to-r from-[#8A5CFF] to-[#00CFFF] text-white font-bold h-11 px-5 rounded-xl whitespace-nowrap shrink-0">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Inspire"}
              </Button>
            </div>
          </div>

          {/* Verse */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block ml-1">Bible Verse</label>
            <Input
              placeholder="e.g. Matthew 5:14 — You are the light..."
              value={formData.verse}
              onChange={e => setFormData({ ...formData, verse: e.target.value })}
              className="bg-[#121826] border-white/10 text-white h-11 rounded-xl"
            />
          </div>

          {/* Reflection */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block ml-1">Reflection / Testimony</label>
            <Textarea
              placeholder="Share what's on your heart..."
              value={formData.reflection}
              onChange={e => setFormData({ ...formData, reflection: e.target.value })}
              className="bg-[#121826] border-white/10 text-white min-h-[100px] rounded-xl resize-none"
            />
          </div>

          {/* Category Pills */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block ml-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    formData.category === cat
                      ? "bg-[#00CFFF]/20 text-[#00CFFF] border border-[#00CFFF]/40 shadow-[0_0_12px_rgba(0,207,255,0.2)]"
                      : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block ml-1">Hashtags</label>
            <Input
              placeholder="#FaithAlwaysOn #LightMode"
              value={formData.hashtags}
              onChange={e => setFormData({ ...formData, hashtags: e.target.value })}
              className="bg-[#121826] border-white/10 text-[#FFD000] h-11 rounded-xl"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block ml-1">Attach Photo</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            
            {preview ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#121826]">
                <img src={preview} alt="Preview" className="w-full max-h-60 object-contain bg-black/50" />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {uploadProgress !== null && (
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-black/70 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-[#00CFFF] uppercase tracking-wider">Uploading photo...</span>
                      <span className="text-[10px] font-black text-[#00CFFF]">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg, #00CFFF, #8A5CFF)" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 rounded-2xl border-2 border-dashed border-white/10 bg-[#121826]/50 hover:border-[#00CFFF]/40 hover:bg-[#00CFFF]/5 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <ImagePlus className="w-8 h-8 text-gray-500 group-hover:text-[#00CFFF] transition-colors" />
                <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors font-medium">
                  Tap to add a photo
                </span>
              </button>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-13 bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] hover:opacity-90 text-white font-black text-base rounded-2xl transition-all shadow-[0_0_30px_rgba(0,207,255,0.3)] hover:shadow-[0_0_40px_rgba(0,207,255,0.5)] py-3.5"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Posting...</span>
            ) : (
              <span className="flex items-center gap-2"><Zap className="w-5 h-5" /> Post Glow Drop</span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}