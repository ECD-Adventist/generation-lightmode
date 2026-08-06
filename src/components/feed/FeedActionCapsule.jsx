import React from "react";
import { Link } from "react-router-dom";

export function FeedActionItem({ icon, label, value, onClick, to, active = false, ariaLabel }) {
  const className = "min-w-0 h-[70px] sm:h-[76px] px-1 sm:px-2.5 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-left border-r border-[#31516D] last:border-r-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#18C8FF]";
  const content = (
    <>
      <span className={`shrink-0 ${active ? "text-[#F4C84A]" : "text-[#18C8FF]"}`}>{icon}</span>
      <span className="min-w-0 flex flex-col items-center sm:items-start leading-none">
        <span className="text-[9px] sm:text-[13px] font-bold text-white truncate">{label}</span>
        {value !== undefined && value !== null && <span className="mt-1 text-[8px] sm:text-[11px] font-medium text-[#A8B4C5] truncate">{value}</span>}
      </span>
    </>
  );

  return to ? <Link to={to} className={`${className} no-underline`} aria-label={ariaLabel || label}>{content}</Link> : <button type="button" onClick={onClick} className={className} aria-label={ariaLabel || label}>{content}</button>;
}

export default function FeedActionCapsule({ children, more }) {
  return (
    <div className="absolute left-2.5 right-2.5 bottom-4 z-30 flex items-center gap-2 pointer-events-none" onClick={(event) => event.stopPropagation()}>
      <div className="min-w-0 flex-1 rounded-full p-[3px] pointer-events-auto" style={{ background: "linear-gradient(105deg, #18C8FF 0%, #55D5C8 48%, #F4C84A 100%)", boxShadow: "0 8px 28px rgba(24,200,255,0.32), 0 8px 28px rgba(244,200,74,0.24)" }}>
        <div className="grid grid-cols-5 overflow-hidden rounded-full bg-[#08111F]/95 backdrop-blur-xl border border-white/10">
          {children}
        </div>
      </div>
      <div className="shrink-0 rounded-full p-[3px] pointer-events-auto" style={{ background: "linear-gradient(135deg, #18C8FF, #55D5C8 55%, #F4C84A)", boxShadow: "0 8px 28px rgba(24,200,255,0.30), 0 8px 24px rgba(244,200,74,0.18)" }}>{more}</div>
    </div>
  );
}