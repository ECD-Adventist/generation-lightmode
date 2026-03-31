import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { X, Upload, Loader2, Image } from "lucide-react";
import { toast } from "sonner";

export default function TerritoryPhotoUploadModal({ user, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [eventName, setEventName] = useState("");
  const [territory, setTerritory] = useState(user?.country || "");
  const [uploading, setUploading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleSubmit = async () => {
    if (!file) { toast.error("Please select a photo"); return; }
    if (!territory.trim()) { toast.error("Please enter your territory / country"); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.TerritoryPhoto.create({
        user_email: user.email,
        photo_url: file_url,
        caption: caption.trim(),
        event_name: eventName.trim(),
        territory: territory.trim(),
        status: "pending",
      });
      onUploaded();
    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0B0F1A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-lg font-black font-['Space_Grotesk'] text-white">Share a Moment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Photo picker */}
          <label className="block cursor-pointer">
            {preview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={preview} className="w-full max-h-64 object-cover rounded-xl" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition rounded-xl">
                  <span className="text-white text-sm font-bold">Change Photo</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/15 rounded-xl h-40 flex flex-col items-center justify-center gap-2 hover:border-[#00CFFF]/40 hover:bg-[#00CFFF]/5 transition">
                <Image className="w-8 h-8 text-gray-600" />
                <span className="text-sm text-gray-500">Click to select a photo</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>

          {/* Territory */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Territory / Country <span className="text-red-400">*</span></label>
            <input
              value={territory}
              onChange={e => setTerritory(e.target.value)}
              placeholder="e.g. Kenya, Nairobi Region"
              className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 text-sm"
            />
          </div>

          {/* Event name */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Event Name <span className="text-gray-600">(optional)</span></label>
            <input
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              placeholder="e.g. Youth Camp 2026, Community Outreach"
              className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 text-sm"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Caption <span className="text-gray-600">(optional)</span></label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Describe this moment..."
              rows={2}
              maxLength={200}
              className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 text-sm resize-none"
            />
          </div>

          <p className="text-[11px] text-gray-500 bg-[#121826] rounded-xl px-4 py-3 border border-white/5">
            📋 Your photo will be reviewed by a leader before appearing in the feed.
          </p>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleSubmit}
            disabled={uploading || !file}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-black h-12 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Submit for Review</>}
          </button>
        </div>
      </div>
    </div>
  );
}