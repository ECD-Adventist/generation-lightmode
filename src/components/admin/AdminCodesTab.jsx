import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle,
  XCircle, Sparkles, Square, CheckSquare, ImagePlus
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Kit100BackgroundModal from "@/components/admin/Kit100BackgroundModal";

/* ─── Design tokens (match Feed/Profile light shell) ───────────────────────
   bg app:     #F6F8FC
   surface:    #FFFFFF
   border:     #E6ECF5 / #D6E4FF
   text:       #0B1B3D / #4A5878 / #8A97B5
   primary:    linear-gradient(90deg, #1FB8FF, #0B3FD9)
   accent:     #FFD000 / #FF9F1A (gold) for highlights
────────────────────────────────────────────────────────────────────────── */

// ─── Poster Preview ──────────────────────────────────────────────────────────
// Posters themselves remain dark (brand) — only the surrounding admin chrome is light.
function PosterPreview({ code, size = "full", sharedBackgroundUrl = "" }) {
  const isSmall = size === "small";
  const bg = code.poster_image_url || sharedBackgroundUrl;

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B1B3D 0%, #0B3FD9 100%)" }}>
      {bg && <img src={bg} alt={code.title || code.slogan_text} className="absolute inset-0 w-full h-full object-cover" />}
      {bg && <div className="absolute inset-0 bg-black/45" />}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 text-center">
        <div className={`${isSmall ? "text-xl" : "text-3xl"} mb-2`}>💯</div>
        <h3 className={`${isSmall ? "text-xs" : "text-lg"} font-black font-['Space_Grotesk'] text-white leading-tight drop-shadow`}>
          {code.title || code.slogan_text}
        </h3>
        {code.title && (
          <p className={`${isSmall ? "text-[10px]" : "text-xs"} text-white/80 mt-1 leading-snug drop-shadow`}>{code.slogan_text}</p>
        )}
        {code.bible_reference && (
          <p className={`${isSmall ? "text-[9px]" : "text-[11px]"} font-bold mt-2 px-2 py-0.5 rounded-full`}
            style={{ color: "#7CDBFF", border: "1px solid rgba(124,219,255,0.45)", background: "rgba(0,0,0,0.3)" }}>
            {code.bible_reference}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Status Chip (light mode) ───────────────────────────────────────────────
function StatusChip({ status }) {
  const s = status || "pending";
  const map = {
    approved: { bg: "rgba(34,197,94,0.1)", color: "#16A34A", border: "#BBF7D0", label: "Live" },
    rejected: { bg: "rgba(239,68,68,0.1)", color: "#DC2626", border: "#FECACA", label: "Rejected" },
    pending:  { bg: "rgba(255,208,0,0.15)", color: "#CC7A00", border: "#FFE4A0", label: "Pending" },
  }[s];
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ background: map.bg, color: map.color, border: `1px solid ${map.border}` }}>
      {map.label}
    </span>
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
  const [activeTab, setActiveTab] = useState("edit");

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

  const inputStyle = { background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(11,27,61,0.45)", backdropFilter: "blur(6px)" }}>
      <div className="rounded-[1.5rem] w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col"
        style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 24px 60px rgba(11,27,61,0.25)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
          <h3 className="text-xl font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>
            {code ? "Edit Poster" : "New Poster"}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl p-1" style={{ background: "#F0F4FA" }}>
              {["edit", "preview"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition"
                  style={activeTab === t
                    ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11,63,217,0.25)" }
                    : { color: "#6B7FA0", background: "transparent" }}>
                  {t === "edit" ? "Edit" : "Preview"}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-xl leading-none transition" style={{ color: "#8A97B5" }}>✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "preview" ? (
            <div className="flex flex-col md:flex-row gap-6 p-6 items-start">
              <div className="w-full md:w-72 flex-shrink-0">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden" style={{ border: "1px solid #E6ECF5", boxShadow: "0 8px 24px rgba(11,63,217,0.12)" }}>
                  <PosterPreview code={formData} sharedBackgroundUrl={sharedBackgroundUrl} />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                {[
                  { label: "Title", value: formData.title },
                  { label: "Slogan", value: `"${formData.slogan_text}"` },
                  { label: "Bible Reference", value: formData.bible_reference, accent: "#0B3FD9", prefix: "📖 " },
                  { label: "Category", value: formData.category, chip: true },
                  { label: "Source", value: formData.source_document === "keeping_it_100" ? "💯 Keeping It 100" : "🔐 Codes of Truth" },
                ].map((r, i) => r.value ? (
                  <div key={i}>
                    <div className="text-[10px] uppercase tracking-widest mb-1 font-bold" style={{ color: "#8A97B5" }}>{r.label}</div>
                    {r.chip ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full inline-block"
                        style={{ background: "rgba(255,208,0,0.15)", border: "1px solid #FFE4A0", color: "#CC7A00" }}>{r.value}</span>
                    ) : (
                      <div className={r.label === "Title" ? "text-xl font-black font-['Space_Grotesk']" : "text-base leading-relaxed"}
                        style={{ color: r.accent || "#0B1B3D" }}>
                        {r.prefix}{r.value}
                      </div>
                    )}
                  </div>
                ) : null)}
                <div>
                  <div className="text-[10px] uppercase tracking-widest mb-1 font-bold" style={{ color: "#8A97B5" }}>Status</div>
                  <StatusChip status={formData.status} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-0">
              {/* Form */}
              <div className="flex-1 p-6 space-y-4 border-r" style={{ borderColor: "#E6ECF5" }}>
                {[
                  { key: "title", label: "Title", placeholder: "E.g. Purity Is Power" },
                  { key: "bible_reference", label: "Bible Reference", placeholder: "Romans 12:2" },
                  { key: "category", label: "Category", placeholder: "E.g. Purity" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-wider mb-1 block font-bold" style={{ color: "#6B7FA0" }}>{f.label}</label>
                    <Input value={formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-1 block font-bold" style={{ color: "#6B7FA0" }}>Slogan Text *</label>
                  <textarea required value={formData.slogan_text} onChange={e => setFormData({ ...formData, slogan_text: e.target.value })}
                    placeholder="Stand Out, Don't Blend In."
                    className="w-full rounded-xl px-4 py-3 min-h-[90px] focus:outline-none text-sm resize-none"
                    style={{ ...inputStyle, boxShadow: "inset 0 1px 2px rgba(11,27,61,0.04)" }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-1 block font-bold" style={{ color: "#6B7FA0" }}>Source *</label>
                    <select value={formData.source_document} onChange={e => setFormData({ ...formData, source_document: e.target.value })}
                      className="w-full rounded-xl px-3 py-2.5 focus:outline-none text-sm" style={inputStyle}>
                      <option value="keeping_it_100">💯 Keeping It 100</option>
                      <option value="codes_of_truth">🔐 Codes of Truth</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-1 block font-bold" style={{ color: "#6B7FA0" }}>Status</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full rounded-xl px-3 py-2.5 focus:outline-none text-sm" style={inputStyle}>
                      <option value="pending">⏳ Pending</option>
                      <option value="approved">✅ Approved</option>
                      <option value="rejected">❌ Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Image panel */}
              <div className="w-full md:w-72 p-6 flex flex-col gap-4 flex-shrink-0" style={{ background: "#F8FAFD" }}>
                <label className="text-[10px] uppercase tracking-wider block font-bold" style={{ color: "#6B7FA0" }}>Poster Image</label>
                <div className="aspect-[4/5] rounded-xl overflow-hidden" style={{ border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11,63,217,0.08)" }}>
                  <PosterPreview code={formData} sharedBackgroundUrl={sharedBackgroundUrl} />
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleGenerateImage} disabled={isGenerating || !formData.slogan_text}
                    className="w-full font-bold text-sm" style={{ background: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)", color: "#0B1B3D", boxShadow: "0 4px 14px rgba(255,159,26,0.3)", border: "none" }}>
                    {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate with AI</>}
                  </Button>
                  <label className="w-full cursor-pointer">
                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl transition text-sm font-bold"
                      style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B3FD9" }}>
                      <ImageIcon className="w-4 h-4" />
                      {isUploading ? "Uploading..." : "Upload Image"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                  {formData.poster_image_url && (
                    <button onClick={handleRemoveImage} className="text-xs text-center py-1 hover:underline" style={{ color: "#DC2626" }}>
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "#E6ECF5", background: "#F8FAFD" }}>
          <Button variant="ghost" onClick={onClose} style={{ color: "#6B7FA0" }}>Cancel</Button>
          <Button onClick={() => onSave(formData)} disabled={!formData.slogan_text}
            className="font-bold px-8" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11,63,217,0.35)", border: "none" }}>
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
  const [modalCode, setModalCode] = useState(null);
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["adminCodesOfTruth", sourceFilter],
    queryFn: () => sourceFilter
      ? base44.entities.CodeOfTruth.filter({ source_document: sourceFilter }, '-created_date', 500)
      : base44.entities.CodeOfTruth.list('-created_date', 500),
    // Always refetch on mount so a freshly-seeded library never shows a stale empty state.
    staleTime: 0,
    refetchOnMount: "always",
  });

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

  const handleBulkApprove = async (ids) => {
    if (ids.size === 0) { toast.info("No posters selected"); return; }
    const toastId = toast.loading(`Approving ${ids.size} posters...`);
    await Promise.all([...ids].map(id => base44.entities.CodeOfTruth.update(id, { status: "approved" })));
    queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] });
    queryClient.invalidateQueries({ queryKey: ["codesOfTruth"] });
    setSelected(new Set());
    toast.success(`${ids.size} posters approved and live!`, { id: toastId });
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === visibleCodes.length) setSelected(new Set());
    else setSelected(new Set(visibleCodes.map(c => c.id)));
  };

  const pendingCount = codes.filter(c => (c.status || "pending") === "pending").length;
  const approvedCount = codes.filter(c => c.status === "approved").length;
  const rejectedCount = codes.filter(c => c.status === "rejected").length;

  // Shared light-mode button styles
  const primaryBtn = { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11,63,217,0.3)", border: "none" };
  const goldBtn = { background: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)", color: "#0B1B3D", boxShadow: "0 4px 14px rgba(255,159,26,0.3)", border: "none" };
  const ghostBtn = { background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D", boxShadow: "0 1px 2px rgba(11,63,217,0.04)" };
  const dangerBtn = { background: "#FFFFFF", border: "1px solid #FECACA", color: "#DC2626" };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="flex flex-wrap justify-between items-center gap-4 p-5 rounded-[1.5rem]"
        style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 20px rgba(11,63,217,0.06)" }}>
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{tabTitle || "Codes of Truth"}</h2>
          <p className="text-sm mt-0.5" style={{ color: "#6B7FA0" }}>Manage truth slogans & poster images.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pendingCount > 0 && (
            <Button onClick={() => handleBulkApprove(new Set(codes.filter(c => (c.status || "pending") === "pending").map(c => c.id)))}
              className="font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A", border: "1px solid #BBF7D0" }}>
              <CheckCircle className="w-4 h-4 mr-2" /> Approve All ({pendingCount})
            </Button>
          )}
          <Button onClick={() => setBgModalOpen(true)} className="font-bold" style={goldBtn}>
            <ImagePlus className="w-4 h-4 mr-2" /> Background
            {sharedBackgroundUrl && <span className="ml-2 w-2 h-2 rounded-full" style={{ background: "#16A34A" }} title="Background set" />}
          </Button>
          <Button onClick={() => setModalCode("new")} className="font-bold" style={primaryBtn}>
            <Plus className="w-4 h-4 mr-2" /> New Poster
          </Button>
          <Button
            onClick={async () => {
              if (!window.confirm(`Delete ALL ${codes.length} posters? This cannot be undone.`)) return;
              const toastId = toast.loading(`Deleting ${codes.length} posters...`);
              await Promise.all(codes.map(c => base44.entities.CodeOfTruth.delete(c.id)));
              queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] });
              toast.success(`All ${codes.length} posters deleted.`, { id: toastId });
            }}
            className="font-bold" style={dangerBtn}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete All
          </Button>
        </div>
      </div>

      {/* Filter tabs + bulk toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { k: "all", label: `All (${codes.length})` },
            { k: "pending", label: `Pending (${pendingCount})` },
            { k: "approved", label: `Live (${approvedCount})` },
            { k: "rejected", label: `Rejected (${rejectedCount})` },
          ].map(s => (
            <button key={s.k} onClick={() => setStatusFilter(s.k)}
              className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition"
              style={statusFilter === s.k
                ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11,63,217,0.25)" }
                : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}>
              {s.label}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-2"
            style={{ background: "#EEF3FF", border: "1px solid #D6E4FF" }}>
            <span className="font-bold text-sm" style={{ color: "#0B3FD9" }}>{selected.size} selected</span>
            <Button size="sm" onClick={() => handleBulkApprove(selected)}
              className="text-xs h-7" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A", border: "1px solid #BBF7D0" }}>
              <CheckCircle className="w-3 h-3 mr-1" /> Approve
            </Button>
            <button onClick={() => setSelected(new Set())} className="text-xs hover:underline" style={{ color: "#6B7FA0" }}>Clear</button>
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>
      ) : visibleCodes.length === 0 ? (
        <div className="text-center py-16 rounded-[1.5rem]" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF", color: "#6B7FA0" }}>No posters found.</div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-1">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-semibold transition" style={{ color: "#4A5878" }}>
              {selected.size === visibleCodes.length && visibleCodes.length > 0
                ? <CheckSquare className="w-4 h-4" style={{ color: "#0B3FD9" }} />
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
                  className="rounded-[1.25rem] overflow-hidden flex flex-col transition-all hover:-translate-y-0.5"
                  style={{
                    background: "#FFFFFF",
                    border: isSelected ? "2px solid #0B3FD9" : "1px solid #E6ECF5",
                    boxShadow: isSelected ? "0 8px 24px rgba(11,63,217,0.2)" : "0 4px 16px rgba(11,63,217,0.06)",
                  }}>
                  {/* Poster */}
                  <div className="aspect-[4/5] relative cursor-pointer" onClick={() => toggleSelect(code.id)}>
                    <PosterPreview code={code} size="small" sharedBackgroundUrl={sharedBackgroundUrl} />
                    {/* Checkbox */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center transition"
                      style={isSelected
                        ? { background: "#0B3FD9", color: "#FFFFFF" }
                        : { background: "rgba(255,255,255,0.9)", color: "#0B1B3D", border: "1px solid #FFFFFF" }}>
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    {/* Source */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
                      style={{ background: "rgba(255,255,255,0.95)", color: "#0B1B3D" }}>
                      {code.source_document === 'keeping_it_100' ? '💯' : '🔐'}
                    </div>
                    {/* Status */}
                    <div className="absolute bottom-2 right-2">
                      <StatusChip status={status} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-3 flex flex-col gap-2">
                    <div className="text-[10px] uppercase tracking-wider truncate font-bold" style={{ color: "#8A97B5" }}>{code.category || "Uncategorized"}</div>
                    <div className="text-sm font-semibold truncate" style={{ color: "#0B1B3D" }}>{code.title || code.slogan_text}</div>

                    {status === "pending" && (
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => base44.entities.CodeOfTruth.update(code.id, { status: "approved" }).then(() => { queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] }); toast.success("Approved!"); })}
                          className="flex-1 text-[11px] h-7" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" onClick={() => base44.entities.CodeOfTruth.update(code.id, { status: "rejected" }).then(() => { queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] }); toast.success("Rejected"); })}
                          className="h-7 w-7 p-0" style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid #FECACA" }}>
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {status === "approved" && (
                      <Button size="sm" onClick={() => base44.entities.CodeOfTruth.update(code.id, { status: "pending" }).then(() => { queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth", sourceFilter] }); })}
                        className="text-[11px] h-7" style={ghostBtn}>
                        Unpublish
                      </Button>
                    )}

                    <div className="flex gap-1.5 mt-1">
                      <Button size="sm" onClick={() => setModalCode(code)}
                        className="flex-1 text-[11px] h-7" style={{ background: "#EEF3FF", color: "#0B3FD9", border: "1px solid #D6E4FF" }}>
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(code.id)}
                        className="h-7 w-7 p-0" style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid #FECACA" }}>
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

      {/* Modals */}
      {modalCode !== null && (
        <CodeEditModal
          code={modalCode === "new" ? null : modalCode}
          sourceFilter={sourceFilter}
          onClose={() => setModalCode(null)}
          onSave={handleSave}
          sharedBackgroundUrl={sharedBackgroundUrl}
        />
      )}
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