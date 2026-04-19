import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import GlowDropsStats from "./drops/GlowDropsStats";
import GlowDropsFilterBar from "./drops/GlowDropsFilterBar";
import GlowDropCard from "./drops/GlowDropCard";
import BulkActionsBar from "./drops/BulkActionsBar";
import DropPreviewModal from "./drops/DropPreviewModal";

export default function AdminGlowDropsTab({ user, territoryRestricted, territoryCountries, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  // Default to "approved" since that's the new auto-status for new drops
  const [filter, setFilter] = useState("approved");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [previewDrop, setPreviewDrop] = useState(null);

  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["admin_drops_all"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 200),
  });

  const allowedCountries = (territoryCountries || "").split(",").map(item => item.trim()).filter(Boolean);

  // Territory scoping
  const scopedDrops = useMemo(() => {
    if (!(territoryRestricted && territoryApproved)) return drops;
    return drops.filter(d => {
      const ownerCountry = user?.countryMap?.[d.user_email];
      return !ownerCountry || allowedCountries.includes(ownerCountry);
    });
  }, [drops, territoryRestricted, territoryApproved, user, allowedCountries]);

  // Counts per tab
  const counts = useMemo(() => {
    const c = { all: scopedDrops.length, approved: 0, rejected: 0, hidden: 0 };
    scopedDrops.forEach(d => {
      const status = d.status || "approved";
      if (status === "approved") c.approved++;
      else if (status === "rejected") c.rejected++;
      if (d.hidden) c.hidden++;
    });
    return c;
  }, [scopedDrops]);

  // Aggregate stats
  const stats = useMemo(() => {
    const now = new Date();
    const last24h = scopedDrops.filter(d => d.created_date && (now - new Date(d.created_date)) / (1000 * 60 * 60) <= 24).length;
    return {
      total: scopedDrops.length,
      approved: counts.approved,
      rejected: counts.rejected,
      hidden: counts.hidden,
      last24h,
    };
  }, [scopedDrops, counts]);

  const allCategories = useMemo(() => {
    const set = new Set(scopedDrops.map(d => d.category).filter(Boolean));
    return Array.from(set).sort();
  }, [scopedDrops]);

  // Filter pipeline
  const displayedDrops = useMemo(() => {
    return scopedDrops.filter(d => {
      const status = d.status || "approved";

      // Status tab
      if (filter === "hidden" && !d.hidden) return false;
      if (filter !== "all" && filter !== "hidden" && status !== filter) return false;

      // Category
      if (filterCategory !== "all" && d.category !== filterCategory) return false;

      // Search
      if (search) {
        const q = search.toLowerCase();
        const hay = [d.verse, d.reflection, d.user_email, d.hashtags, d.category].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scopedDrops, filter, filterCategory, search]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin_drops_all"] });

  // Single-drop actions
  const updateDrop = async (id, updates, successMsg) => {
    try {
      await base44.entities.GlowDrop.update(id, updates);
      if (successMsg) toast.success(successMsg);
      // Keep preview in sync if the drop being edited is open
      setPreviewDrop(prev => (prev && prev.id === id) ? { ...prev, ...updates } : prev);
      refresh();
    } catch (err) {
      toast.error(err?.message || "Update failed");
    }
  };

  const handleApprove = (drop) => updateDrop(drop.id, { status: "approved" }, "Approved");
  const handleReject  = (drop) => updateDrop(drop.id, { status: "rejected" }, "Rejected");
  const handleHide    = (drop) => {
    const reason = window.prompt("Reason for hiding this drop? (shown internally only)", "");
    if (reason === null) return;
    updateDrop(drop.id, { hidden: true, hidden_reason: reason.trim() || "No reason given" }, "Hidden from public feed");
  };
  const handleUnhide  = (drop) => updateDrop(drop.id, { hidden: false, hidden_reason: "" }, "Drop is visible again");
  const handleDelete  = async (drop) => {
    if (!window.confirm(`Permanently delete this drop by ${drop.user_email}? This cannot be undone.`)) return;
    try {
      await base44.entities.GlowDrop.delete(drop.id);
      toast.success("Deleted");
      if (previewDrop?.id === drop.id) setPreviewDrop(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  // Bulk actions
  const selectedDrops = useMemo(() => scopedDrops.filter(d => selected.has(d.id)), [scopedDrops, selected]);

  const runBulk = async (apply, successLabel) => {
    if (selected.size === 0) return;
    setBusy(true);
    let ok = 0, fail = 0;
    for (const d of selectedDrops) {
      try { await apply(d); ok++; } catch { fail++; }
    }
    setBusy(false);
    setSelected(new Set());
    toast.success(`${successLabel} ${ok}${fail ? ` · ${fail} failed` : ""}`);
    refresh();
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (territoryRestricted && !territoryApproved) {
    return (
      <div className="border rounded-2xl p-6 text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>
        Please confirm your territory map first to review drops in your region.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Glow Drops Moderation</h1>
        <p className="text-sm md:text-base mt-1" style={{ color: t.textSecondary }}>
          Posts are auto-approved on publish. Use this panel to reject, hide, or remove anything that shouldn't be live.
        </p>
      </div>

      <GlowDropsStats stats={stats} t={t} />

      <GlowDropsFilterBar
        filter={filter} setFilter={setFilter}
        search={search} setSearch={setSearch}
        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
        allCategories={allCategories}
        counts={counts}
        t={t} isDark={isDark}
      />

      <BulkActionsBar
        count={selected.size}
        busy={busy}
        onApprove={() => runBulk(d => base44.entities.GlowDrop.update(d.id, { status: "approved" }), "Approved")}
        onReject={()  => runBulk(d => base44.entities.GlowDrop.update(d.id, { status: "rejected" }), "Rejected")}
        onHide={()    => runBulk(d => base44.entities.GlowDrop.update(d.id, { hidden: true, hidden_reason: "Bulk hidden by admin" }), "Hidden")}
        onDelete={()  => {
          if (!window.confirm(`Permanently delete ${selected.size} drop(s)? This cannot be undone.`)) return;
          runBulk(d => base44.entities.GlowDrop.delete(d.id), "Deleted");
        }}
        onClear={() => setSelected(new Set())}
        t={t}
      />

      <p className="text-xs" style={{ color: t.textSecondary }}>
        Showing <span className="font-bold" style={{ color: t.textPrimary }}>{displayedDrops.length}</span> of {scopedDrops.length} drop{scopedDrops.length === 1 ? "" : "s"}
        {isLoading && <span className="ml-2" style={{ color: t.textMuted }}>· loading...</span>}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} /></div>
      ) : displayedDrops.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed" style={{ background: t.surface, borderColor: t.border, color: t.textMuted }}>
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No drops match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedDrops.map(drop => (
            <GlowDropCard
              key={drop.id}
              drop={drop}
              selected={selected.has(drop.id)}
              onToggleSelect={() => toggleSelect(drop.id)}
              onPreview={() => setPreviewDrop(drop)}
              onApprove={() => handleApprove(drop)}
              onReject={() => handleReject(drop)}
              onHide={() => handleHide(drop)}
              onUnhide={() => handleUnhide(drop)}
              onDelete={() => handleDelete(drop)}
              t={t} isDark={isDark}
            />
          ))}
        </div>
      )}

      {previewDrop && (
        <DropPreviewModal
          drop={previewDrop}
          onClose={() => setPreviewDrop(null)}
          onApprove={() => handleApprove(previewDrop)}
          onReject={() => handleReject(previewDrop)}
          onHide={() => handleHide(previewDrop)}
          onUnhide={() => handleUnhide(previewDrop)}
          onDelete={() => handleDelete(previewDrop)}
          t={t} isDark={isDark}
        />
      )}
    </div>
  );
}