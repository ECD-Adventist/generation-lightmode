import React from "react";
import { Eye } from "lucide-react";

/**
 * Shown to officer roles, who may view admin data for their own territory
 * but cannot change it. Makes the restriction visible instead of letting
 * them click controls the server will reject.
 */
export default function AdminReadOnlyBanner({ role, t }) {
  const label = (role || "officer").replace(/_/g, " ");
  return (
    <div
      className="rounded-2xl px-4 py-3 mb-5 flex items-center gap-3"
      style={{ background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)" }}
    >
      <Eye className="w-4 h-4 shrink-0" style={{ color: "#CC7A00" }} />
      <p className="text-xs font-bold capitalize" style={{ color: t?.textPrimary || "#0B1B3D" }}>
        {label} — view-only access
        <span className="font-normal capitalize-none ml-1" style={{ color: t?.textSecondary || "#6B7FA0" }}>
          · you can review your territory's data, but changes are disabled.
        </span>
      </p>
    </div>
  );
}