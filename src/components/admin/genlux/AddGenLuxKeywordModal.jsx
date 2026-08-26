import React, { useState } from "react";
import { X } from "lucide-react";

export default function AddGenLuxKeywordModal({ open, saving, onClose, onSave }) {
  const [term, setTerm] = useState(""); const [kind, setKind] = useState("keyword");
  if (!open) return null;
  const submit = (e) => { e.preventDefault(); if (term.trim()) onSave({ term: term.trim(), kind }); };
  return <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(6,11,24,.72)", backdropFilter: "blur(8px)" }}><form onSubmit={submit} className="adm-card w-full max-w-md">
    <div className="flex justify-between items-center"><div><p className="adm-eyebrow">Monitoring term</p><h2 className="text-xl font-bold adm-text">Add keyword</h2></div><button type="button" onClick={onClose} className="p-2 adm-text-muted"><X size={18}/></button></div>
    <label className="block mt-5 text-xs font-bold adm-text-secondary">Keyword, phrase, campaign or hashtag</label><input autoFocus value={term} onChange={e=>setTerm(e.target.value)} maxLength={200} placeholder="e.g. Faith Always On" className="mt-2 w-full rounded-xl px-4 py-3 adm-surface-muted adm-text border adm-border outline-none" />
    <label className="block mt-4 text-xs font-bold adm-text-secondary">Type</label><select value={kind} onChange={e=>setKind(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-3 adm-surface-muted adm-text border adm-border">{["keyword","phrase","campaign","hashtag"].map(v=><option key={v} value={v}>{v}</option>)}</select>
    <div className="flex justify-end gap-2 mt-6"><button type="button" className="adm-btn-secondary" onClick={onClose}>Cancel</button><button className="adm-btn-primary" disabled={saving}>{saving ? "Saving…" : "Start monitoring"}</button></div>
  </form></div>;
}