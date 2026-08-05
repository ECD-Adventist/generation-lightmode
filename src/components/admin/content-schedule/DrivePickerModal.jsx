import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Folder, FileVideo, FileImage, File as FileIcon, Search, ChevronLeft, AlertCircle } from "lucide-react";

const fmtSize = (bytes) => {
  if (!bytes) return "";
  const mb = bytes / 1048576;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
};

const iconFor = (file) => {
  if (file.is_folder) return <Folder size={16} style={{ color: "#FFD000" }} />;
  if (file.mime_type?.startsWith("video/")) return <FileVideo size={16} style={{ color: "#00CFFF" }} />;
  if (file.mime_type?.startsWith("image/")) return <FileImage size={16} style={{ color: "#8A5CFF" }} />;
  return <FileIcon size={16} style={{ color: "#8A9BB0" }} />;
};

export default function DrivePickerModal({ open, onClose, onPick }) {
  const [path, setPath] = useState([{ id: "root", name: "My Drive" }]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const current = path[path.length - 1];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("browseGoogleDrive", {
        folder_id: current.id,
        search: activeSearch,
      });
      setFiles(res.data?.files || []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not reach Google Drive");
    }
    setLoading(false);
  }, [current.id, activeSearch]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) { setPath([{ id: "root", name: "My Drive" }]); setSearch(""); setActiveSearch(""); }
  }, [open]);

  const handleRowClick = (file) => {
    if (file.is_folder) {
      setActiveSearch("");
      setSearch("");
      setPath(p => [...p, { id: file.id, name: file.name }]);
    } else {
      onPick(file);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-[#0E1524] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk'] text-base">Pick a file from Google Drive</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          {path.length > 1 && !activeSearch && (
            <button onClick={() => setPath(p => p.slice(0, -1))}
              className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <ChevronLeft size={15} />
            </button>
          )}
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 bg-white/5 border border-white/10">
            <Search size={13} className="text-white/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setActiveSearch(search.trim())}
              placeholder="Search your Drive…"
              className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            {activeSearch && (
              <button onClick={() => { setSearch(""); setActiveSearch(""); }} className="text-[11px] font-bold text-cyan-400">Clear</button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-white/40 mb-2 truncate">
          {activeSearch ? `Search results for "${activeSearch}"` : path.map(p => p.name).join(" / ")}
        </p>

        <div className="max-h-[380px] overflow-y-auto space-y-1">
          {loading && <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-cyan-400" /></div>}
          {!loading && error && (
            <div className="flex items-start gap-2 rounded-xl p-3 bg-red-500/10 border border-red-500/25">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
          {!loading && !error && files.length === 0 && (
            <p className="text-xs text-white/40 text-center py-10">This folder is empty.</p>
          )}
          {!loading && !error && files.map(file => (
            <button key={file.id} onClick={() => handleRowClick(file)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition hover:bg-white/5 border border-transparent hover:border-white/10">
              <span className="shrink-0">{iconFor(file)}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[12.5px] font-semibold truncate">{file.name}</span>
                {!file.is_folder && <span className="block text-[10px] text-white/35">{fmtSize(file.size)}</span>}
              </span>
              {file.is_folder && <span className="text-[10px] font-bold text-white/30">Open</span>}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}