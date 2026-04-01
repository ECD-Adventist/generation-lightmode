import React, { useState, useRef, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, Upload, Plus, Trash2, Loader2, Sparkles, Save, Edit2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TerritoryMapManager({ institutionApps, primaryApp }) {
  const queryClient = useQueryClient();
  const orgMapInputRef = useRef(null);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [mapUploadProgress, setMapUploadProgress] = useState(null);
  const [territories, setTerritories] = useState([]);
  
  // For adding/editing
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editForm, setEditForm] = useState({ name: "", region: "", country: "" });
  const [isAdding, setIsAdding] = useState(false);

  const activeApp = institutionApps.find(a => a.organization_map_url) || primaryApp || institutionApps[0];

  useEffect(() => {
    if (activeApp?.extracted_territories) {
      try {
        setTerritories(JSON.parse(activeApp.extracted_territories));
      } catch (e) {
        setTerritories([]);
      }
    }
  }, [activeApp?.extracted_territories]);

  const saveTerritoriesMutation = useMutation({
    mutationFn: async (newTerritories) => {
      await base44.entities.InstitutionApplication.update(activeApp.id, {
        extracted_territories: JSON.stringify(newTerritories)
      });
    },
    onSuccess: (_, newTerritories) => {
      setTerritories(newTerritories);
      queryClient.invalidateQueries({ queryKey: ["myApprovedInstitutions"] });
      queryClient.invalidateQueries({ queryKey: ["profileInstitutionApps"] });
      toast.success("Territories updated successfully");
      setEditingIndex(-1);
      setIsAdding(false);
    },
    onError: () => {
      toast.error("Failed to save territories");
    }
  });

  const handleSaveEdit = () => {
    if (!editForm.name.trim()) return toast.error("Territory name is required");
    const newTerritories = [...territories];
    if (isAdding) {
      newTerritories.push(editForm);
    } else {
      newTerritories[editingIndex] = editForm;
    }
    saveTerritoriesMutation.mutate(newTerritories);
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to remove this territory?")) {
      const newTerritories = territories.filter((_, i) => i !== index);
      saveTerritoriesMutation.mutate(newTerritories);
    }
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditForm(territories[index]);
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingIndex(-1);
    setEditForm({ name: "", region: "", country: "" });
  };

  const handleMapUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = null;
    setUploadingMap(true);
    setMapUploadProgress({ step: 1, percent: 10, label: "Uploading image..." });

    try {
      setMapUploadProgress({ step: 1, percent: 25, label: "Uploading image..." });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMapUploadProgress({ step: 1, percent: 40, label: "Upload complete" });

      setMapUploadProgress({ step: 2, percent: 50, label: "AI extracting territories..." });
      let extractedTerritories = [];
      try {
        const extractResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this organization map image. Extract all territory names, regions, countries, and any hierarchical structure visible. Return a JSON array of objects with fields: name (territory/conference name), region (geographic region), country (country name). If you cannot identify territories, return a best-effort list based on visible text or geographic regions shown.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              territories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    region: { type: "string" },
                    country: { type: "string" }
                  }
                }
              }
            }
          }
        });
        extractedTerritories = extractResult?.territories || [];
      } catch (aiErr) {
        console.warn("AI extraction failed", aiErr);
      }
      setMapUploadProgress({ step: 2, percent: 70, label: `Found ${extractedTerritories.length} territories` });
      
      setMapUploadProgress({ step: 3, percent: 85, label: "Saving to profile..." });
      const updateData = { organization_map_url: file_url };
      if (extractedTerritories.length > 0) {
        updateData.extracted_territories = JSON.stringify(extractedTerritories);
      }
      await base44.entities.InstitutionApplication.update(activeApp.id, updateData);
      setMapUploadProgress({ step: 4, percent: 100, label: "Done!" });

      await new Promise(r => setTimeout(r, 600));
      queryClient.invalidateQueries({ queryKey: ["myApprovedInstitutions"] });
      toast.success(`Map uploaded! ${extractedTerritories.length} territories extracted.`);
    } catch (err) {
      toast.error("Failed to upload map");
    } finally {
      setUploadingMap(false);
      setMapUploadProgress(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Map Section */}
      <div className="space-y-6">
        <div className="bg-[#121826] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#FFD000] flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Organization Map
            </h3>
            <button
              onClick={() => orgMapInputRef.current?.click()}
              disabled={uploadingMap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-[#FFD000] bg-white/5 hover:bg-white/10 border border-white/5 transition"
            >
              {uploadingMap ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {activeApp?.organization_map_url ? "Replace Map" : "Upload Map"}
            </button>
            <input
              ref={orgMapInputRef}
              type="file"
              accept="image/png"
              className="hidden"
              onChange={handleMapUpload}
            />
          </div>

          {mapUploadProgress && (
            <div className="mb-4 rounded-xl bg-white/[0.03] border border-[#FFD000]/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#FFD000]">{mapUploadProgress.label}</span>
                <span className="text-xs font-bold text-gray-400">{mapUploadProgress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${mapUploadProgress.percent}%`, background: "linear-gradient(90deg, #FFD000, #00CFFF)" }}
                />
              </div>
            </div>
          )}

          {activeApp?.organization_map_url ? (
            <div className="rounded-xl overflow-hidden border border-[#FFD000]/10 bg-white p-4 flex items-center justify-center">
              <img
                src={activeApp.organization_map_url}
                alt="Organization Map"
                className="max-w-full max-h-[400px] object-contain"
              />
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-xl">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm max-w-xs mx-auto">Upload a PNG map of your organization's territories.</p>
            </div>
          )}
        </div>
      </div>

      {/* Territories Section */}
      <div className="space-y-6">
        <div className="bg-[#121826] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#00CFFF] flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Defined Territories
            </h3>
            {!isAdding && (
              <button
                onClick={startAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/20 hover:bg-[#00CFFF]/20 transition"
              >
                <Plus className="w-3 h-3" /> Add Territory
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {isAdding && (
              <div className="bg-white/5 border border-[#00CFFF]/30 rounded-xl p-4 space-y-3">
                <Input placeholder="Territory Name (e.g. East Africa)" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-[#0B0F1A] border-white/10 h-10" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Region (Optional)" value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})} className="bg-[#0B0F1A] border-white/10 h-10" />
                  <Input placeholder="Country (Optional)" value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})} className="bg-[#0B0F1A] border-white/10 h-10" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-8">Cancel</Button>
                  <Button size="sm" onClick={handleSaveEdit} className="h-8 bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80">Save</Button>
                </div>
              </div>
            )}

            {territories.map((t, idx) => (
              editingIndex === idx ? (
                <div key={idx} className="bg-white/5 border border-[#00CFFF]/30 rounded-xl p-4 space-y-3">
                  <Input placeholder="Territory Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-[#0B0F1A] border-white/10 h-10" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Region" value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})} className="bg-[#0B0F1A] border-white/10 h-10" />
                    <Input placeholder="Country" value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})} className="bg-[#0B0F1A] border-white/10 h-10" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingIndex(-1)} className="h-8">Cancel</Button>
                    <Button size="sm" onClick={handleSaveEdit} className="h-8 bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80">Save Changes</Button>
                  </div>
                </div>
              ) : (
                <div key={idx} className="group bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-white/10 transition">
                  <div>
                    <h4 className="font-bold text-white text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {[t.region, t.country].filter(Boolean).join(", ") || "No region specified"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(idx)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(idx)} className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-md transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            ))}

            {territories.length === 0 && !isAdding && (
              <div className="text-center py-10 text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No territories defined yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}