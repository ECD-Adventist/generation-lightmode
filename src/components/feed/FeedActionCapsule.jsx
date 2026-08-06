import React from "react";
import { Link } from "react-router-dom";

export function FeedActionItem({ icon, label, value, onClick, to, active = false, ariaLabel }) {
  const className = "min-w-0 h-[44px] sm:h-[48px] px-1 sm:px-2 flex items-center justify-center gap-1 border-r border-[#31516D] last:border-r-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#18C8FF]";
  const content = (
    <>
      <span className={`shrink-0 ${active ? "text-[#F4C84A]" : "text-[#18C8FF]"}`}>{icon}</span>
      {value !== undefined && value !== null && value !== 0 && <span className="text-[10px] sm:text-[11px] font-bold text-white/90 leading-none">{value}</span>}
    </>
  );

  return to ? <Link to={to} className={`${className} no-underline`} aria-label={ariaLabel || label}>{content}</Link> : <button type="button" onClick={onClick} className={className} aria-label={ariaLabel || label}>{content}</button>;
}

export default function FeedActionCapsule({ children, more, floating = true }) {
  return (
    <div
      className={floating
        ? "absolute left-2.5 right-2.5 bottom-4 z-30 flex items-center gap-2 pointer-events-none"
        : "relative mt-2 px-0.5 flex items-center gap-2 pointer-events-none"}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="min-w-0 flex-1 rounded-full p-[2px] pointer-events-auto" style={{ background: "linear-gradient(105deg, #18C8FF 0%, #55D5C8 48%, #F4C84A 100%)", boxShadow: "0 6px 20px rgba(24,200,255,0.28), 0 6px 20px rgba(244,200,74,0.20)" }}>
        <div className="grid grid-cols-5 overflow-hidden rounded-full bg-[#08111F]/95 backdrop-blur-xl border border-white/10">
          {children}
        </div>
      </div>
      <div className="shrink-0 rounded-full p-[2px] pointer-events-auto" style={{ background: "linear-gradient(135deg, #18C8FF, #55D5C8 55%, #F4C84A)", boxShadow: "0 6px 20px rgba(24,200,255,0.26), 0 6px 18px rgba(244,200,74,0.16)" }}>{more}</div>
    </div>
  );
}