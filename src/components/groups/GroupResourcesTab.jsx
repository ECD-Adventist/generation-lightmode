import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import { BookOpen, Plus, Pin, PinOff, Trash2, ExternalLink, FileText, Link as LinkIcon, Video, FileIcon, Image as ImageIcon, X, Loader2, Search, Filter } from "lucide-react";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";

const CATEGORIES = ["All", "Study Guides", "Devotionals", "Sermons", "Worship", "Prayer", "Training", "General"];
const TYPE_ICONS = {
  pdf: <FileText className="w-4 h-4" />,
  link: <LinkIcon className="w-4 h-4" />,
  study_guide: <BookOpen className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  document: <FileIcon className="w-4 h-4" />,
  image: <ImageIcon className="w-4 h-4" />,
};
const TYPE_COLORS = {
  pdf: "#DC2626",
  link: "#0B3FD9",
  study_guide: "#16A34A",
  video: "#7C3AED",
  document: "#CC7A00",
  image: "#1FB8FF",
};

export default function GroupResourcesTab({ group, currentUser, isLeader, myMembership }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["groupResources", group.id],
    queryFn: () => base44.entities.GlowGroupResource.filter({ group_id: group.id }, "-created_date"),
    enabled: !!group?.id,
  });

  // Only leaders, moderators, coordinators, and scribes can add resources
  const ADD_ROLES = new Set(["moderator", "coordinator", "scribe"]);
  const canAddResources = isLeader || (myMembership && ADD_ROLES.has(myMembership.role));
  const canManage = (res) => isLeader || res.added_by === currentUser?.email || res.created_by === currentUser?.email;

  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }) => base44.entities.GlowGroupResource.update(id, { pinned }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groupResources", group.id] }); },
    onError: () => toast.error("Failed to update pin"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => base44.entities.GlowGroupResource.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groupResources", group.id] }); toast.success("Resource removed"); },
    onError: () => toast.error("Failed to delete"),
  });

  const { pinned, unpinned } = useMemo(() => {
    const filtered = resources.filter(r => {
      if (category !== "All" && r.category !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!(r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
    return {
      pinned: filtered.filter(r => r.pinned),
      unpinned: filtered.filter(r => !r.pinned),
    };
  }, [resources, category, search]);

  const ResourceCard = ({ res }) => {
    const link = res.file_url || res.url;
    const Icon = TYPE_ICONS[res.resource_type] || TYPE_ICONS.link;
    const color = TYPE_COLORS[res.resource_type] || "#0B3FD9";
    return (
      <div className="rounded-xl p-4 transition hover:-translate-y-0.5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}12`, color, border: `1px solid ${color}33` }}>
            {Icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{res.title}</div>
              {res.pinned && <Pin className="w-3.5 h-3.5 shrink-0" style={{ color: "#CC7A00" }} />}
            </div>
            {res.description && <div className="text-xs mt-1 line-clamp-2" style={{ color: "#4A5878" }}>{res.description}</div>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>{res.category || "General"}</span>
              <span className="text-[10px]" style={{ color: "#8A97B5" }}>{res.created_date ? format(new Date(res.created_date), "MMM d, yyyy") : ""}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "#F0F4FA" }}>
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF" }}>
              <ExternalLink className="w-3.5 h-3.5" /> Open
            </a>
          )}
          {canManage(res) && (
            <>
              <button onClick={() => pinMutation.mutate({ id: res.id, pinned: !res.pinned })} className="w-9 h-9 rounded-lg flex items-center justify-center transition" style={{ background: res.pinned ? "#FFF8E6" : "#F6F8FC", border: "1px solid #E6ECF5", color: res.pinned ? "#CC7A00" : "#4A5878" }} title={res.pinned ? "Unpin" : "Pin"}>
                {res.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => { if (confirm("Remove this resource?")) deleteMutation.mutate(res.id); }} className="w-9 h-9 rounded-lg flex items-center justify-center transition" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }} title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-6 py-4" style={{ background: "#F6F8FC" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: "#0B1B3D" }}>
            <BookOpen className="w-5 h-5" style={{ color: "#0B3FD9" }} /> Resource Library
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>Pinned guides, PDFs, and helpful links for this group.</p>
        </div>
        {canAddResources && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.25)" }}>
            <Plus className="w-4 h-4" /> Add Resource
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8A97B5" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="w-full rounded-full py-2 pl-9 pr-3 text-sm focus:outline-none" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }} />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition" style={category === c ? { background: "#0B3FD9", color: "#FFFFFF" } : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#0B3FD9" }} /></div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
          <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "#1FB8FF" }} />
          <p className="font-bold" style={{ color: "#0B1B3D" }}>No resources yet</p>
          <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Add PDFs, study guides, videos, or links to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#CC7A00" }}><Pin className="w-3.5 h-3.5" /> Pinned</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pinned.map(res => <ResourceCard key={res.id} res={res} />)}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7FA0" }}>All Resources</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unpinned.map(res => <ResourceCard key={res.id} res={res} />)}
              </div>
            </div>
          )}
          {pinned.length === 0 && unpinned.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: "#8A97B5" }}>No resources match your filters.</div>
          )}
        </div>
      )}

      {showAdd && <AddResourceModal group={group} currentUser={currentUser} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddResourceModal({ group, currentUser, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", resource_type: "link", category: "General", url: "", pinned: false });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      let file_url = undefined;
      if (file) {
        setUploading(true);
        const res = await base44.integrations.Core.UploadFile({ file });
        file_url = res.file_url;
        setUploading(false);
      }
      await base44.entities.GlowGroupResource.create({
        group_id: group.id,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        resource_type: form.resource_type,
        category: form.category,
        url: form.url.trim() || undefined,
        file_url,
        pinned: form.pinned,
        added_by: currentUser.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupResources", group.id] });
      toast.success("Resource added ✨");
      onClose();
    },
    onError: () => { setUploading(false); toast.error("Failed to add resource"); },
  });

  const canSubmit = form.title.trim() && (form.url.trim() || file);

  const inputStyle = { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(11, 27, 61, 0.5)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 20px 60px rgba(11, 63, 217, 0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9, #FFD000)" }} />
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "#E6ECF5" }}>
          <h3 className="font-bold text-lg" style={{ color: "#0B1B3D" }}>Add Resource</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) createMutation.mutate(); }} className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>Title *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none" style={inputStyle} placeholder="e.g. Sabbath School Quarterly Q2" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none" style={inputStyle} placeholder="What's this resource about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>Type</label>
              <BottomSheetSelect
                value={form.resource_type}
                onChange={val => setForm({ ...form, resource_type: val })}
                options={[
                  { value: "link", label: "🔗 Link" },
                  { value: "pdf", label: "📄 PDF" },
                  { value: "study_guide", label: "📘 Study Guide" },
                  { value: "video", label: "🎥 Video" },
                  { value: "document", label: "📃 Document" },
                  { value: "image", label: "🖼️ Image" },
                ]}
                triggerClassName="w-full h-11 rounded-xl px-3 text-sm"
                triggerStyle={inputStyle}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>Category</label>
              <BottomSheetSelect
                value={form.category}
                onChange={val => setForm({ ...form, category: val })}
                options={CATEGORIES.filter(c => c !== "All").map(c => ({ value: c, label: c }))}
                triggerClassName="w-full h-11 rounded-xl px-3 text-sm"
                triggerStyle={inputStyle}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>URL (optional)</label>
            <input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none" style={inputStyle} placeholder="https://..." />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>Or upload file</label>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700" />
            {file && <div className="text-xs mt-1" style={{ color: "#0B3FD9" }}>📎 {file.name}</div>}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} />
            <span className="text-sm flex items-center gap-1" style={{ color: "#0B1B3D" }}><Pin className="w-3.5 h-3.5" style={{ color: "#CC7A00" }} /> Pin to top</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>Cancel</button>
            <button type="submit" disabled={!canSubmit || createMutation.isPending || uploading} className="px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-60" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Add Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}