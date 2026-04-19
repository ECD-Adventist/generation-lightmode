import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Upload, Map, CheckCircle2, Loader2, Shield, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const TERRITORY_LEVELS = [
  { value: "ecd", label: "ECD" },
  { value: "country", label: "Country" },
  { value: "union", label: "Union" },
  { value: "conference_field", label: "Conference/Field" },
  { value: "church", label: "Church" },
];

export default function AdminTerritorySetupTab({ user }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

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
      <div className="border rounded-2xl p-6 text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>
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
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Territory Setup</h1>
        <p className="text-sm mt-1" style={{ color: t.textSecondary }}>Upload your map, review the extracted region details, then confirm access scope.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border rounded-2xl p-6 space-y-4" style={{ background: t.surface, borderColor: t.border }}>
          <div className="flex items-center gap-3 font-bold text-sm" style={{ color: t.accent }}>
            <Map className="w-4 h-4" /> Uploaded Territory Map
          </div>
          {review.mapUrl ? (
            <img src={review.mapUrl} alt="Territory map" className="w-full max-h-[420px] object-contain rounded-xl border" style={{ background: t.surfaceMuted, borderColor: t.border }} />
          ) : (
            <div className="border border-dashed rounded-xl h-64 flex items-center justify-center text-sm" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textMuted }}>
              No map uploaded yet.
            </div>
          )}

          <label className="block">
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
            <div className="w-full border rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition hover:opacity-80"
                 style={{ background: t.accentSoft, borderColor: t.borderStrong, color: t.accent }}>
              {(uploading || extracting) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading || extracting ? "Processing map..." : "Upload Territory Map"}
            </div>
          </label>
        </div>

        <div className="border rounded-2xl p-6 space-y-4" style={{ background: t.surface, borderColor: t.border }}>
          <div className="flex items-center gap-3 font-bold text-sm" style={{ color: isDark ? "#FFD000" : "#d97706" }}>
            <FileText className="w-4 h-4" /> Review Extracted Territory
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Role</p>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}>
              <Shield className="w-4 h-4" style={{ color: t.accent }} /> {me?.role?.replace(/_/g, " ")}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Territory Name</p>
            <Input value={territoryName} onChange={(e) => setTerritoryName(e.target.value)} className="rounded-xl focus:outline-none transition" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Territory Level</p>
            <select value={territoryLevel} onChange={(e) => setTerritoryLevel(e.target.value)} className="w-full h-10 rounded-xl border px-3 text-sm focus:outline-none transition" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}>
              <option value="">Select territory level</option>
              {TERRITORY_LEVELS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Countries / Regions</p>
            <textarea value={review.countries} onChange={(e) => setReview(prev => ({ ...prev, countries: e.target.value }))} className="w-full min-h-[92px] rounded-xl border px-3 py-3 text-sm focus:outline-none transition" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Extraction Notes</p>
            <textarea value={review.notes} onChange={(e) => setReview(prev => ({ ...prev, notes: e.target.value }))} className="w-full min-h-[110px] rounded-xl border px-3 py-3 text-sm focus:outline-none transition" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Status</p>
              <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>{(me?.territory_status || "not_submitted").replace(/_/g, " ")}</p>
            </div>
            <Button onClick={handleConfirm} disabled={!territoryName || !territoryLevel || !review.mapUrl} className="font-bold transition hover:opacity-90 disabled:opacity-50" style={{ background: t.accent, color: "#fff", border: "none" }}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Territory
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}