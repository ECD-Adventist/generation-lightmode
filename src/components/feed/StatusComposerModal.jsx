import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ImagePlus, Type, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const themes = [
  { id: "ocean", className: "from-[#00CFFF] to-[#1DA1FF]" },
  { id: "violet", className: "from-[#8A5CFF] to-[#3B1E70]" },
  { id: "sunrise", className: "from-[#FFD000] to-[#F97316]" },
  { id: "midnight", className: "from-[#121826] to-[#0B0F1A] border border-white/10" },
  { id: "emerald", className: "from-[#10B981] to-[#065F46]" },
  { id: "rose", className: "from-[#F43F5E] to-[#9F1239]" },
];

export default function StatusComposerModal({ isOpen, onClose, user }) {
  const [mode, setMode] = useState("status");
  const [text, setText] = useState("");
  const [theme, setTheme] = useState("ocean");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const reset = () => { setMode("status"); setText(""); setTheme("ocean"); setFile(null); setPreview(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const removeImage = () => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (mode === "status" && !text.trim()) return toast.error("Write something first");
    if (mode === "image" && !file) return toast.error("Choose an image first");

    setSaving(true);
    let mediaUrl = "";
    if (mode === "image") {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      mediaUrl = uploadRes.file_url;
    }

    await base44.entities.Story.create({
      user_email: user.email,
      story_type: mode === "image" ? "image" : "status",
      media_url: mediaUrl,
      text_content: mode === "status" ? text.trim() : "",
      background_theme: theme,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    queryClient.invalidateQueries({ queryKey: ["activeStories"] });
    toast.success("Status published! ✨");
    setSaving(false);
    handleClose();
  };

  const activeTheme = themes.find(t => t.id === theme)?.className || themes[0].className;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#0B0F1A] text-white border-white/10 p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-xl font-black" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Create Status</DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">Visible for 24 hours</DialogDescription>
          </DialogHeader>

          {/* Mode Toggle */}
          <div className="flex bg-[#121826] rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setMode("status")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === "status" ? "bg-[#00CFFF] text-black shadow-[0_0_12px_rgba(0,207,255,0.3)]" : "text-gray-400 hover:text-white"}`}
            >
              <Type className="w-4 h-4" /> Text
            </button>
            <button
              type="button"
              onClick={() => setMode("image")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === "image" ? "bg-[#FFD000] text-black shadow-[0_0_12px_rgba(255,208,0,0.3)]" : "text-gray-400 hover:text-white"}`}
            >
              <ImagePlus className="w-4 h-4" /> Photo
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {mode === "status" ? (
            <>
              {/* Live Preview */}
              <div className={`rounded-2xl bg-gradient-to-br ${activeTheme} p-6 min-h-[200px] flex items-center justify-center text-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                <p className="text-white text-xl font-bold leading-relaxed break-words relative z-10 drop-shadow-md" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {text || "What's on your heart?"}
                </p>
              </div>

              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 200))}
                placeholder="Share what's on your heart..."
                className="bg-[#121826] border-white/10 min-h-[80px] text-white placeholder:text-gray-600 resize-none"
                maxLength={200}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600">{text.length}/200</span>
              </div>

              {/* Theme picker */}
              <div>
                <Label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Background</Label>
                <div className="flex gap-2">
                  {themes.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.className} transition-all ${theme === t.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#0B0F1A] scale-110" : "opacity-60 hover:opacity-100"}`}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              {preview ? (
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <img src={preview} alt="Preview" className="w-full max-h-[300px] object-contain" />
                  <button type="button" onClick={removeImage} className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-[200px] rounded-2xl border-2 border-dashed border-white/10 bg-[#121826] flex flex-col items-center justify-center gap-3 hover:border-[#00CFFF]/40 hover:bg-[#00CFFF]/5 transition cursor-pointer"
                >
                  <ImagePlus className="w-10 h-10 text-gray-500" />
                  <span className="text-sm text-gray-400 font-medium">Tap to select a photo</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-black py-6 rounded-xl text-base shadow-[0_0_20px_rgba(0,207,255,0.3)] hover:shadow-[0_0_30px_rgba(0,207,255,0.5)] transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Status"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}