import React from "react";
import { Radar, RefreshCw, Plus } from "lucide-react";

export default function GenLuxHeader({ scanning, canManage, onScan, onAdd }) {
  return <div className="adm-hero"><div className="adm-hero-inner p-5 md:p-7">
    <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div><div className="adm-eyebrow"><Radar size={14} /> Search intelligence layer</div>
        <h1 className="mt-2 text-2xl md:text-4xl font-black adm-text font-['Space_Grotesk']">GenLux Mission Intelligence</h1>
        <p className="mt-2 max-w-2xl text-sm adm-text-secondary">Search → Discover → Measure → Analyze → Understand → Act</p>
      </div>
      {canManage && <div className="flex gap-2">
        <button className="adm-btn-secondary" onClick={onAdd}><Plus size={15} /> Add keyword</button>
        <button className="adm-btn-primary" disabled={scanning} onClick={onScan}><RefreshCw size={15} className={scanning ? "animate-spin" : ""} /> {scanning ? "Scanning web…" : "Scan now"}</button>
      </div>}
    </div>
  </div></div>;
}