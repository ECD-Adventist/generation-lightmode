import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Upload, Link2, CheckCircle2, AlertCircle, HardDrive, Trash2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import DrivePickerModal from "./DrivePickerModal";
import { CONTENT_TYPES, CONTENT_LANGUAGES, CONTENT_CATEGORIES, categoryMeta } from "@/components/content-hub/contentConstants";
import GlobalTimePreview from "./GlobalTimePreview";

function extractDriveId(link) {
  const str = String(link || "");
  const m = str.match(/\/file\/d\/([\w-]+)/) || str.match(/[?&]id=([\w-]+)/) || str.match(/\/d\/([\w-]+)/);
  return m ? m[1] : null;
}

const emptyForm = { title: "", description: "", content_type: "video", category: "evangelistic_videos", language: "English", drive_link: "", mobile_drive_link: "", thumbnail_url: "", date: "", time: "09:00" };

export default function ContentFormModal({ open, onClose, onSaved, item, defaultDate }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [thumbnailSuggestion, setThumbnailSuggestion] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setThumbnailSuggestion("");
    if (item) {
      const d = new Date(item.scheduled_at);
      setForm({
        title: item.title || "", description: item.description || "",
        content_type: item.content_type || "video",
        category: item.category || CONTENT_CATEGORIES.find(c => c.type === (item.content_type || "video"))?.id || "evangelistic_videos",
        language: item.language || "English",
        drive_link: item.drive_link || "", mobile_drive_link: item.mobile_drive_link || "",
        thumbnail_url: item.thumbnail_url || "",
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      });
    } else {
      setForm({ ...emptyForm, date: defaultDate || "" });
    }
  }, [open, item, defaultDate]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const driveId = extractDriveId(form.drive_link);
  const mobileDriveId = extractDriveId(form.mobile_drive_link);
  // Posters are resized by Google automatically, so a manual copy is only needed for video.
  const autoResizes = form.content_type === "poster";

  const handleDrivePick = (file) => {
    const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    const inferredType = file.mime_type?.startsWith("video/")
      ? "video"
      : file.mime_type?.startsWith("image/")
        ? "poster"
        : form.content_type;
    const typeLabel = CONTENT_TYPES.find(type => type.id === inferredType)?.label || "Resource";
    const suggestedTitle = /^\d+$/.test(baseName)
      ? `All Things New ${typeLabel} ${baseName}`
      : baseName || `All Things New ${typeLabel}`;
    const suggestedDescription = file.description?.trim() || `${suggestedTitle} is an All Things New ${typeLabel.toLowerCase()} resource ready to download and share.`;

    // Picking a new file replaces all of its details, so the entry matches the new content.
    setForm(f => ({
      ...f,
      drive_link: file.link,
      title: suggestedTitle,
      description: suggestedDescription,
      content_type: inferredType,
      category: categoryMeta(f.category)?.type === inferredType
        ? f.category
        : CONTENT_CATEGORIES.find(c => c.type === inferredType)?.id || f.category,
      thumbnail_url: "",
    }));
    setThumbnailSuggestion(file.thumbnail_link || "");
    toast.success(`Selected "${file.name}" and updated its details`);
  };

  const handleThumbnail = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("thumbnail_url", file_url);
    setThumbnailSuggestion("");
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.drive_link.trim() || !form.date || !form.time) {
      toast.error("Title, Drive link, date and time are required");
      return;
    }
    if (!driveId) {
      toast.error("That doesn't look like a valid Google Drive link");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        content_type: form.content_type,
        category: form.category,
        language: form.language,
        drive_link: form.drive_link.trim(),
        mobile_drive_link: form.mobile_drive_link.trim(),
        thumbnail_url: form.thumbnail_url,
        scheduled_at: new Date(`${form.date}T${form.time}`).toISOString(),
      };
      const res = await base44.functions.invoke("saveDigitalContent", { id: item?.id, data: payload });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(item ? "Content updated" : "Content scheduled");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!item || !window.confirm(`Delete "${item.title}"?`)) return;
    setDeleting(true);
    await base44.functions.invoke("saveDigitalContent", { id: item.id, action: "delete" });
    toast.success("Content deleted");
    onSaved();
    onClose();
  };

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-[#0E1524] border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk']">{item ? "Edit Content" : "Schedule New Content"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white/60 mb-1 block">Title *</label>
            <input className={inputCls} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Faith Always On — Episode 1" />
          </div>

          <div>
            <label className="text-xs font-bold text-white/60 mb-1 block">Description</label>
            <textarea className={inputCls} rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short description shown to users" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-white/60 mb-1 block">Category *</label>
              <select className={inputCls} value={form.category}
                onChange={e => {
                  const category = e.target.value;
                  setForm(f => ({ ...f, category, content_type: categoryMeta(category)?.type || f.content_type }));
                }}>
                {CONTENT_CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-[#0E1524]">{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-white/60 mb-1 block">Language *</label>
              <select className={inputCls} value={form.language} onChange={e => set("language", e.target.value)}>
                {CONTENT_LANGUAGES.map(l => <option key={l} value={l} className="bg-[#0E1524]">{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-white/60 flex items-center gap-1.5"><Link2 size={12} /> Google Drive File *</label>
              <button type="button" onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition active:scale-95"
                style={{ background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.35)", color: "#00CFFF" }}>
                <HardDrive size={11} /> Browse Drive
              </button>
            </div>
            <input className={inputCls} value={form.drive_link} onChange={e => set("drive_link", e.target.value)} placeholder="Browse Drive, or paste a link" />
            {form.drive_link && (
              driveId
                ? <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Valid Drive link — users will download directly</p>
                : <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} /> Could not find a file ID in this link</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-white/60 flex items-center gap-1.5"><Smartphone size={12} /> Mobile Version (optional)</label>
              <button type="button" onClick={() => setMobilePickerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition active:scale-95"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", color: "#10B981" }}>
                <HardDrive size={11} /> Browse Drive
              </button>
            </div>
            <input className={inputCls} value={form.mobile_drive_link} onChange={e => set("mobile_drive_link", e.target.value)} placeholder="Compressed copy for phone users" />
            {form.mobile_drive_link
              ? (mobileDriveId
                  ? <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Offered as the lighter download when it's smaller than the original</p>
                  : <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} /> Could not find a file ID in this link</p>)
              : <p className="text-[10px] text-white/40 mt-1">
                  {autoResizes
                    ? "Not needed for posters — a phone-sized image is generated automatically."
                    : "Upload a compressed copy to Drive and select it here to give phone users a lighter download."}
                </p>}
          </div>

          <div>
            <label className="text-xs font-bold text-white/60 mb-1 block">Thumbnail</label>
            {thumbnailSuggestion && !form.thumbnail_url && (
              <div className="mb-3 rounded-xl p-3 bg-cyan-400/5 border border-cyan-400/20">
                <div className="flex items-center gap-3">
                  <img src={thumbnailSuggestion} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="Suggested thumbnail from Google Drive" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Use this thumbnail from the content?</p>
                    <p className="text-[10px] text-white/45 mt-0.5">Approve it, or upload a different image.</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => { set("thumbnail_url", thumbnailSuggestion); setThumbnailSuggestion(""); }}
                    className="flex-1 py-2 rounded-lg text-[11px] font-bold bg-cyan-400 text-[#0B0F1A]">Use suggested</button>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex-1 py-2 rounded-lg text-[11px] font-bold bg-white/5 border border-white/10">Upload different</button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              {form.thumbnail_url && <img src={form.thumbnail_url} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="Selected thumbnail" />}
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {form.thumbnail_url ? "Replace thumbnail" : thumbnailSuggestion ? "Upload different" : "Upload thumbnail"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-white/60 mb-1 block">Global Release Date *</label>
              <input type="date" className={inputCls} value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-white/60 mb-1 block">Time in Your Timezone *</label>
              <input type="time" className={inputCls} value={form.time} onChange={e => set("time", e.target.value)} />
            </div>
          </div>

          <GlobalTimePreview date={form.date} time={form.time} />

          <div className="flex gap-2">
            {item && (
              <button onClick={handleDelete} disabled={deleting || saving}
                className="px-4 py-3 rounded-xl font-black text-sm transition active:scale-[0.98] disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171" }}>
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            )}
            <button type="button" onClick={handleSave} disabled={saving || deleting}
              className="flex-1 py-3 rounded-xl font-black text-sm font-['Space_Grotesk'] transition active:scale-[0.98] disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", color: "#0B0F1A" }}>
              {saving ? "Saving…" : item ? "Save Changes" : "Schedule Content"}
            </button>
          </div>
        </div>
        <DrivePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={handleDrivePick} />
        {/* Picking the mobile copy only sets its link — the item's own details stay untouched. */}
        <DrivePickerModal open={mobilePickerOpen} onClose={() => setMobilePickerOpen(false)}
          onPick={(file) => { set("mobile_drive_link", file.link); toast.success(`Mobile version set to "${file.name}"`); }} />
      </DialogContent>
    </Dialog>
  );
}