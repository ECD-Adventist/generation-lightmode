import React, { useState, useRef } from "react";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles, ImagePlus, X, Zap, Hash, BookOpen, ChevronRight, UserCircle2, Music } from "lucide-react";
import MusicPickerModal from "@/components/feed/MusicPickerModal";
import AudioPlayer from "@/components/feed/AudioPlayer";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { updatePostingStreak, updateFaithStreak } from "@/lib/gamification";
import { compressImageUnder2MB } from "@/lib/imageUtils";
import PhotoEditorModal from "@/components/feed/PhotoEditorModal";
import { queueDropForSync } from "@/lib/offlineCache";
import { mirrorGlowDropToSupabase } from "@/lib/supabaseGlowDrops";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import { getDisplayName } from "@/lib/displayName";

const categories = ["Devotional", "Testimony", "Encouragement", "Worship", "Prayer"];
const limitToNineLines = (value) => value.split("\n").slice(0, 9).join("\n");

export default function SubmitDropModal({ isOpen, onClose, user }) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [mood, setMood] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ verse: "", reflection: "", hashtags: "#FaithAlwaysOn", category: "Devotional" });
  const [titleLoading, setTitleLoading] = useState(false);
  const [sizeInfo, setSizeInfo] = useState(null); // { originalKB, compressedKB, savedPercent }
  const [compressing, setCompressing] = useState(false);
  const [editorFile, setEditorFile] = useState(null); // file currently open in photo editor
  const [postAsLeaderId, setPostAsLeaderId] = useState(""); // empty = post as self
  const [postSuccess, setPostSuccess] = useState(false); // shows green success banner before auto-close
  const [musicOpen, setMusicOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioTitle, setAudioTitle] = useState("");

  // Fetch only leader accounts this user is allowed to manage.
  const { data: leaderAccounts = [] } = useQuery({
    queryKey: ["myLeaderAccounts", user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke("listManagedLeaderAccounts", {});
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user?.email,
  });

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAutoTitle = async () => {
    if (!formData.reflection || formData.reflection.length < 10) return;
    setTitleLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Bible-savvy content curator for "Generation LightMode", a Christian youth social platform.

The user wrote this reflection/testimony: "${formData.reflection}"
${formData.category ? `Category: ${formData.category}` : ""}
${formData.hashtags ? `Hashtags: ${formData.hashtags}` : ""}

Generate:
1. The most relevant Bible verse that deeply resonates with this reflection
2. Format it as an engaging, scroll-stopping title

Return JSON: {"verse": "Book Chapter:Verse — \"Exact verse quote text\""}

RULES:
- Use NKJV translation
- The verse must genuinely connect to the reflection's theme/emotion
- Format: "Book Chapter:Verse — \"Quote\""
- Keep the quote concise (under 20 words if possible)
- Choose powerful, emotionally resonant verses`,
        response_json_schema: { type: "object", properties: { verse: { type: "string" } } }
      });
      if (res.verse) {
        setFormData(prev => ({ ...prev, verse: res.verse }));
        toast.success("AI generated a title for your post!");
      }
    } catch {
      toast.error("Could not generate title. Try again.");
    } finally {
      setTitleLoading(false);
    }
  };

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

  const preparePhotoForEditing = async (selected) => {
    if (!selected?.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setCompressing(true);
    const originalSize = selected.size;
    const compressed = await compressImageUnder2MB(selected);
    const compressedSize = compressed.size;
    const savedPercent = originalSize > compressedSize
      ? Math.round((1 - compressedSize / originalSize) * 100)
      : 0;

    setSizeInfo({
      original: formatSize(originalSize),
      compressed: formatSize(compressedSize),
      savedPercent,
      wasCompressed: compressedSize < originalSize,
    });
    setCompressing(false);
    setEditorFile(new File([compressed], `glow-drop-${Date.now()}.jpg`, { type: "image/jpeg" }));
  };

  const handleFileSelect = async (e) => {
    const selected = e.target.files?.[0];
    await preparePhotoForEditing(selected);
    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) await preparePhotoForEditing(selected);
  };

  const handleSamplePhoto = async () => {
    try {
      setCompressing(true);
      const response = await fetch("https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80");
      const blob = await response.blob();
      await preparePhotoForEditing(new File([blob], "sample-glow-drop.jpg", { type: blob.type || "image/jpeg" }));
    } catch {
      setCompressing(false);
      toast.error("Could not load the sample photo. Please try again.");
    }
  };

  const handleEditorApply = async (editedFile) => {
    // Recompress after edit to keep things lean
    let finalFile = editedFile;
    if (editedFile.size > 2 * 1024 * 1024) {
      const recompressed = await compressImageUnder2MB(editedFile);
      finalFile = new File([recompressed], `glow-drop-${Date.now()}.jpg`, { type: "image/jpeg" });
      setSizeInfo((prev) => prev ? { ...prev, compressed: formatSize(finalFile.size) } : prev);
    }
    setFile(finalFile);
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(finalFile));
    setEditorFile(null);
  };

  const handleEditorCancel = () => {
    setEditorFile(null);
  };

  const handleEditCurrentPhoto = () => {
    if (file) setEditorFile(file);
  };

  const clearFile = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setSizeInfo(null);
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
    if (!mood.trim()) {
      toast.error("Tell me how you're feeling first");
      return;
    }
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `The user is feeling: ${mood}. Suggest a comforting Bible verse and a gentle reflection prompt. Return JSON: {"verse": "reference — text", "prompt": "a gentle prompt"}`,
        response_json_schema: { type: "object", properties: { verse: { type: "string" }, prompt: { type: "string" } } }
      });
      setFormData(prev => ({ ...prev, verse: res.verse, reflection: res.prompt }));
      toast.success("AI inspiration ready!");
    } catch {
      toast.error("AI Assist failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const resetAndClose = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFormData({ verse: "", reflection: "", hashtags: "#FaithAlwaysOn", category: "Devotional" });
    setFile(null);
    setPreview(null);
    setMood("");
    setShowSuggestion(true);
    setUploadProgress(0);
    setUploadStage("");
    setSizeInfo(null);
    setCompressing(false);
    setPostAsLeaderId("");
    setPostSuccess(false);
    setAudioUrl("");
    setAudioTitle("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.verse && !formData.reflection && !file) {
      toast.error("Add a verse, reflection, or image to post");
      return;
    }

    setLoading(true);
    setUploadProgress(5);
    setUploadStage(file ? "Uploading photo..." : "Creating post...");

    if (!navigator.onLine) {
      await queueDropForSync({
        ...formData,
        media_file: file || null,
        post_as_leader_id: postAsLeaderId || undefined,
      });
      toast.success("You're offline. This drop was queued and will post when internet returns.");
      setLoading(false);
      resetAndClose();
      return;
    }

    try {
      let uploadedMediaUrl = null;

      if (file) {
        // Calibrate progress speed to file size — bigger files advance slower,
        // so the bar reflects actual upload time instead of zipping to 90%.
        // Typical mobile upload: ~300KB/sec. Cap at 90% until upload resolves.
        const fileSizeMB = file.size / (1024 * 1024);
        const estimatedSeconds = Math.max(2, Math.min(30, fileSizeMB * 3)); // 3s per MB, 2s min, 30s max
        const tickMs = 200;
        const totalTicks = (estimatedSeconds * 1000) / tickMs;
        const increment = 85 / totalTicks; // reach 90 over estimated time

        setUploadProgress(5);
        const uploadPromise = base44.integrations.Core.UploadFile({ file });
        const progressTimer = window.setInterval(() => {
          setUploadProgress((current) => (current < 90 ? Math.min(90, current + increment) : current));
        }, tickMs);

        const uploadRes = await uploadPromise;
        window.clearInterval(progressTimer);
        uploadedMediaUrl = uploadRes.file_url;
        setUploadProgress(95);
        setUploadStage("Saving post...");
      } else {
        setUploadProgress(90);
      }

      const authorUsername = user.username || user.email?.split("@")[0] || "Glow Believer";
      const authorName = user.full_name || user.username || authorUsername;
      const authorAvatar = user.profile_picture || user.profile_picture_url || null;

      // Optimistic update
      const tempDrop = {
        id: `temp-${Date.now()}`,
        verse: formData.verse,
        reflection: formData.reflection,
        category: formData.category,
        hashtags: formData.hashtags,
        media_url: uploadedMediaUrl,
        audio_url: audioUrl || null,
        audio_title: audioTitle || null,
        user_email: user.email,
        author_name: authorName,
        author_username: authorUsername,
        author_avatar: authorAvatar,
        created_date: new Date().toISOString(),
        likes_count: 0,
        shares_count: 0,
        reposts_count: 0,
        status: 'approved'
      };
      const prependToInfinite = (old, drop) => {
        if (!old?.pages) return old;
        const firstPage = old.pages[0] || { items: [] };
        return { ...old, pages: [{ ...firstPage, items: [drop, ...(firstPage.items || [])] }, ...old.pages.slice(1)] };
      };
      queryClient.setQueryData(["allGlowDrops"], old => prependToInfinite(old, tempDrop));
      queryClient.setQueryData(["glowFeed"], old => prependToInfinite(old, tempDrop));

      try {
        await base44.functions.invoke('createGlowDrop', {
          ...formData,
          media_url: uploadedMediaUrl,
          audio_url: audioUrl || undefined,
          audio_title: audioTitle || undefined,
          post_as_leader_id: postAsLeaderId || undefined,
        });
      } catch (invokeErr) {
        // Backend rate-limits must still surface to the user — don't silently fall back.
        const sd = invokeErr?.response?.data;
        const limited = sd?.rate_limited || invokeErr?.response?.status === 429;
        const offline = !navigator.onLine || /network|timeout|fetch/i.test(invokeErr?.message || "");
        if (limited || offline) throw invokeErr;
        // Fallback: create the drop directly so the post always saves.
        const newDrop = await base44.entities.GlowDrop.create({
          user_email: user.email,
          author_name: authorName,
          author_username: authorUsername,
          author_avatar: authorAvatar,
          verse: formData.verse || "",
          reflection: formData.reflection || "",
          hashtags: formData.hashtags || "",
          category: formData.category || "Devotional",
          media_url: uploadedMediaUrl || null,
          audio_url: audioUrl || null,
          audio_title: audioTitle || null,
          status: "approved",
        });
        mirrorGlowDropToSupabase(newDrop, user);
      }

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
        followers.forEach(f => {
          base44.entities.Notification.create({
            user_email: f.follower_email,
            type: "system",
            message: `${getDisplayName(user)} just posted a new Glow Drop!`,
            link: `/Feed`
          }).catch(() => {});
        });
      }).catch(() => {});

      setUploadProgress(100);
      setUploadStage("Done");
      toast.success(`Glow Drop posted! +${5 + challengeBonus} XP ⚡`);
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      queryClient.invalidateQueries({ queryKey: ["dailyChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
      // Show success banner, then auto-close + reset after 1.5s.
      setLoading(false);
      setPostSuccess(true);
      setTimeout(() => { resetAndClose(); }, 1500);
      return;
    } catch (error) {
      console.error("Glow Drop upload failed:", error);
      // Backend rate-limit responses come back via axios with response.data
      const serverData = error?.response?.data;
      const serverMsg = serverData?.error;
      const isRateLimited = serverData?.rate_limited || error?.response?.status === 429 || /rate.?limit|429/i.test(error?.message || "");

      if (isRateLimited) {
        toast.error(serverMsg || "You've reached today's post limit. Please try again later.", { duration: 7000 });
      } else {
        const msg = (error?.message || "").toLowerCase();
        if (msg.includes("network") || msg.includes("timeout") || msg.includes("fetch") || !navigator.onLine) {
          await queueDropForSync({
            ...formData,
            media_file: file || null,
            post_as_leader_id: postAsLeaderId || undefined,
          });
          toast.success("Connection lost. This drop was queued and will post when internet returns.");
          resetAndClose();
        } else {
          toast.error(serverMsg || error?.message || "Failed to post. Try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {editorFile && (
        <PhotoEditorModal
          file={editorFile}
          onApply={handleEditorApply}
          onCancel={handleEditorCancel}
        />
      )}
      <MusicPickerModal
        isOpen={musicOpen}
        onClose={() => setMusicOpen(false)}
        onSelect={(track) => { setAudioUrl(track.audio_url); setAudioTitle(track.audio_title); }}
      />
      <Dialog open={isOpen} onOpenChange={resetAndClose}>
        <DialogContent className="w-full max-w-2xl max-h-[92vh] overflow-y-auto z-[2000] p-0 rounded-3xl [&>button]:text-[#4A5878] [&>button]:hover:text-[#0B3FD9]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D", boxShadow: "0 16px 48px rgba(11, 63, 217, 0.18)" }}>
          <div className="relative px-6 pt-6 pb-4">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9, #FFD000)" }} />
            <h2 className="text-2xl font-black font-['Space_Grotesk'] flex items-center gap-2" style={{ color: "#0B1B3D" }}>
              <Zap className="w-6 h-6" style={{ color: "#CC7A00" }} /> Share Your Light
            </h2>
            <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Inspire others and earn XP</p>
          </div>

          {postSuccess && (
            <div className="mx-6 mb-4 rounded-2xl px-4 py-3 flex items-center gap-2 font-bold text-sm" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid #86EFAC", color: "#16A34A" }}>
              ✅ Glow Drop posted successfully!
            </div>
          )}

          {dailyCode && showSuggestion && (
            <div className="mx-6 mb-4">
              <button
                onClick={adoptDailyCode}
                className="w-full text-left rounded-2xl p-4 transition-all group"
                style={{ background: "linear-gradient(135deg, rgba(255,208,0,0.06), rgba(31,184,255,0.06))", border: "1px solid #FFE4A0" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" style={{ color: "#CC7A00" }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#CC7A00" }}>
                      Today's {dailyCode.source_document === 'keeping_it_100' ? 'Keep It 100' : 'Code of Truth'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#0B3FD9" }}>
                    <span>Use this</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
                <p className="font-bold text-sm leading-snug font-['Space_Grotesk'] mb-1" style={{ color: "#0B1B3D" }}>"{dailyCode.slogan_text}"</p>
                {dailyCode.bible_reference && (
                  <p className="text-xs flex items-center gap-1" style={{ color: "#6B7FA0" }}><BookOpen className="w-3 h-3" /> {dailyCode.bible_reference}</p>
                )}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {leaderAccounts.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(255,208,0,0.06), rgba(31,184,255,0.06))", border: "1px solid #FFE4A0" }}>
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle2 className="w-4 h-4" style={{ color: "#CC7A00" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#CC7A00" }}>Post As</span>
                </div>
                <BottomSheetSelect
                  value={postAsLeaderId}
                  onChange={setPostAsLeaderId}
                  placeholder={`Myself (${getDisplayName(user)})`}
                  triggerClassName="w-full h-11 rounded-xl px-3 text-sm font-semibold focus:outline-none"
                  triggerStyle={{ background: "#FFFFFF", border: "1px solid #FFE4A0", color: "#0B1B3D" }}
                  options={[
                    { value: "", label: `Myself (${getDisplayName(user)})` },
                    ...leaderAccounts.map(account => ({
                      value: account.id,
                      label: `${account.leader_name}${account.leader_title ? ` — ${account.leader_title}` : ""}`
                    }))
                  ]}
                />
                {postAsLeaderId && (
                  <p className="text-[11px] mt-2" style={{ color: "#8B6914" }}>
                    ⚠ This post will appear under the leader's identity. Action is logged.
                  </p>
                )}
              </div>
            )}

            {/* AI Draft Assistant — only shown while drafting. Once the post has a verse
                or reflection, this helper disappears to declutter the composer. */}
            {!formData.verse?.trim() && !formData.reflection?.trim() && (
            <div className="rounded-2xl p-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: "#0B3FD9" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4A5878" }}>AI Draft Assistant</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="How are you feeling? (grateful, anxious...)"
                  value={mood}
                  onChange={e => setMood(e.target.value)}
                  className="h-11 rounded-xl flex-1"
                  style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
                />
                <Button type="button" onClick={handleAIAssist} disabled={aiLoading} className="font-bold h-11 px-5 rounded-xl whitespace-nowrap shrink-0" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Inspire"}
                </Button>
              </div>
            </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block ml-1" style={{ color: "#6B7FA0" }}>Bible Verse</label>
              <Input
                placeholder="e.g. Matthew 5:14 — You are the light..."
                value={formData.verse}
                onChange={e => setFormData({ ...formData, verse: e.target.value })}
                className="h-11 rounded-xl"
                style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: "#6B7FA0" }}>Reflection / Testimony</label>
                {formData.reflection && formData.reflection.length > 10 && (
                  <button
                    type="button"
                    disabled={titleLoading}
                    onClick={handleAutoTitle}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "rgba(138,92,255,0.15)", color: "#8A5CFF", border: "1px solid rgba(138,92,255,0.3)" }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {titleLoading ? "Generating..." : "AI Title"}
                  </button>
                )}
              </div>
              <Textarea
                placeholder="Create a poster-style quote, one line at a time..."
                value={formData.reflection}
                onChange={e => setFormData({ ...formData, reflection: limitToNineLines(e.target.value) })}
                className="min-h-[140px] rounded-xl resize-none"
                style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
              />
              <p className="mt-1.5 text-right text-[10px] font-bold" style={{ color: "#8A97B5" }}>
                {formData.reflection ? formData.reflection.split("\n").length : 0}/9 lines
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block ml-1" style={{ color: "#6B7FA0" }}>Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={formData.category === cat
                      ? { background: "rgba(31, 184, 255, 0.1)", color: "#0B3FD9", border: "1px solid #B8E5FF" }
                      : { background: "#F6F8FC", color: "#6B7FA0", border: "1px solid #E6ECF5" }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block ml-1" style={{ color: "#6B7FA0" }}>Hashtags</label>
              <Input
                placeholder="#FaithAlwaysOn #LightMode"
                value={formData.hashtags}
                onChange={e => setFormData({ ...formData, hashtags: e.target.value })}
                className="h-11 rounded-xl"
                style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#CC7A00" }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6B7FA0" }}>Attach Photo</label>
                {compressing && (
                  <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "#0B3FD9" }}>
                    <Loader2 className="w-3 h-3 animate-spin" /> Optimizing...
                  </span>
                )}
                {!compressing && sizeInfo && (
                  <span className="text-[10px] font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: sizeInfo.wasCompressed ? "rgba(34,197,94,0.1)" : "rgba(31,184,255,0.1)", color: sizeInfo.wasCompressed ? "#16A34A" : "#0B3FD9", border: sizeInfo.wasCompressed ? "1px solid #86EFAC" : "1px solid #B8E5FF" }}>
                    {sizeInfo.wasCompressed ? (
                      <>📦 {sizeInfo.original} → {sizeInfo.compressed} (-{sizeInfo.savedPercent}%)</>
                    ) : (
                      <>✓ {sizeInfo.compressed}</>
                    )}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="glow-drop-photo-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="sr-only"
                aria-label="Choose a photo for your Glow Drop"
              />

              {preview ? (
                <div className="relative rounded-2xl overflow-hidden flex items-center justify-center" style={{ border: "1px solid #E6ECF5", background: "#F6F8FC", minHeight: "12rem", maxHeight: "32rem" }}>
                  <img src={preview} alt="Preview" className="relative z-10 max-w-full max-h-[32rem] w-auto h-auto object-contain" />
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleEditCurrentPhoto}
                      disabled={loading}
                      className="px-3 h-8 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center gap-1.5 text-white text-xs font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={clearFile}
                      disabled={loading}
                      className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {loading && file && (
                    <div className="absolute inset-x-0 bottom-0 z-20 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                      <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1.5">
                        <span>{uploadStage}</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="glow-drop-photo-input"
                    aria-label="Choose a photo for your Glow Drop"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                    onDrop={handleDrop}
                    className={`w-full h-28 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 group ${loading || compressing ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                    style={{ borderColor: dragOver ? "#00CFFF" : "#D6E4FF", background: dragOver ? "rgba(0,207,255,0.05)" : "#F6F8FC" }}
                  >
                    <ImagePlus className="w-8 h-8 transition-colors" style={{ color: dragOver ? "#00CFFF" : "#8A97B5" }} />
                    <span className="text-xs transition-colors font-medium" style={{ color: dragOver ? "#00CFFF" : "#8A97B5" }}>
                      {dragOver ? "Drop photo here" : "Tap or drag a photo here"}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSamplePhoto}
                    disabled={loading || compressing}
                    className="mt-2 w-full text-center text-xs font-semibold transition hover:opacity-80 disabled:opacity-50"
                    style={{ color: "#0B3FD9" }}
                  >
                    Or use a sample photo
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block ml-1" style={{ color: "#6B7FA0" }}>Attach Music</label>
              {audioUrl ? (
                <AudioPlayer
                  audioUrl={audioUrl}
                  audioTitle={audioTitle}
                  onRemove={() => { setAudioUrl(""); setAudioTitle(""); }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setMusicOpen(true)}
                  disabled={loading}
                  className="w-full h-12 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ borderColor: "#D6E4FF", background: "#F6F8FC" }}
                >
                  <Music className="w-4 h-4" style={{ color: "#8A97B5" }} />
                  <span className="text-xs font-medium" style={{ color: "#8A97B5" }}>Browse music library</span>
                </button>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-13 hover:opacity-90 font-black text-base rounded-2xl transition-all py-3.5"
              style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}
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