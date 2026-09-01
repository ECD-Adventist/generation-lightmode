import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Upload, Map, CheckCircle2, Loader2, Shield, FileText, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import TerritoryCountryRegionPicker from "./territory/TerritoryCountryRegionPicker";
import { parseTerritorySelection, summarizeTerritorySelection } from "./territory/ecdRegions";

const TERRITORY_LEVELS = [
  { value: "ecd", label: "ECD" },
  { value: "country", label: "Country" },
  { value: "union", label: "Union" },
  { value: "conference_field", label: "Conference/Field" },
  { value: "church", label: "Church" },
];

// Every territory leader AND officer can set their own territory via dropdowns.
const TERRITORY_ROLES = [
  "ecd_admin",
  "country_admin",
  "union_admin",
  "union_officer",
  "conference_field_admin",
  "conference_field_officer",
  "church_admin",
  "church_officer",
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
  const [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState(() => parseTerritorySelection(user));
  const [review, setReview] = useState({
    notes: user?.territory_extraction_notes || "",
    mapUrl: user?.territory_map_url || ""
  });

  const canSetupTerritory = useMemo(() => TERRITORY_ROLES.includes(user?.role), [user?.role]);
  const isEcdOfficer = user?.role === "ecd_officer";

  const { data: me = user } = useQuery({
    queryKey: ["territory_me", user?.email],
    queryFn: () => base44.auth.me(),
    enabled: !!user?.email,
    initialData: user,
  });

  if (isEcdOfficer) {
    return (
      <div className="border rounded-2xl p-6 flex items-start gap-3" style={{ background: t.surface, borderColor: t.border }}>
        <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: isDark ? "#FFD000" : "#d97706" }} />
        <div>
          <p className="text-sm font-bold" style={{ color: t.textPrimary }}>ECD Officer — Division-Wide Access</p>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
            As an ECD Officer you automatically cover the entire East-Central Africa Division (all 12 countries).
            No map upload or country selection is needed — every section of the Control Center is already open to you in view-only mode.
          </p>
        </div>
      </div>
    );
  }

  if (!canSetupTerritory) {
    return (
      <div className="border rounded-2xl p-6 text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>
        Territory setup is available for territory leader and officer roles only.
      </div>
    );
  }

  const selectedCountries = Object.keys(selection);
  const canConfirm = !!territoryName && !!territoryLevel && (selectedCountries.length > 0 || !!review.mapUrl);

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

      const nextLevel = TERRITORY_LEVELS.some(item => item.value === extractRes.territory_level) ? extractRes.territory_level : territoryLevel;
      setTerritoryName(extractRes.territory_name || territoryName);
      setTerritoryLevel(nextLevel || territoryLevel);
      // Pre-fill the country picker from the extraction — the leader can correct it.
      if (Array.isArray(extractRes.countries) && extractRes.countries.length > 0 && selectedCountries.length === 0) {
        const next = {};
        extractRes.countries.forEach((c) => { if (c) next[String(c).trim()] = []; });
        setSelection(next);
      }
      setReview({ notes: extractRes.notes || "", mapUrl: uploadRes.file_url });
      toast.success("Map processed. Review the countries below, then confirm.", { id: toastId });
    } catch {
      toast.error("Could not process the territory map.", { id: toastId });
    } finally {
      setUploading(false);
      setExtracting(false);
      event.target.value = "";
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        territory_name: territoryName,
        territory_level: territoryLevel,
        territory_map_url: review.mapUrl,
        territory_countries: selectedCountries.join(", "),
        territory_regions: JSON.stringify(selection),
        territory_extraction_notes: review.notes,
        territory_status: "approved"
      });
      queryClient.invalidateQueries({ queryKey: ["territory_me", user?.email] });
      toast.success("Territory confirmed.");
    } catch {
      toast.error("Could not save your territory. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Territory Setup</h1>
        <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
          Select your countries and regions from the dropdowns, then confirm your access scope. Uploading a map is optional.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border rounded-2xl p-6 space-y-4" style={{ background: t.surface, borderColor: t.border }}>
          <div className="flex items-center gap-3 font-bold text-sm" style={{ color: t.accent }}>
            <Globe className="w-4 h-4" /> Select Countries &amp; Regions
          </div>
          <p className="text-xs" style={{ color: t.textSecondary }}>
            Pick each country you cover. Optionally narrow a country down to specific regions — if you don't pick regions, the entire country is covered.
          </p>

          <TerritoryCountryRegionPicker value={selection} onChange={setSelection} tokens={t} />

          {selectedCountries.length > 0 && (
            <div className="rounded-xl border px-4 py-3 text-xs" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textSecondary }}>
              <span className="font-bold" style={{ color: t.textPrimary }}>Coverage: </span>
              {summarizeTerritorySelection(selection)}
            </div>
          )}

          <div className="pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-3 font-bold text-sm mb-3" style={{ color: t.accent }}>
              <Map className="w-4 h-4" /> Territory Map (Optional)
            </div>
            {review.mapUrl ? (
              <img src={review.mapUrl} alt="Territory map" className="w-full max-h-[320px] object-contain rounded-xl border mb-3" style={{ background: t.surfaceMuted, borderColor: t.border }} />
            ) : null}
            <label className="block">
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
              <div className="w-full border rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition hover:opacity-80"
                   style={{ background: t.accentSoft, borderColor: t.borderStrong, color: t.accent }}>
                {(uploading || extracting) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading || extracting ? "Processing map..." : review.mapUrl ? "Replace Territory Map" : "Upload Territory Map (optional)"}
              </div>
            </label>
          </div>
        </div>

        <div className="border rounded-2xl p-6 space-y-4" style={{ background: t.surface, borderColor: t.border }}>
          <div className="flex items-center gap-3 font-bold text-sm" style={{ color: isDark ? "#FFD000" : "#d97706" }}>
            <FileText className="w-4 h-4" /> Review &amp; Confirm Territory
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Role</p>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}>
              <Shield className="w-4 h-4" style={{ color: t.accent }} /> {me?.role?.replace(/_/g, " ")}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Territory Name</p>
            <Input value={territoryName} onChange={(e) => setTerritoryName(e.target.value)} placeholder="e.g. East Kenya Union" className="rounded-xl focus:outline-none transition" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
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
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Notes</p>
            <textarea value={review.notes} onChange={(e) => setReview(prev => ({ ...prev, notes: e.target.value }))} className="w-full min-h-[110px] rounded-xl border px-3 py-3 text-sm focus:outline-none transition" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Status</p>
              <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>{(me?.territory_status || "not_submitted").replace(/_/g, " ")}</p>
            </div>
            <Button onClick={handleConfirm} disabled={!canConfirm || saving} className="font-bold transition hover:opacity-90 disabled:opacity-50" style={{ background: t.accent, color: "#fff", border: "none" }}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Confirm Territory
            </Button>
          </div>
          {!canConfirm && (
            <p className="text-[11px]" style={{ color: t.textMuted }}>
              To confirm: enter a territory name, choose a level, and select at least one country (or upload a map).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}