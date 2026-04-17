import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, X, Send, Image as ImageIcon, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const CATEGORIES = ["Devotional", "Testimony", "Scripture", "Prayer", "Encouragement", "Teaching", "Announcement"];
const BRAND_EMAIL = "system@lightmode.com";
const BRAND_LOGO = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg";

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["blockquote", "link", "video"],
    [{ color: [] }, { background: [] }],
    ["clean"],
  ],
};
const QUILL_FORMATS = [
  "header", "bold", "italic", "underline", "strike",
  "list", "bullet", "align", "blockquote", "link", "video",
  "color", "background",
];

export default function CustomPostComposer() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    verse: "",
    reflection: "",
    hashtags: "",
    category: "Announcement",
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scheduleMode, setScheduleMode] = useState("now"); // "now" | "later"
  const [scheduledFor, setScheduledFor] = useState("");

  const minDateTime = useMemo(() => {
    const d = new Date(Date.now() + 60000); // +1 min
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const clearImage = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const resetForm = () => {
    setForm({ verse: "", reflection: "", hashtags: "", category: "Announcement" });
    clearImage();
    setScheduleMode("now");
    setScheduledFor("");
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      const hasContent = form.verse.trim() || (form.reflection && form.reflection.replace(/<[^>]*>/g, "").trim()) || file;
      if (!hasContent) throw new Error("Add a verse, reflection, or image.");
      if (scheduleMode === "later" && !scheduledFor) throw new Error("Pick a date & time to schedule.");
      if (scheduleMode === "later" && new Date(scheduledFor) <= new Date()) {
        throw new Error("Scheduled time must be in the future.");
      }

      let mediaUrl = null;
      if (file) {
        setUploading(true);
        const res = await base44.integrations.Core.UploadFile({ file });
        mediaUrl = res.file_url;
        setUploading(false);
      }

      const basePayload = {
        verse: form.verse || undefined,
        reflection: form.reflection || undefined,
        hashtags: form.hashtags || undefined,
        category: form.category || "Announcement",
        media_url: mediaUrl || undefined,
      };

      if (scheduleMode === "later") {
        return await base44.entities.ScheduledPost.create({
          ...basePayload,
          scheduled_for: new Date(scheduledFor).toISOString(),
          status: "scheduled",
        });
      }

      return await base44.entities.GlowDrop.create({
        ...basePayload,
        user_email: BRAND_EMAIL,
        status: "approved",
        likes_count: 0,
      });
    },
    onSuccess: () => {
      toast.success(scheduleMode === "later" ? "📅 Post scheduled" : "✨ Published as Generation LightMode");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["scheduledPosts"] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      queryClient.invalidateQueries({ queryKey: ["glowDropsFeed"] });
    },
    onError: (err) => {
      setUploading(false);
      toast.error(err.message || "Failed to publish");
    },
  });

  return (
    <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 space-y-5">
      {/* Brand identity header */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#FFD000]/10 to-[#FF9F1A]/10 border border-[#FFD000]/30 rounded-xl">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex-shrink-0">
          <img src={BRAND_LOGO} alt="LightMode" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-[#FFD000]">Generation LightMode</span>
            <Sparkles className="w-3.5 h-3.5 text-[#FFD000]" />
          </div>
          <div className="text-xs text-gray-400">Official brand post · visible to all users</div>
        </div>
      </div>

      {/* Verse */}
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">
          Bible Verse / Headline
        </Label>
        <Input
          placeholder="e.g. Matthew 5:14 or a bold headline"
          value={form.verse}
          onChange={(e) => setForm({ ...form, verse: e.target.value })}
          className="bg-[#0B0F1A] border-white/10 text-white placeholder-gray-600"
        />
      </div>

      {/* Rich text reflection */}
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">
          Reflection / Content (Rich Text)
        </Label>
        <div className="custom-quill-wrapper">
          <style>{`
            .custom-quill-wrapper .ql-toolbar {
              background: #0B0F1A;
              border-color: rgba(255,255,255,0.1) !important;
              border-top-left-radius: 0.5rem;
              border-top-right-radius: 0.5rem;
            }
            .custom-quill-wrapper .ql-container {
              background: #0B0F1A;
              border-color: rgba(255,255,255,0.1) !important;
              color: white;
              min-height: 200px;
              font-family: Inter, sans-serif;
              border-bottom-left-radius: 0.5rem;
              border-bottom-right-radius: 0.5rem;
            }
            .custom-quill-wrapper .ql-editor { min-height: 200px; color: white; }
            .custom-quill-wrapper .ql-editor.ql-blank::before { color: #4A5878; font-style: normal; }
            .custom-quill-wrapper .ql-stroke { stroke: #C8D0E0; }
            .custom-quill-wrapper .ql-fill { fill: #C8D0E0; }
            .custom-quill-wrapper .ql-picker-label { color: #C8D0E0; }
            .custom-quill-wrapper .ql-picker-options { background: #121826; border-color: rgba(255,255,255,0.1); }
            .custom-quill-wrapper .ql-picker-item { color: #C8D0E0; }
            .custom-quill-wrapper .ql-tooltip { background: #121826; border-color: rgba(255,255,255,0.15); color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
            .custom-quill-wrapper .ql-tooltip input { background: #0B0F1A; color: white; border: 1px solid rgba(255,255,255,0.1); }
          `}</style>
          <ReactQuill
            theme="snow"
            value={form.reflection}
            onChange={(html) => setForm({ ...form, reflection: html })}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder="Write rich, formatted content. Use the toolbar for bold, italic, lists, embeds..."
          />
        </div>
      </div>

      {/* Hashtags */}
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Hashtags</Label>
        <Input
          placeholder="#FaithAlwaysOn #GlowDrop"
          value={form.hashtags}
          onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
          className="bg-[#0B0F1A] border-white/10 text-[#FFD000] placeholder-gray-600"
        />
      </div>

      {/* Image */}
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">
          Image (Optional)
        </Label>
        {previewUrl ? (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              className="max-h-64 rounded-xl border border-white/10 object-cover"
              alt="preview"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition"
              type="button"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 bg-[#0B0F1A] border-2 border-dashed border-white/10 hover:border-[#00CFFF]/40 rounded-xl p-4 cursor-pointer transition">
            <ImageIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Click to upload an image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>

      {/* Category */}
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Category</Label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full bg-[#0B0F1A] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00CFFF]/40"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Schedule */}
      <div className="bg-[#0B0F1A] border border-white/10 rounded-xl p-4 space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">When to publish?</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScheduleMode("now")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              scheduleMode === "now"
                ? "bg-[#00CFFF] text-black"
                : "bg-[#121826] text-gray-400 border border-white/10 hover:text-white"
            }`}
          >
            <Send className="w-4 h-4 inline mr-1.5" /> Publish Now
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode("later")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              scheduleMode === "later"
                ? "bg-[#FFD000] text-black"
                : "bg-[#121826] text-gray-400 border border-white/10 hover:text-white"
            }`}
          >
            <CalendarIcon className="w-4 h-4 inline mr-1.5" /> Schedule for Later
          </button>
        </div>
        {scheduleMode === "later" && (
          <div>
            <Input
              type="datetime-local"
              value={scheduledFor}
              min={minDateTime}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="bg-[#121826] border-white/10 text-white"
            />
            <p className="text-[11px] text-gray-500 mt-1.5">
              Posts are checked every 5 minutes. Exact publish time may vary by up to 5 min.
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          <Sparkles className="w-3 h-3 inline mr-1 text-[#FFD000]" />
          Posts appear as <b className="text-[#FFD000]">Generation LightMode</b> (official brand).
        </p>
        <Button
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending || uploading}
          className={`h-11 px-6 font-bold shadow-lg ${
            scheduleMode === "later"
              ? "bg-gradient-to-r from-[#FFD000] to-[#FF9F1A] text-black shadow-yellow-500/20"
              : "bg-gradient-to-r from-[#00CFFF] to-[#0099FF] text-black shadow-cyan-500/20"
          }`}
        >
          {publishMutation.isPending || uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {scheduleMode === "later" ? "Scheduling..." : "Publishing..."}</>
          ) : scheduleMode === "later" ? (
            <><CalendarIcon className="w-4 h-4 mr-2" /> Schedule Post</>
          ) : (
            <><Send className="w-4 h-4 mr-2" /> Publish Now</>
          )}
        </Button>
      </div>
    </div>
  );
}