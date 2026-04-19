import React, { useEffect, useRef } from "react";
import { MoreVertical, MessageSquare, Copy, Bell, Ban, CheckCircle2, Edit2, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export default function UserQuickActionsMenu({ targetUser, onClose, onOpenDetail, onEditRole, onSendNotification, onSuspendToggle, onDelete, t, isDark, anchor }) {
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  const copyEmail = () => {
    navigator.clipboard.writeText(targetUser.email);
    toast.success("Email copied to clipboard");
    onClose();
  };

  const isSuspended = targetUser.status === "suspended";

  const menuItems = [
    { icon: <Eye size={14} />, label: "View Details", onClick: () => { onOpenDetail(); onClose(); } },
    { icon: <Edit2 size={14} />, label: "Edit Role", onClick: () => { onEditRole(); onClose(); } },
    { icon: <Bell size={14} />, label: "Send Notification", onClick: () => { onSendNotification(); onClose(); } },
    { icon: <Copy size={14} />, label: "Copy Email", onClick: copyEmail },
    {
      icon: isSuspended ? <CheckCircle2 size={14} /> : <Ban size={14} />,
      label: isSuspended ? "Reactivate User" : "Suspend User",
      onClick: () => { onSuspendToggle(); onClose(); },
      color: isSuspended ? "#22c55e" : "#f59e0b",
    },
    { divider: true },
    { icon: <Trash2 size={14} />, label: "Remove User", onClick: () => { onDelete(); onClose(); }, color: "#ef4444" },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 mt-1 w-52 rounded-xl border shadow-2xl z-50 overflow-hidden"
      style={{ background: t.surface, borderColor: t.border }}
    >
      {menuItems.map((item, i) => item.divider ? (
        <div key={i} className="h-px" style={{ background: t.border }} />
      ) : (
        <button
          key={i}
          onClick={item.onClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition hover:opacity-90"
          style={{
            background: "transparent",
            color: item.color || t.textPrimary,
          }}
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