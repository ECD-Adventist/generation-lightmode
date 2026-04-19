import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle,
  XCircle, Wand2, Eye, Square, CheckSquare, Sparkles, ImagePlus
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Kit100BackgroundModal from "@/components/admin/Kit100BackgroundModal";

// ─── Poster Preview (used in both grid card and modal) ───────────────────────
// Renders: per-poster image (if set) → else shared background (if set) → else gradient fallback.
// Slogan/title/reference always overlay on top for quick visual scan.
function PosterPreview({ code, size = "full", sharedBackgroundUrl = "" }) {
  const isSmall = size === "small";
  const bg = code.poster_image_url || sharedBackgroundUrl;

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#0B0F1A] via-[#121826] to-[#0B0F1A]">
      {bg ? (
        <img src={bg} alt={code.title || code.slogan_text} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00CFFF]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8A5CFF]/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}
      {/* Readability overlay — stronger when we have an image behind */}
      {bg && <div className="absolute inset-0 bg-black/45" />}
      {/* Text overlay */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 text-center">
        <div className={`${isSmall ? "text-xl" : "text-3xl"} mb-2`}>💯</div>
        <h3 className={`${isSmall ? "text-xs" : "text-lg"} font-black font-['Space_Grotesk'] text-white leading-tight drop-shadow`}>
          {code.title || code.slogan_text}
        </h3>
        {code.title && (
          <p className={`${isSmall ? "text-[10px]" : "text-xs"} text-gray-200 mt-1 leading-snug drop-shadow`}>{code.slogan_text}</p>
        )}
        {code.bible_reference && (
          <p className={`${isSmall ? "text-[9px]" : "text-[11px]"} text-[#00CFFF] font-bold mt-2 border border-[#00CFFF]/40 bg-black/30 px-2 py-0.5 rounded-full`}>
            {code.bible_reference}
          </p>
        )}
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-30 z-10">
        <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/7e2f8baa1_FAVICON.png" alt="GLM" className="w-5 h-5 grayscale brightness-200" />
      </div>
    </div>
  );
}

