import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Database, RefreshCw, Rows3, Table2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="adm-card adm-card-accent">
    <Icon className="w-5 h-5 mb-5 adm-text-accent" />
    <div className="adm-stat-big">{value}</div>
    <div className="adm-stat-label">{label}</div>
  </div>
);

export default function AdminStorageDashboardTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke("getSupabaseStorageStats", {});
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to load storage statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 1800000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const populatedTables = useMemo(() => (stats?.tables || []).filter(table => table.row_count > 0), [stats]);
  const emptyTables = useMemo(() => (stats?.tables || []).filter(table => table.row_count === 0), [stats]);

  return (
    <div className="space-y-6 adm-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <span className="adm-eyebrow"><Database className="w-3.5 h-3.5" /> Supabase database</span>
          <h1 className="text-2xl md:text-3xl font-black font-['Space_Grotesk'] mt-2 adm-text">Storage Dashboard</h1>
          <p className="text-sm mt-1 adm-text-secondary">Live database usage and table activity.</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <span className="text-xs adm-text-muted">Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "Not yet"}</span>
          <button onClick={loadStats} disabled={loading} className="adm-btn-primary disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Now
          </button>
        </div>
      </div>

      {error && <div className="adm-card text-sm" style={{ color: "var(--adm-danger)" }}>{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Database} label="Total Size" value={loading && !stats ? "…" : stats?.total_size || "—"} />
        <StatCard icon={Table2} label="Total Tables" value={loading && !stats ? "…" : (stats?.table_count ?? "—").toLocaleString()} />
        <StatCard icon={Rows3} label="Total Rows" value={loading && !stats ? "…" : (stats?.total_rows ?? "—").toLocaleString()} />
      </div>

      <div className="adm-card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b adm-border">
          <h2 className="font-bold adm-text">Populated tables</h2>
          <p className="text-xs mt-1 adm-text-muted">Sorted by storage size, largest first.</p>
        </div>
        <div className="overflow-x-auto adm-scroll">
          <table className="w-full text-sm">
            <thead className="adm-surface-muted adm-text-muted text-xs uppercase tracking-wider">
              <tr><th className="text-left px-5 py-3">Table name</th><th className="text-right px-5 py-3">Rows</th><th className="text-right px-5 py-3">Size</th></tr>
            </thead>
            <tbody>
              {populatedTables.map(table => (
                <tr key={table.table_name} className="border-t adm-border adm-text-secondary">
                  <td className="px-5 py-3 font-medium adm-text">{table.table_name}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{table.row_count.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{table.size}</td>
                </tr>
              ))}
              {!loading && populatedTables.length === 0 && <tr><td colSpan="3" className="px-5 py-10 text-center adm-text-muted">No populated tables found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adm-card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div><h2 className="font-bold adm-text">Empty tables</h2><p className="text-xs mt-1 adm-text-muted">Tables ready for future data.</p></div>
          <span className="adm-badge">{emptyTables.length} tables</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {emptyTables.map(table => <div key={table.table_name} className="rounded-lg px-3 py-2 text-xs adm-surface-muted adm-text-muted">{table.table_name}</div>)}
        </div>
      </div>
    </div>
  );
}