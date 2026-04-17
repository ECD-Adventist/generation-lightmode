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
import { compressImageUnder2MB } from "@/lib/imageUtils";

const categories = ["Devotional", "Testimony", "Encouragement", "Worship", "Prayer"];

export default function SubmitDropModal({ isOpen, onClose, user }) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [mood, setMood] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ verse: "", reflection: "", hashtags: "#FaithAlwaysOn", category: "Devotional" });
  const [titleLoading, setTitleLoading] = useState(false);

  const handleAutoTitle = async () => {
    if (!formData.reflection || formData.reflection.length < 10) return;
    setTitleLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Bible-savvy content curator for "Generation LightMode", a Christian youth social platform.\n\nThe user wrote this reflection/testimony: "${formData.reflection}"\n${formData.category ? `Category: ${formData.category}` : ""}\n${formData.hashtags ? `Hashtags: ${formData.hashtags}` : ""}\n\nGenerate:\n1. The most relevant Bible verse that deeply resonates with this reflection\n2. Format it as an engaging, scroll-stopping title\n\nReturn JSON: {"verse": "Book Chapter:Verse — \\"Exact verse quote text\\""}\n\nRULES:\n- Use NKJV translation\n- The verse must genuinely connect to the reflection's theme/emotion\n- Format: "Book Chapter:Verse — \\"Quote\\""\n- Keep the quote concise (under 20 words if possible)\n- Choose powerful, emotionally resonant verses`,
        response_json_schema: { type: "object", properties: { verse: { type: "string" } } }
      });
      if (res.verse) { setFormData(prev => ({ ...prev, verse: res.verse })); toast.success("AI generated a title for your post!"); }
    } catch { toast.error("Could not generate title. Try again."); }
    finally { setTitleLoading(false); }
  };

  const { data: dailyCodes = [] } = useQuery({ queryKey: ["dailyCodesLatest"], queryFn: () => base44.entities.DailyCode.list('-date_published', 1) });
  const codeId = dailyCodes[0]?.code_id;
  const { data: codes = [] } = useQuery({ queryKey: ["codeOfTruth", codeId], queryFn: () => base44.entities.CodeOfTruth.filter({ id: codeId }), enabled: !!codeId });
  const dailyCode = codes[0];

  const handleFileSelect = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    const compressed = await compressImageUnder2MB(selected);
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.onerror = () => toast.error("Couldn't read that image");
    reader.readAsDataURL(compressed);
    e.target.value = "";
  };

  const handleCropDone = (blob) => {
    if (!blob) { toast.error("Couldn't prepare the photo. Try again."); return; }
    const croppedFile = new File([blob], `glow-drop-${Date.now()}.jpg`, { type: "image/jpeg" });
    setFile(croppedFile);
    setPreview(URL.createObjectURL(croppedFile));
    setCropSrc(null);
  };

  const clearFile = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const adoptDailyCode = () => {
    if (!dailyCode) return;
    const source = dailyCode.source_document === 'keeping_it_100' ? 'Keep It 100' : 'Code of Truth';
    setFormData(prev => ({ ...prev, verse: dailyCode.bible_reference || prev.verse, reflection: dailyCode.slogan_text, hashtags: `#${source.replace(/\s/g, '')} #FaithAlwaysOn`, category: "Devotional" }));
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
      toast.success("AI inspiration ready!");
    } catch { toast.error("AI Assist failed."); }
    finally { setAiLoading(false); }
  };

  const resetAndClose = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFormData({ verse: "", reflection: "", hashtags: "#FaithAlwaysOn", category: "Devotional" });
    setFile(null); setPreview(null); setCropSrc(null); setMood(""); setShowSuggestion(true); setUploadProgress(0); setUploadStage("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.verse && !formData.reflection && !file) { toast.error("Add a verse, reflection, or image to post"); return; }
    setLoading(true); setUploadProgress(5); setUploadStage(file ? "Uploading photo..." : "Creating post...");
    try {
      let uploadedMediaUrl = null;
      if (file) {
        const uploadPromise = base44.integrations.Core.UploadFile({ file });
        const progressTimer = window.setInterval(() => { setUploadProgress((c) => (c < 85 ? c + 5 : c)); }, 250);
        const uploadRes = await uploadPromise;
        window.clearInterval(progressTimer);
        uploadedMediaUrl = uploadRes.file_url;
        setUploadProgress(90); setUploadStage("Saving post...");
      } else { setUploadProgress(90); }

      await base44.functions.invoke('createGlowDrop', { ...formData, media_url: uploadedMediaUrl });
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
      base44.entities.Follow.filter({ following_email: user.email }).then(followers => {
        followers.forEach(f => { base44.entities.Notification.create({ user_email: f.follower_email, type: "system", message: `${user.full_name || "Someone you follow"} just posted a new Glow Drop!`, link: `/Feed` }).catch(() => {}); });
      }).catch(() => {});
      setUploadProgress(100); setUploadStage("Done");
      toast.success(`Glow Drop posted! +${5 + challengeBonus} XP ⚡`);
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      queryClient.invalidateQueries({ queryKey: ["dailyChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
      resetAndClose();
    } catch (error) {
      console.error("Glow Drop upload failed:", error);
      toast.error(error?.message || "Failed to post. Try again.");
    } finally { setLoading(false); }
  };

  const inputStyle = "w-full rounded-xl px-4 h-11 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0B3FD9]/30";
  const inputColors = { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" };

  return (
    <>
      {cropSrc && <ImageCropperModal src={cropSrc} onCrop={handleCropDone} onCancel={() => setCropSrc(null)} />}

      <Dialog open={isOpen} onOpenChange={resetAndClose}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto z-[2000] p-0 rounded-3xl font-['Inter'] [&>button]:text-[#4A5878] [&>button]:hover:text-[#0B3FD9]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 24px 80px rgba(11, 63, 217, 0.15)" }}>
          <div className="relative px-6 pt-6 pb-4">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9, #FFD000)" }} />
            <h2 className="text-2xl font-black font-['Space_Grotesk'] flex items-center gap-2" style={{ color: "#0B1B3D" }}>
              <Zap className="w-6 h-6" style={{ color: "#FF9F1A" }} /> Share Your Light
            </h2>
            <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Inspire others and earn XP</p>
          </div>

          {dailyCode && showSuggestion && (
            <div className="mx-6 mb-4">
              <button onClick={adoptDailyCode} className="w-full text-left rounded-2xl p-4 transition-all group" style={{ background: "linear-gradient(135deg, rgba(255,208,0,0.08), rgba(31,184,255,0.06))", border: "1px solid #FFE4A0" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" style={{ color: "#CC7A00" }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#CC7A00" }}>Today's {dailyCode.source_document === 'keeping_it_100' ? 'Keep It 100' : 'Code of Truth'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#0B3FD9" }}>
                    <span>Use this</span><ChevronRight className="w-3 h-3" />
                  </div>
                </div>
                <p className="font-bold text-sm leading-snug font-['Space_Grotesk'] mb-1" style={{ color: "#0B1B3D" }}>"{dailyCode.slogan_text}"</p>
                {dailyCode.bible_reference && <p className="text-xs flex items-center gap-1" style={{ color: "#6B7FA0" }}><BookOpen className="w-3 h-3" /> {dailyCode.bible_reference}</p>}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div className="rounded-2xl p-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: "#0B3FD9" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4A5878" }}>AI Draft Assistant</span>
              </div>
              <div className="flex gap-2">
                <Input placeholder="How are you feeling? (grateful, anxious...)" value={mood} onChange={e => setMood(e.target.value)} className={inputStyle + " flex-1"} style={inputColors} />
                <Button type="button" onClick={handleAIAssist} disabled={aiLoading} className="font-bold h-11 px-5 rounded-xl whitespace-nowrap shrink-0" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Inspire"}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block ml-1" style={{ color: "#6B7FA0" }}>Bible Verse</label>
              <Input placeholder="e.g. Matthew 5:14 — You are the light..." value={formData.verse} onChange={e => setFormData({ ...formData, verse: e.target.value })} className={inputStyle} style={inputColors} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: "#6B7FA0" }}>Reflection / Testimony</label>
                {formData.reflection && formData.reflection.length > 10 && (
                  <button type="button" disabled={titleLoading} onClick={handleAutoTitle} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all hover:opacity-80" style={{ background: "rgba(11,63,217,0.08)", color: "#0B3FD9", border: "1px solid #D6E4FF" }}>
                    <Sparkles className="w-3 h-3" /> {titleLoading ? "Generating..." : "AI Title"}
                  </button>
                )}
              </div>
              <Textarea placeholder="Share what's on your heart..." value={formData.reflection} onChange={e => setFormData({ ...formData, reflection: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm min-h-[100px] resize-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0B3FD9]/30" style={inputColors} />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block ml-1" style={{ color: "#6B7FA0" }}>Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat} type="button" onClick={() => setFormData({ ...formData, category: cat })} className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all" style={formData.category === cat ? { background: "rgba(11,63,217,0.1)", color: "#0B3FD9", border: "1px solid #D6E4FF", boxShadow: "0 2px 8px rgba(11,63,217,0.12)" } : { background: "#F6F8FC", color: "#6B7FA0", border: "1px solid #E6ECF5" }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block ml-1" style={{ color: "#6B7FA0" }}>Hashtags</label>
              <Input placeholder="#FaithAlwaysOn #LightMode" value={formData.hashtags} onChange={e => setFormData({ ...formData, hashtags: e.target.value })} className={inputStyle} style={{ ...inputColors, color: "#CC7A00" }} />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block ml-1" style={{ color: "#6B7FA0" }}>Attach Photo</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              {preview ? (
                <div className="relative rounded-2xl overflow-hidden" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                  <img src={preview} alt="Preview" className="w-full max-h-60 object-contain" />
                  <button type="button" onClick={clearFile} disabled={loading} className="absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors disabled:opacity-50" style={{ background: "rgba(0,0,0,0.5)", color: "#FFFFFF" }}>
                    <X className="w-4 h-4" />
                  </button>
                  {loading && file && (
                    <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
                      <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1.5">
                        <span>{uploadStage}</span><span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)" }} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading} className="w-full h-28 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 group disabled:opacity-50" style={{ borderColor: "#D6E4FF", background: "#F6F8FC" }}>
                  <ImagePlus className="w-8 h-8 group-hover:scale-110 transition" style={{ color: "#8A97B5" }} />
                  <span className="text-xs font-medium" style={{ color: "#6B7FA0" }}>Tap to add a photo</span>
                </button>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full font-black text-base rounded-2xl transition-all py-3.5 h-auto" style={{ background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 4px 18px rgba(255, 159, 26, 0.35)" }}>
              {loading ? <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Posting...</span> : <span className="flex items-center gap-2"><Zap className="w-5 h-5" /> Post Glow Drop</span>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}