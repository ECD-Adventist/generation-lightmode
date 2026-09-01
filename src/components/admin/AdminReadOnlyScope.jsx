import React, { useEffect, useRef } from "react";
import { toast } from "sonner";

const WRITE_ACTION = /\b(add|approve|assign|auto.?assign|boost|create|delete|edit|invite|normalize|pin|publish|reject|remove|save|schedule|send|suspend|unpin|update|upload)\b/i;
// Destructive controls are removed from the DOM view entirely — officers are
// non-technical, so they should never see a button that could lose data.
const DESTRUCTIVE_ACTION = /\b(delete|remove|purge|wipe|erase|destroy|suspend|unsuspend|ban|revoke|reset|discard|archive)\b/i;
const CONTROL_SELECTOR = "button, a, [role='button'], [role='menuitem']";

export default function AdminReadOnlyScope({ enabled, children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const hideDestructive = () => {
      container.querySelectorAll(CONTROL_SELECTOR).forEach((el) => {
        if (el.dataset.readOnlySwept === "1") return;
        el.dataset.readOnlySwept = "1";
        const label = [el.textContent, el.getAttribute("aria-label"), el.getAttribute("title")]
          .filter(Boolean)
          .join(" ");
        if (DESTRUCTIVE_ACTION.test(label)) el.style.display = "none";
      });
    };

    hideDestructive();
    const observer = new MutationObserver(hideDestructive);
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled, children]);

  if (!enabled) return children;

  const explain = () => toast.info("View-only access: officers cannot make changes.");
  const stopWriteClick = (event) => {
    const action = event.target.closest(CONTROL_SELECTOR);
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
    <div ref={containerRef} onClickCapture={stopWriteClick} onSubmitCapture={stopSubmit} data-admin-read-only="true">
      {children}
    </div>
  );
}