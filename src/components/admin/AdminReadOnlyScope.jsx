import React from "react";
import { toast } from "sonner";

const WRITE_ACTION = /\b(add|approve|assign|auto.?assign|boost|create|delete|edit|invite|normalize|pin|publish|reject|remove|save|schedule|send|suspend|unpin|update|upload)\b/i;

export default function AdminReadOnlyScope({ enabled, children }) {
  if (!enabled) return children;

  const explain = () => toast.info("View-only access: officers cannot make changes.");
  const stopWriteClick = (event) => {
    const action = event.target.closest("button, a, [role='button']");
    if (!action) return;
    const label = [action.textContent, action.getAttribute("aria-label"), action.getAttribute("title")]
      .filter(Boolean)
      .join(" ");
    if (!WRITE_ACTION.test(label)) return;
    event.preventDefault();
    event.stopPropagation();
    explain();
  };
  const stopSubmit = (event) => {
    event.preventDefault();
    event.stopPropagation();
    explain();
  };

  return (
    <div onClickCapture={stopWriteClick} onSubmitCapture={stopSubmit} data-admin-read-only="true">
      {children}
    </div>
  );
}