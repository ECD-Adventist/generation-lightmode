import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const themes = [
  { id: "ocean", label: "Ocean", className: "from-[#00CFFF] to-[#1DA1FF]" },
  { id: "violet", label: "Violet", className: "from-[#8A5CFF] to-[#3B1E70]" },
  { id: "sunrise", label: "Sunrise", className: "from-[#FFD000] to-[#F97316]" },
  { id: "midnight", label: "Midnight", className: "from-[#121826] to-[#0B0F1A]" },
];

export default function StatusComposerModal({ isOpen, onClose, user }) {
  const [mode, setMode] = useState("status");
  const [text, setText] = useState("");
  const [theme, setTheme] = useState("ocean");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const reset = () => {
    setMode("status");
    setText("");
    setTheme("ocean");
    setFile(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (mode === "status" && !text.trim()) return toast.error("Write your status first");
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
    toast.success(mode === "image" ? "Photo status published" : "Status published");
    setSaving(false);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-[#121826] text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Publish Status</DialogTitle>
          <DialogDescription className="text-gray-400">Share a quick status or a photo update for the next 24 hours.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button type="button" onClick={() => setMode("status")} className={mode === "status" ? "bg-[#00CFFF] text-black" : "bg-white/5 text-white hover:bg-white/10"}>Text Status</Button>
          <Button type="button" onClick={() => setMode("image")} className={mode === "image" ? "bg-[#FFD000] text-black" : "bg-white/5 text-white hover:bg-white/10"}>Photo Status</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "status" ? (
            <>
              <div className={`rounded-3xl bg-gradient-to-br ${themes.find((item) => item.id === theme)?.className} p-6 min-h-[180px] flex items-center justify-center text-center`}>
                <p className="text-white text-xl font-bold leading-relaxed break-words">{text || "Your status preview"}</p>
              </div>

              <div className="space-y-2">
                <Label>Status text</Label>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What's on your heart today?" className="bg-[#0B0F1A] border-white/10 min-h-[120px]" />
              </div>

              <div className="space-y-2">
                <Label>Background</Label>
                <div className="grid grid-cols-4 gap-3">
                  {themes.map((item) => (
                    <button key={item.id} type="button" onClick={() => setTheme(item.id)} className={`h-12 rounded-2xl bg-gradient-to-br ${item.className} border ${theme === item.id ? "border-white" : "border-white/10"}`} title={item.label} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Upload image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-[#0B0F1A] border-white/10 file:mr-4 file:rounded-lg file:border file:border-white/10 file:bg-white/5 file:px-4 file:py-2" />
            </div>
          )}

          <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish now"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}