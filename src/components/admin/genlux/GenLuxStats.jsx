import React from "react";
import { Globe2, Search, Newspaper, BellRing } from "lucide-react";

export default function GenLuxStats({ keywords, mentions, alerts }) {
  const countries = new Set(mentions.map(m => m.country).filter(c => c && c !== "Unknown")).size;
  const stats = [
    ["Monitored terms", keywords.filter(k => k.active).length, Search, "var(--adm-accent)"],
    ["Web mentions", mentions.length, Newspaper, "var(--adm-gold)"],
    ["Countries", countries, Globe2, "var(--adm-success)"],
    ["Open alerts", alerts.filter(a => !a.read).length, BellRing, "var(--adm-danger)"]
  ];
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{stats.map(([label, value, Icon, color]) =>
    <div key={label} className="adm-card adm-card-accent"><Icon size={18} style={{ color }} /><div className="adm-stat-big mt-4">{value.toLocaleString()}</div><div className="adm-stat-label">{label}</div></div>
  )}</div>;
}