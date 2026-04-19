import React, { useState, useRef, useEffect } from "react";
import { Map, MapPin, Shield, X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TerritoryQuickView({ user, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user.territory_name) {
    return <span className="text-xs" style={{ color: t.textMuted }}>Not set</span>;
  }

  const statusStyles = {
    approved: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e", bd: "rgba(34,197,94,0.3)" },
    pending: { bg: "rgba(255,208,0,0.15)", fg: "#fbbf24", bd: "rgba(255,208,0,0.3)" },
    rejected: { bg: "rgba(239,68,68,0.15)", fg: "#ef4444", bd: "rgba(239,68,68,0.3)" },
  }[user.territory_status] || { bg: t.surfaceMuted, fg: t.textMuted, bd: t.border };

  const countries = Array.isArray(user.territory_countries) ? user.territory_countries : [];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="flex flex-col gap-1 text-left transition hover:opacity-80"
      >
        <span className="flex items-center gap-1 text-xs" style={{ color: t.textSecondary }}>
          <Map size={12} style={{ color: t.accent }} />{user.territory_name}
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit"
          style={{ background: statusStyles.bg, color: statusStyles.fg, border: `1px solid ${statusStyles.bd}` }}
        >
          {user.territory_status || "not set"}
        </span>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-2 z-50 w-72 rounded-xl border shadow-2xl p-4"
          style={{ background: t.surface, borderColor: t.borderStrong, boxShadow: t.shadowXl }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: t.accentSoft, color: t.accent }}>
                <Map size={16} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Territory</p>
                <p className="font-bold text-sm" style={{ color: t.textPrimary }}>{user.territory_name}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: t.textMuted }}><X size={14} /></button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span style={{ color: t.textMuted }}>Status</span>
              <span className="font-bold" style={{ color: statusStyles.fg }}>
                {user.territory_status || "not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: t.textMuted }}>Level</span>
              <span className="font-bold capitalize" style={{ color: t.textPrimary }}>
                {user.territory_level || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: t.textMuted }}>Role</span>
              <span className="font-bold" style={{ color: t.textPrimary }}>
                {(user.role || "user").replace(/_/g, " ")}
              </span>
            </div>
            {countries.length > 0 && (
              <div>
                <p className="mb-1" style={{ color: t.textMuted }}>Countries ({countries.length})</p>
                <div className="flex flex-wrap gap-1">
                  {countries.slice(0, 8).map(c => (
                    <span key={c} className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                      style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${t.borderStrong}` }}>
                      <MapPin size={8} className="inline mr-0.5" />{c}
                    </span>
                  ))}
                  {countries.length > 8 && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ color: t.textMuted }}>
                      +{countries.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            to={`${createPageUrl("AdminCenter")}?tab=territory-map`}
            className="mt-3 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition"
            style={{ background: t.gradient, color: "#fff" }}
            onClick={() => setOpen(false)}
          >
            <Shield size={11} /> Open Territory Map <ExternalLink size={10} />
          </Link>
        </div>
      )}
    </div>
  );
}