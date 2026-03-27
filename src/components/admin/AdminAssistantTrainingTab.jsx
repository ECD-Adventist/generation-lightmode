import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Plus, Trash2, Brain, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function KnowledgeForm({ onSave, saving }) {
  const [form, setForm] = useState({ question: "", answer: "", category: "General" });

  const submit = () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    onSave(form);
    setForm({ question: "", answer: "", category: "General" });
  };

  return (
    <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-white font-bold font-['Space_Grotesk']">
        <Plus className="w-4 h-4 text-[#00CFFF]" /> Add Q&A
      </div>
      <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Question" className="bg-[#0B0F1A] border-white/10" />
      <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Answer" className="w-full min-h-[120px] rounded-xl border border-white/10 bg-[#0B0F1A] px-4 py-3 text-white focus:outline-none focus:border-[#00CFFF]" />
      <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="bg-[#0B0F1A] border-white/10" />
      <Button onClick={submit} disabled={saving} className="bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80 font-bold">
        Save Q&A
      </Button>
    </div>
  );
}

function UploadQaCard({ onImporting }) {
  const queryClient = useQueryClient();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImporting(true);
    const toastId = toast.loading("Uploading Q&A file...");
    try {
      await base44.integrations.Core.UploadFile({ file });
      toast.success("File uploaded. Bulk import setup is next; for now you can add Q&A manually below.", { id: toastId });
    } catch {
      toast.error("Upload failed. Please use CSV or JSON with question and answer columns.", { id: toastId });
    } finally {
      onImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-white font-bold font-['Space_Grotesk']">
        <Upload className="w-4 h-4 text-[#FFD000]" /> Upload Q&A file
      </div>
      <p className="text-sm text-gray-400">Upload is ready, and manual Q&A entry works now; bulk import will be connected next.</p>
      <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-[#0B0F1A] px-4 py-6 text-gray-300 hover:border-[#00CFFF]/40 cursor-pointer">
        <FileText className="w-4 h-4" /> Choose file
        <input type="file" accept=".csv,.json" className="hidden" onChange={handleFile} />
      </label>
    </div>
  );
}

export default function AdminAssistantTrainingTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["assistant_knowledge"],
    queryFn: () => base44.entities.AssistantKnowledge.list("-created_date", 500),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AssistantKnowledge.create({ ...data, status: "active", source: "manual" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistant_knowledge"] });
      toast.success("Q&A saved.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AssistantKnowledge.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistant_knowledge"] });
      toast.success("Q&A removed.");
    }
  });

  const filtered = useMemo(() => items.filter(item => {
    const q = search.toLowerCase();
    return !q || item.question?.toLowerCase().includes(q) || item.answer?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
  }), [items, search]);

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 mb-3 text-[#00CFFF] text-xs font-bold uppercase tracking-widest">
          <Brain className="w-3.5 h-3.5" /> Assistant Training
        </div>
        <h1 className="text-3xl font-black font-['Space_Grotesk'] text-white">Train the Assistant</h1>
        <p className="text-gray-400 mt-1">These Q&As will be used app-wide to improve answers.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-6">
        <div className="space-y-6">
          <KnowledgeForm onSave={(data) => createMutation.mutate(data)} saving={createMutation.isPending} />
          <UploadQaCard onImporting={setImporting} />
        </div>

        <div className="bg-[#121826] border border-white/5 rounded-2xl p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-white font-bold font-['Space_Grotesk'] text-xl">Knowledge Base</h2>
              <p className="text-sm text-gray-400">{items.length} saved Q&As</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Q&A" className="pl-9 bg-[#0B0F1A] border-white/10" />
            </div>
          </div>

          {isLoading || importing ? (
            <div className="text-center py-16 text-gray-400">Loading knowledge base...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No Q&A found yet.</div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {filtered.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/5 bg-[#0B0F1A] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-widest text-[#00CFFF] mb-2">{item.category || "General"}</div>
                      <h3 className="text-white font-bold mb-2">{item.question}</h3>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.answer}</p>
                    </div>
                    <button onClick={() => deleteMutation.mutate(item.id)} className="text-red-400 hover:text-red-300 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}