// ─── Edit / Preview Modal ────────────────────────────────────────────────────
function CodeEditModal({ code, sourceFilter, onClose, onSave, sharedBackgroundUrl = "" }) {
  const [formData, setFormData] = useState({
    title: code?.title || "",
    slogan_text: code?.slogan_text || "",
    bible_reference: code?.bible_reference || "",
    category: code?.category || "",
    source_document: code?.source_document || sourceFilter || "keeping_it_100",
    poster_image_url: code?.poster_image_url || "",
    status: code?.status || "pending",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("edit"); // edit | preview

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const toastId = toast.loading("Uploading poster image...");
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, poster_image_url: res.file_url }));
      toast.success("Poster uploaded!", { id: toastId });
    } catch {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.slogan_text) { toast.error("Enter a slogan first"); return; }
    setIsGenerating(true);
    const toastId = toast.loading("Generating AI poster image...");
    try {
      const prompt = `A bold, modern faith-based social media poster for Generation LightMode youth movement. 
Dark background (#0B0F1A). Glowing cyan (#00CFFF) and gold (#FFD000) accents. 
Large bold text overlay: "${formData.title || formData.slogan_text}". 
${formData.bible_reference ? `Bible reference: ${formData.bible_reference}.` : ""}
${formData.category ? `Theme: ${formData.category}.` : ""}
Clean, Gen-Z Christian aesthetic. No white backgrounds. Portrait orientation 4:5.`;
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      setFormData(prev => ({ ...prev, poster_image_url: res.url }));
      toast.success("AI poster generated! ✨", { id: toastId });
    } catch {
      toast.error("Image generation failed", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = () => setFormData(prev => ({ ...prev, poster_image_url: "" }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#121826] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-xl font-bold font-['Space_Grotesk'] text-white">
            {code ? "Edit Poster" : "Add New Poster"}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 rounded-xl p-1">
              {["edit", "preview"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition ${activeTab === t ? "bg-[#00CFFF] text-black" : "text-gray-400 hover:text-white"}`}>
                  {t === "edit" ? "✏️ Edit" : "👁 Preview"}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "preview" ? (
            // ── PREVIEW TAB ──
            <div className="flex flex-col md:flex-row gap-6 p-6 items-start">
              {/* Poster preview */}
              <div className="w-full md:w-72 flex-shrink-0">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,207,255,0.1)]">
                  <PosterPreview code={formData} sharedBackgroundUrl={sharedBackgroundUrl} />
                </div>
              </div>
              {/* Metadata */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Title</div>
                  <div className="text-xl font-black text-white font-['Space_Grotesk']">{formData.title || <span className="text-gray-600">—</span>}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Slogan</div>
                  <div className="text-gray-200 text-base leading-relaxed">"{formData.slogan_text}"</div>
                </div>
                {formData.bible_reference && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Bible Reference</div>
                    <div className="text-[#00CFFF] font-bold">📖 {formData.bible_reference}</div>
                  </div>
                )}
                {formData.category && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Category</div>
                    <span className="bg-[#FFD000]/10 border border-[#FFD000]/30 text-[#FFD000] text-xs font-bold px-3 py-1 rounded-full">{formData.category}</span>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Source</div>
                  <div className="text-gray-300 text-sm">{formData.source_document === "keeping_it_100" ? "💯 Keeping It 100" : "🔐 Codes of Truth"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Status</div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${formData.status === "approved" ? "bg-green-500/20 text-green-400" : formData.status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {formData.status}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // ── EDIT TAB ──
            <div className="flex flex-col md:flex-row gap-0">
              {/* Left: form */}
              <div className="flex-1 p-6 space-y-4 border-r border-white/5">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Source Document *</label>
                  <select value={formData.source_document} onChange={e => setFormData({ ...formData, source_document: e.target.value })}
                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CFFF] text-sm">
                    <option value="keeping_it_100">💯 Keeping It 100</option>
                    <option value="codes_of_truth">🔐 Codes of Truth</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Title</label>
                  <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="E.g. Purity Is Power" className="bg-[#0B0F1A] border-white/10" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Slogan Text *</label>
                  <textarea required value={formData.slogan_text} onChange={e => setFormData({ ...formData, slogan_text: e.target.value })}
                    placeholder="Stand Out, Don't Blend In."
                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white min-h-[90px] focus:outline-none focus:border-[#00CFFF] text-sm resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Bible Reference</label>
                  <Input value={formData.bible_reference} onChange={e => setFormData({ ...formData, bible_reference: e.target.value })} placeholder="Romans 12:2" className="bg-[#0B0F1A] border-white/10" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Category</label>
                  <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="E.g. Purity" className="bg-[#0B0F1A] border-white/10" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CFFF] text-sm">
                    <option value="pending">⏳ Pending</option>
                    <option value="approved">✅ Approved</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>
              </div>

              {/* Right: image panel */}
              <div className="w-full md:w-72 p-6 flex flex-col gap-4 flex-shrink-0">
                <label className="text-xs text-gray-400 uppercase tracking-wider block">Poster Image</label>
                {/* Live preview */}
                <div className="aspect-[4/5] rounded-xl overflow-hidden border border-white/10 bg-[#0B0F1A]">
                  <PosterPreview code={formData} sharedBackgroundUrl={sharedBackgroundUrl} />
                </div>
                {/* Image actions */}
                <div className="flex flex-col gap-2">
                  <Button onClick={handleGenerateImage} disabled={isGenerating || !formData.slogan_text}
                    className="w-full bg-[#8A5CFF]/20 border border-[#8A5CFF]/40 text-[#8A5CFF] hover:bg-[#8A5CFF]/30 font-bold text-sm">
                    {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate with AI</>}
                  </Button>
                  <label className="w-full cursor-pointer">
                    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm text-gray-300 font-bold">
                      <ImageIcon className="w-4 h-4" />
                      {isUploading ? "Uploading..." : "Upload Image"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                  {formData.poster_image_url && (
                    <button onClick={handleRemoveImage} className="text-xs text-red-400 hover:text-red-300 text-center py-1">
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-[#0B0F1A]/50">
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button onClick={() => onSave(formData)} disabled={!formData.slogan_text} className="bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80 font-bold px-8">
            Save Poster
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Tab ────────────────────────────────────────────────────────────────
export default function AdminCodesTab({ sourceFilter, title: tabTitle }) {
  const queryClient = useQueryClient();
  const [modalCode, setModalCode] = useState(null);   // null = closed, "new" = new, or a code object
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["adminCodesOfTruth", sourceFilter],
    queryFn: () => sourceFilter
      ? base44.entities.CodeOfTruth.filter({ source_document: sourceFilter }, '-created_date')
      : base44.entities.CodeOfTruth.list('-created_date'),
  });

  // Shared background for this section
  const { data: settingsList = [] } = useQuery({
    queryKey: ["kit100Settings", sourceFilter],
    queryFn: () => base44.entities.Kit100Settings.filter({ scope: sourceFilter || "keeping_it_100" }),
  });
  const settings = settingsList[0] || null;
  const sharedBackgroundUrl = settings?.background_url || "";

  const visibleCodes = codes.filter(c => statusFilter === "all" || (c.status || "pending") === statusFilter);

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }) => id
      ? base44.entities.CodeOfTruth.update(id, data)
      : base44.entities.CodeOfTruth.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] });
      toast.success("Poster saved!");
      setModalCode(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CodeOfTruth.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] });
      toast.success("Deleted");
    }
  });

  const handleSave = (formData) => {
    const isNew = modalCode === "new";
    saveMutation.mutate({ id: isNew ? null : modalCode.id, data: formData });
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this poster?")) deleteMutation.mutate(id);
  };

  // Bulk approve
  const handleBulkApprove = async (ids) => {
    if (ids.size === 0) { toast.info("No posters selected"); return; }
    const toastId = toast.loading(`Approving ${ids.size} posters...`);
    await Promise.all([...ids].map(id => base44.entities.CodeOfTruth.update(id, { status: "approved" })));
    queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] });
    queryClient.invalidateQueries({ queryKey: ["codesOfTruth"] });
    setSelected(new Set());
    toast.success(`✅ ${ids.size} posters approved and live!`, { id: toastId });
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === visibleCodes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleCodes.map(c => c.id)));
    }
  };

  const pendingCount = codes.filter(c => (c.status || "pending") === "pending").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#121826] p-5 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">{tabTitle || "Codes of Truth"}</h2>
          <p className="text-gray-400 text-sm mt-0.5">Manage truth slogans & poster images.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pendingCount > 0 && (
            <Button onClick={() => handleBulkApprove(new Set(codes.filter(c => (c.status || "pending") === "pending").map(c => c.id)))}
              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 font-bold">
              <CheckCircle className="w-4 h-4 mr-2" /> Approve All Pending ({pendingCount})
            </Button>
          )}
          <Button onClick={() => setBgModalOpen(true)} className="bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80 font-bold">
            <ImagePlus className="w-4 h-4 mr-2" /> Background
            {sharedBackgroundUrl && <span className="ml-2 w-2 h-2 rounded-full bg-green-400" title="Background set" />}
          </Button>
          <Button onClick={() => setModalCode("new")} className="bg-white/5 text-white hover:bg-white/10 border border-white/10 font-bold">
            <Plus className="w-4 h-4 mr-2" /> New Poster
          </Button>
          <Button
            onClick={async () => {
              if (!window.confirm(`Delete ALL ${codes.length} posters in this section? This cannot be undone.`)) return;
              const toastId = toast.loading(`Deleting ${codes.length} posters...`);
              await Promise.all(codes.map(c => base44.entities.CodeOfTruth.delete(c.id)));
              queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] });
              toast.success(`🗑️ All ${codes.length} posters deleted.`, { id: toastId });
            }}
            className="bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 font-bold"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete All
          </Button>
        </div>
      </div>

      {/* Filter tabs + bulk toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "approved", "rejected"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${statusFilter === s ? "bg-[#00CFFF] text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
              {s === "all" ? `All (${codes.length})`
                : s === "pending" ? `⏳ Pending (${codes.filter(c => (c.status || "pending") === "pending").length})`
                : s === "approved" ? `✅ Approved (${codes.filter(c => c.status === "approved").length})`
                : `❌ Rejected (${codes.filter(c => c.status === "rejected").length})`}
            </button>
          ))}
        </div>

        {/* Bulk selection toolbar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-[#00CFFF]/10 border border-[#00CFFF]/30 rounded-xl px-4 py-2">
            <span className="text-[#00CFFF] font-bold text-sm">{selected.size} selected</span>
            <Button size="sm" onClick={() => handleBulkApprove(selected)}
              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 text-xs h-7">
              <CheckCircle className="w-3 h-3 mr-1" /> Approve Selected
            </Button>
            <button onClick={() => setSelected(new Set())} className="text-gray-400 hover:text-white text-xs">Clear</button>
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>
      ) : visibleCodes.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-[#121826]/50 rounded-2xl border border-white/5">No posters found.</div>
      ) : (
        <>
          {/* Select all row */}
          <div className="flex items-center gap-3 px-1">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition">
              {selected.size === visibleCodes.length && visibleCodes.length > 0
                ? <CheckSquare className="w-4 h-4 text-[#00CFFF]" />
                : <Square className="w-4 h-4" />}
              Select All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleCodes.map(code => {
              const status = code.status || "pending";
              const isSelected = selected.has(code.id);
              return (
                <div key={code.id}
                  className={`bg-[#121826] border rounded-2xl overflow-hidden flex flex-col transition-all ${isSelected ? "border-[#00CFFF]/60 ring-2 ring-[#00CFFF]/30" : status === "approved" ? "border-green-500/25" : status === "rejected" ? "border-red-500/20" : "border-yellow-500/20"}`}>
                  {/* Poster */}
                  <div className="aspect-[4/5] relative cursor-pointer" onClick={() => toggleSelect(code.id)}>
                    <PosterPreview code={code} size="small" sharedBackgroundUrl={sharedBackgroundUrl} />
                    {/* Checkbox overlay */}
                    <div className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center transition ${isSelected ? "bg-[#00CFFF] text-black" : "bg-black/50 text-white border border-white/30"}`}>
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    {/* Source badge */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold text-white uppercase">
                      {code.source_document === 'keeping_it_100' ? '💯' : '🔐'}
                    </div>
                    {/* Status badge */}
                    <div className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${status === "approved" ? "bg-green-500/80 text-white" : status === "rejected" ? "bg-red-500/80 text-white" : "bg-yellow-500/80 text-black"}`}>
                      {status === "approved" ? "✅ Live" : status === "rejected" ? "❌" : "⏳ Pending"}
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="p-3 flex flex-col gap-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wider truncate">{code.category || "Uncategorized"}</div>
                    <div className="text-sm font-semibold text-white truncate">{code.title || code.slogan_text}</div>

                    {/* Quick approve for pending */}
                    {status === "pending" && (
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => base44.entities.CodeOfTruth.update(code.id, { status: "approved" }).then(() => { queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] }); toast.success("Approved!"); })}
                          className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 text-[11px] h-7">
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" onClick={() => base44.entities.CodeOfTruth.update(code.id, { status: "rejected" }).then(() => { queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] }); toast.success("Rejected"); })}
                          className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 h-7 w-7 p-0">
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {status === "approved" && (
                      <Button size="sm" onClick={() => base44.entities.CodeOfTruth.update(code.id, { status: "pending" }).then(() => { queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] }); })}
                        className="bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10 text-[11px] h-7">
                        Unpublish
                      </Button>
                    )}

                    {/* Edit / Delete */}
                    <div className="flex gap-1.5 mt-1">
                      <Button size="sm" onClick={() => setModalCode(code)}
                        className="flex-1 bg-[#00CFFF]/10 border border-[#00CFFF]/20 text-[#00CFFF] hover:bg-[#00CFFF]/20 text-[11px] h-7">
                        <Edit2 className="w-3 h-3 mr-1" /> Edit / Preview
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(code.id)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-0 h-7 w-7 p-0">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Edit/Create Modal */}
      {modalCode !== null && (
        <CodeEditModal
          code={modalCode === "new" ? null : modalCode}
          sourceFilter={sourceFilter}
          onClose={() => setModalCode(null)}
          onSave={handleSave}
          sharedBackgroundUrl={sharedBackgroundUrl}
        />
      )}

      {/* Shared Background Modal */}
      {bgModalOpen && (
        <Kit100BackgroundModal
          settings={settings}
          sourceFilter={sourceFilter}
          onClose={() => setBgModalOpen(false)}
        />
      )}
    </div>
  );
}