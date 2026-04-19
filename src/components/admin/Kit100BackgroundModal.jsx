import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Image as ImageIcon, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Focused modal — admin sets ONE shared background used across all Keep It 100 posters.
export default function Kit100BackgroundModal({ settings, sourceFilter, onClose }) {
  const queryClient = useQueryClient();
  const [bgUrl, setBgUrl] = useState(settings?.background_url || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const label = sourceFilter === "keeping_it_100" ? "Keep It 100" : "Codes of Truth";

  const saveMutation = useMutation({
    mutationFn: async (newUrl) => {
      const filter = { scope: sourceFilter || "keeping_it_100" };
      const existing = await base44.entities.Kit100Settings.filter(filter);
      if (existing.length > 0) {
        return base44.entities.Kit100Settings.update(existing[0].id, { ...filter, background_url: newUrl });
      }
      return base44.entities.Kit100Settings.create({ ...filter, background_url: newUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kit100Settings", sourceFilter] });
      toast.success("Background updated — applied to all posters ✨");
      onClose();
    },
    onError: () => toast.error("Failed to save background"),
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const tid = toast.loading("Uploading background...");
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setBgUrl(res.file_url);
      toast.success("Background uploaded — click Save to apply", { id: tid });
    } catch {
      toast.error("Upload failed", { id: tid });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const tid = toast.loading("Generating AI background...");
    try {
      const prompt = `A bold, modern abstract background for a Christian youth social-media poster — Generation LightMode ${label}.
Deep dark navy (#0B0F1A) base with glowing cyan (#00CFFF), violet (#8A5CFF) and gold (#FFD000) light streaks and soft bokeh.
No text, no logos, no people. Portrait 4:5 orientation. Cinematic, Gen-Z, faith-forward aesthetic. High contrast, leaves negative space in the center for overlaid text.`;
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      setBgUrl(res.url);
      toast.success("AI background generated — click Save to apply ✨", { id: tid });
    } catch {
      toast.error("Generation failed", { id: tid });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#121826] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h3 className="text-xl font-bold font-['Space_Grotesk'] text-white">Shared Background</h3>
            <p className="text-xs text-gray-400 mt-0.5">One image, applied to every {label} poster.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col md:flex-row gap-6">
          {/* Preview */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="aspect-[4/5] rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0B0F1A] via-[#121826] to-[#0B0F1A] relative">
              {bgUrl ? (
                <img src={bgUrl} alt="Background preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">No background set</div>
              )}
              {/* Overlay mock to show how text will sit on top */}
              {bgUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/35">
                  <div className="text-2xl mb-1">💯</div>
                  <div className="text-white text-sm font-black font-['Space_Grotesk']">Sample Slogan</div>
                  <div className="text-[10px] text-[#00CFFF] font-bold mt-1 border border-[#00CFFF]/40 px-2 py-0.5 rounded-full">Reference</div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-1 flex flex-col gap-3">
            <Button onClick={handleGenerate} disabled={isGenerating}
              className="w-full bg-[#8A5CFF]/20 border border-[#8A5CFF]/40 text-[#8A5CFF] hover:bg-[#8A5CFF]/30 font-bold">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate with AI</>}
            </Button>
            <label className="w-full cursor-pointer">
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm text-gray-300 font-bold">
                <ImageIcon className="w-4 h-4" />
                {isUploading ? "Uploading..." : "Upload Image"}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
            </label>
            {bgUrl && (
              <button onClick={() => setBgUrl("")} className="flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 py-1">
                <Trash2 className="w-3 h-3" /> Clear background
              </button>
            )}
            <div className="mt-2 text-[11px] text-gray-500 leading-relaxed">
              This background appears behind every poster in <span className="text-white font-semibold">{label}</span> that doesn't have its own custom image. Slogan & reference text overlay on top automatically.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-[#0B0F1A]/50">
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button onClick={() => saveMutation.mutate(bgUrl)} disabled={saveMutation.isPending}
            className="bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80 font-bold px-8">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Background"}
          </Button>
        </div>
      </div>
    </div>
  );
}