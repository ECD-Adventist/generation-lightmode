import React, { useEffect, useRef } from "react";
import { Copy, Eye, EyeOff, CheckCircle2, XCircle, Trash2, RotateCcw, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";

export default function DropActionsMenu({ drop, canPinDrop = false, onClose, onApprove, onReject, onHide, onUnhide, onDelete, onPin, onUnpin, t, isDark }) {
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  const copyContent = () => {
    const text = [drop.verse, drop.reflection].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Drop content copied");
    onClose();
  };

  const items = [];

  if (drop.status !== "approved") items.push({ icon: <CheckCircle2 size={14} />, label: "Approve", onClick: () => { onApprove?.(); onClose(); }, color: "#22c55e" });
  if (drop.status !== "rejected") items.push({ icon: <XCircle size={14} />,      label: "Reject",  onClick: () => { onReject?.(); onClose(); }, color: "#ef4444" });
  if (drop.hidden) items.push({ icon: <Eye size={14} />,    label: "Unhide",    onClick: () => { onUnhide?.(); onClose(); }, color: "#22c55e" });
  else             items.push({ icon: <EyeOff size={14} />, label: "Hide",      onClick: () => { onHide?.(); onClose(); }, color: "#8A5CFF" });

  if (canPinDrop) {
    if (drop.pinned) items.push({ icon: <PinOff size={14} />, label: "Unpin from top", onClick: () => { onUnpin?.(); onClose(); }, color: "#6B7280" });
    else             items.push({ icon: <Pin size={14} />,    label: "Pin to top",     onClick: () => { onPin?.(); onClose(); }, color: "#FFD000" });
  }

  items.push({ icon: <Copy size={14} />, label: "Copy content", onClick: copyContent });
  items.push({ divider: true });
  items.push({ icon: <Trash2 size={14} />, label: "Delete", onClick: () => { onDelete?.(); onClose(); }, color: "#ef4444" });

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-2xl z-50 overflow-hidden"
      style={{ background: t.surface, borderColor: t.border }}
    >
      {items.map((item, i) => item.divider ? (
        <div key={i} className="h-px" style={{ background: t.border }} />
      ) : (
        <button
          key={i}
          onClick={item.onClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition"
          style={{ background: "transparent", color: item.color || t.textPrimary }}
          onMouseOver={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(11,27,61,0.04)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}