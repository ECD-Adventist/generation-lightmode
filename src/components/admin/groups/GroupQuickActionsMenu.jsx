import React, { useEffect, useRef } from "react";
import { Eye, Mail, Copy, Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function GroupQuickActionsMenu({ group, onClose, onView, onMessageLeader, onDelete, t, isDark }) {
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  const copyLeaderEmail = () => {
    navigator.clipboard.writeText(group.leader_email || "");
    toast.success("Leader email copied");
    onClose();
  };

  const items = [
    { icon: <Eye size={14} />, label: "View Details", onClick: () => { onView?.(); onClose(); } },
    { icon: <Mail size={14} />, label: "Message Leader", onClick: () => { onMessageLeader?.(); onClose(); } },
    { icon: <Copy size={14} />, label: "Copy Leader Email", onClick: copyLeaderEmail },
    { divider: true },
    { icon: <Trash2 size={14} />, label: "Delete Group", onClick: () => { onDelete?.(); onClose(); }, color: "#ef4444" },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 mt-1 w-52 rounded-xl border shadow-2xl z-50 overflow-hidden"
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