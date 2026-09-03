import React from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import moment from "moment";

export default function GenLuxMentions({ mentions }) {
  return <section className="adm-card"><p className="adm-eyebrow"><Newspaper size={13} /> Web mentions</p><h2 className="text-lg font-bold adm-text mt-1 mb-4">Newest discoveries</h2>
    <div className="space-y-3">{mentions.slice(0, 8).map(m => <a key={m.id} href={m.url} target="_blank" rel="noreferrer noopener noreferrer" className="block rounded-xl p-3 adm-surface-muted border adm-border hover:adm-border-strong">
      <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-semibold adm-text line-clamp-2">{m.title}</p><p className="mt-1 text-[11px] adm-text-muted">{m.domain} · {m.country || "Unknown"} · {moment(m.discovered_at).fromNow()}</p></div><ExternalLink size={14} className="adm-text-accent shrink-0" /></div>
      <div className="flex gap-2 mt-2"><span className="adm-badge">{m.sentiment || "Neutral"}</span><span className="adm-badge adm-badge-gold">{m.potential_reach || "Medium"} reach</span></div>
    </a>)}</div>{!mentions.length && <p className="py-8 text-center text-sm adm-text-muted">New public web mentions will appear after the first scan.</p>}
  </section>;
}