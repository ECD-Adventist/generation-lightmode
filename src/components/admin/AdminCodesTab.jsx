import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminCodesTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    slogan_text: "",
    bible_reference: "",
    category: "",
    source_document: "keeping_it_100",
    poster_image_url: ""
  });
  const [isUploading, setIsUploading] = useState(false);

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["adminCodesOfTruth"],
    queryFn: () => base44.entities.CodeOfTruth.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCode) {
        return base44.entities.CodeOfTruth.update(editingCode.id, data);
      }
      return base44.entities.CodeOfTruth.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth"] });
      toast.success(editingCode ? "Code updated successfully" : "Code created successfully");
      setIsModalOpen(false);
      setEditingCode(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CodeOfTruth.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth"] });
      toast.success("Code deleted successfully");
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.CodeOfTruth.update(id, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["adminCodesOfTruth"] });
      queryClient.invalidateQueries({ queryKey: ["codesOfTruth"] });
      toast.success(status === "approved" ? "✅ Code approved — now visible to users!" : "Code rejected");
    }
  });

  const [statusFilter, setStatusFilter] = useState("all");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading poster image...");
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, poster_image_url: res.file_url }));
      toast.success("Poster uploaded successfully!", { id: toastId });
    } catch (err) {
      toast.error("Failed to upload poster", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      title: code.title || "",
      slogan_text: code.slogan_text || "",
      bible_reference: code.bible_reference || "",
      category: code.category || "",
      source_document: code.source_document || "keeping_it_100",
      poster_image_url: code.poster_image_url || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this code?")) {
      deleteMutation.mutate(id);
    }
  };

  const openNewModal = () => {
    setEditingCode(null);
    setFormData({
      title: "",
      slogan_text: "",
      bible_reference: "",
      category: "",
      source_document: "keeping_it_100",
      poster_image_url: ""
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#121826] p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Codes of Truth</h2>
          <p className="text-gray-400 text-sm mt-1">Manage truth slogans, posters, and their categories.</p>
        </div>
        <Button onClick={openNewModal} className="bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80 font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Code
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition ${statusFilter === s ? "bg-[#00CFFF] text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >
            {s === "all" ? `All (${codes.length})` : s === "pending" ? `⏳ Pending (${codes.filter(c => (c.status || "pending") === "pending").length})` : s === "approved" ? `✅ Approved (${codes.filter(c => c.status === "approved").length})` : `❌ Rejected (${codes.filter(c => c.status === "rejected").length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {codes.filter(code => statusFilter === "all" || (code.status || "pending") === statusFilter).map(code => {
            const status = code.status || "pending";
            return (
            <div key={code.id} className={`bg-[#121826] border rounded-2xl overflow-hidden flex flex-col ${status === "approved" ? "border-green-500/30" : status === "rejected" ? "border-red-500/20" : "border-yellow-500/20"}`}>
              {/* Rendered Poster */}
              <div className="aspect-[4/5] bg-gradient-to-br from-[#0B0F1A] via-[#121826] to-[#0B0F1A] relative flex items-center justify-center p-6 text-center overflow-hidden">
                {code.poster_image_url ? (
                  <img src={code.poster_image_url} alt={code.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00CFFF]/5 via-transparent to-[#8A5CFF]/5 pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="text-3xl mb-1">💯</div>
                      <h3 className="text-lg font-black font-['Space_Grotesk'] text-white leading-tight">
                        {code.title || code.slogan_text}
                      </h3>
                      {code.title && (
                        <p className="text-xs text-gray-300 leading-relaxed">{code.slogan_text}</p>
                      )}
                      {code.bible_reference && (
                        <p className="text-[11px] text-[#00CFFF] font-bold mt-1 border border-[#00CFFF]/30 px-3 py-1 rounded-full">{code.bible_reference}</p>
                      )}
                    </div>
                  </>
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase">
                  {code.source_document === 'keeping_it_100' ? '💯 KI100' : '🔐 Codes'}
                </div>
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${status === "approved" ? "bg-green-500/80 text-white" : status === "rejected" ? "bg-red-500/80 text-white" : "bg-yellow-500/80 text-black"}`}>
                  {status === "approved" ? "✅ Live" : status === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{code.category || "Uncategorized"}</div>
                  <div className="text-sm font-semibold text-gray-300 truncate">{code.title || code.slogan_text}</div>
                </div>
                {/* Approval Controls */}
                {status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveMutation.mutate({ id: code.id, status: "approved" })} disabled={approveMutation.isPending} className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" onClick={() => approveMutation.mutate({ id: code.id, status: "rejected" })} disabled={approveMutation.isPending} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs">
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {status === "approved" && (
                  <Button size="sm" onClick={() => approveMutation.mutate({ id: code.id, status: "rejected" })} className="bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-white/10 text-xs">
                    Unpublish
                  </Button>
                )}
                {status === "rejected" && (
                  <Button size="sm" onClick={() => approveMutation.mutate({ id: code.id, status: "approved" })} className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" /> Re-approve
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(code)} className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-xs">
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(code.id)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingCode ? "Edit Code" : "Add New Code"}
            </h3>
            
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Source Document *</label>
                <select 
                  required
                  value={formData.source_document}
                  onChange={(e) => setFormData({...formData, source_document: e.target.value})}
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CFFF]"
                >
                  <option value="keeping_it_100">Keeping It 100</option>
                  <option value="codes_of_truth">Codes of Truth</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Title (Optional)</label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="E.g. Be a Light"
                  className="bg-[#0B0F1A] border-white/10"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Slogan Text *</label>
                <textarea 
                  required
                  value={formData.slogan_text}
                  onChange={(e) => setFormData({...formData, slogan_text: e.target.value})}
                  placeholder="Stand Out, Don’t Blend In."
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white min-h-[100px] focus:outline-none focus:border-[#00CFFF]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Bible Reference</label>
                <Input 
                  value={formData.bible_reference}
                  onChange={(e) => setFormData({...formData, bible_reference: e.target.value})}
                  placeholder="Romans 12:14-16"
                  className="bg-[#0B0F1A] border-white/10"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Category</label>
                <Input 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="E.g. Identity"
                  className="bg-[#0B0F1A] border-white/10"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Custom Poster Image (Optional)</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition text-sm">
                    <ImageIcon className="w-4 h-4" />
                    {isUploading ? "Uploading..." : "Choose Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                  {formData.poster_image_url && (
                    <div className="h-12 w-10 relative rounded overflow-hidden">
                      <img src={formData.poster_image_url} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending || isUploading} className="bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Code
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}