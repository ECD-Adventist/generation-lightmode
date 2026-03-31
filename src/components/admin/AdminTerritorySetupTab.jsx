import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Upload, Map, CheckCircle2, Loader2, Shield, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TERRITORY_LEVELS = [
  { value: "ecd", label: "ECD" },
  { value: "country", label: "Country" },
  { value: "union", label: "Union" },
  { value: "conference_field", label: "Conference/Field" },
  { value: "church", label: "Church" },
];

export default function AdminTerritorySetupTab({ user }) {
  const queryClient = useQueryClient();
  const [territoryName, setTerritoryName] = useState(user?.territory_name || "");
  const [territoryLevel, setTerritoryLevel] = useState(user?.territory_level || "");
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [review, setReview] = useState({
    countries: user?.territory_countries || "",
    notes: user?.territory_extraction_notes || "",
    mapUrl: user?.territory_map_url || ""
  });

  const isRegionalAdmin = useMemo(() => [
    "ecd_admin",
    "country_admin",
    "union_admin",
    "conference_field_admin",
    "church_admin"
  ].includes(user?.role), [user?.role]);

  const { data: me = user } = useQuery({
    queryKey: ["territory_me", user?.email],
    queryFn: () => base44.auth.me(),
    enabled: !!user?.email,
    initialData: user,
  });

  if (!isRegionalAdmin) {
    return (
      <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 text-sm text-gray-400">
        Territory setup is available for regional admin roles only.
      </div>
    );
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading("Uploading territory map...");

    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const prompt = `You are reviewing a territory map uploaded by an admin. Extract the most likely territory scope and the countries/regions clearly represented. Return concise admin-friendly output.`;
      setExtracting(true);
      const extractRes = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [uploadRes.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            territory_name: { type: "string" },
            territory_level: { type: "string" },
            countries: { type: "array", items: { type: "string" } },
            notes: { type: "string" }
          }
        }
      });

      const countries = Array.isArray(extractRes.countries) ? extractRes.countries.join(", ") : "";
      const nextLevel = TERRITORY_LEVELS.some(item => item.value === extractRes.territory_level) ? extractRes.territory_level : territoryLevel;
      setTerritoryName(extractRes.territory_name || territoryName);
      setTerritoryLevel(nextLevel || territoryLevel);
      setReview({
        countries,
        notes: extractRes.notes || "",
        mapUrl: uploadRes.file_url
      });

      await base44.auth.updateMe({
        territory_map_url: uploadRes.file_url,
        territory_name: extractRes.territory_name || territoryName,
        territory_level: nextLevel || territoryLevel,
        territory_countries: countries,
        territory_extraction_notes: extractRes.notes || "",
        territory_status: "pending_review"
      });

      queryClient.invalidateQueries({ queryKey: ["territory_me", user?.email] });
      toast.success("Map extracted and saved for review.", { id: toastId });
    } catch {
      toast.error("Could not process the territory map.", { id: toastId });
    } finally {
      setUploading(false);
      setExtracting(false);
      event.target.value = "";
    }
  };

  const handleConfirm = async () => {
    await base44.auth.updateMe({
      territory_name: territoryName,
      territory_level: territoryLevel,
      territory_map_url: review.mapUrl,
      territory_countries: review.countries,
      territory_extraction_notes: review.notes,
      territory_status: "approved"
    });
    queryClient.invalidateQueries({ queryKey: ["territory_me", user?.email] });
    toast.success("Territory confirmed.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Territory Setup</h1>
        <p className="text-sm text-gray-400 mt-1">Upload your map, review the extracted region details, then confirm access scope.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-[#00CFFF] font-bold text-sm">
            <Map className="w-4 h-4" /> Uploaded Territory Map
          </div>
          {review.mapUrl ? (
            <img src={review.mapUrl} alt="Territory map" className="w-full max-h-[420px] object-contain rounded-xl border border-white/10 bg-[#0B0F1A]" />
          ) : (
            <div className="border border-dashed border-white/10 rounded-xl h-64 flex items-center justify-center text-sm text-gray-500 bg-[#0B0F1A]">
              No map uploaded yet.
            </div>
          )}

          <label className="block">
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
            <div className="w-full border border-[#00CFFF]/30 bg-[#00CFFF]/10 hover:bg-[#00CFFF]/15 rounded-xl px-4 py-3 text-sm font-bold text-[#00CFFF] flex items-center justify-center gap-2 cursor-pointer transition">
              {(uploading || extracting) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading || extracting ? "Processing map..." : "Upload Territory Map"}
            </div>
          </label>
        </div>

        <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-[#FFD000] font-bold text-sm">
            <FileText className="w-4 h-4" /> Review Extracted Territory
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Role</p>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white">
              <Shield className="w-4 h-4 text-[#00CFFF]" /> {me?.role?.replace(/_/g, " ")}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Territory Name</p>
            <Input value={territoryName} onChange={(e) => setTerritoryName(e.target.value)} className="bg-[#0B0F1A] border-white/10" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Territory Level</p>
            <select value={territoryLevel} onChange={(e) => setTerritoryLevel(e.target.value)} className="w-full h-10 rounded-md border border-white/10 bg-[#0B0F1A] px-3 text-sm text-white">
              <option value="">Select territory level</option>
              {TERRITORY_LEVELS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Countries / Regions</p>
            <textarea value={review.countries} onChange={(e) => setReview(prev => ({ ...prev, countries: e.target.value }))} className="w-full min-h-[92px] rounded-xl border border-white/10 bg-[#0B0F1A] px-3 py-3 text-sm text-white" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Extraction Notes</p>
            <textarea value={review.notes} onChange={(e) => setReview(prev => ({ ...prev, notes: e.target.value }))} className="w-full min-h-[110px] rounded-xl border border-white/10 bg-[#0B0F1A] px-3 py-3 text-sm text-white" />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0B0F1A] px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Status</p>
              <p className="text-sm font-semibold text-white">{(me?.territory_status || "not_submitted").replace(/_/g, " ")}</p>
            </div>
            <Button onClick={handleConfirm} disabled={!territoryName || !territoryLevel || !review.mapUrl} className="bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80 font-bold">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Territory
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}