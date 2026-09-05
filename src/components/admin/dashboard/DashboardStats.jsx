import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { AnimatedNumber } from "./useCountUp";

/* ─── Progress Ring (animated draw-in) ─────────────────────────────────── */
function ProgressRing({ percent, color, size = 44, strokeWidth = 3.5, delay = 0 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const target = circ - (Math.min(percent, 100) / 100) * circ;
  const gradId = `grad-ring-${color.replace("#", "")}-${Math.round(percent)}`;
  const [offset, setOffset] = React.useState(circ);

  React.useEffect(() => {
    setOffset(circ);
    const timer = setTimeout(() => setOffset(target), delay + 50);
    return () => clearTimeout(timer);
  }, [target, delay, circ]);

  return (
    <svg width={size} height={size} className="shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}18`} strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: "stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)",
          filter: `drop-shadow(0 0 3px ${color}80)`,
        }} />
    </svg>
  );
}

/* ─── Inline Sparkline (trace animation + pulsing endpoint) ─────────────── */
function Sparkline({ color, points, delay = 0 }) {
  const pathRef = React.useRef(null);
  const [length, setLength] = React.useState(0);
  const [drawn, setDrawn] = React.useState(false);

  // The hero trend is the actual six-month registration series.
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 100, h = 28;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * w,
    y: h - ((p - min) / (max - min || 1)) * h,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];

  React.useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setLength(len);
      setDrawn(false);
      const timer = setTimeout(() => setDrawn(true), delay + 50);
      return () => clearTimeout(timer);
    }
  }, [delay, path]);

  const gradId = `sp-${color.replace("#", "")}`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill fades in after line is drawn */}
      <path d={`${path} L${w},${h} L0,${h} Z`} fill={`url(#${gradId})`}
        style={{ opacity: drawn ? 1 : 0, transition: `opacity 0.8s ease ${delay + 800}ms` }} />
      {/* Line traces from left to right */}
      <path ref={pathRef} d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{
          strokeDasharray: length,
          strokeDashoffset: drawn ? 0 : length,
          transition: "stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1)",
          filter: `drop-shadow(0 0 3px ${color}aa)`,
        }} />
      {/* Pulsing endpoint dot */}
      {drawn && (
        <circle cx={last.x} cy={last.y} r="2.2" fill={color}
          style={{ animation: "spark-pulse 1.6s ease-in-out infinite", filter: `drop-shadow(0 0 4px ${color})` }} />
      )}
      <style>{`@keyframes spark-pulse { 0%,100% { opacity: 1; r: 2.2; } 50% { opacity: 0.5; r: 3.2; } }`}</style>
    </svg>
  );
}

export default function DashboardStats({ stats, t, isDark }) {
  const maxVal = Math.max(...stats.map(s => typeof s.value === "number" ? s.value : 0), 1);

  // Each card gets a distinct ring percentage so every ring animates visibly.
  // Non-zero values get at least 35% fill (scaled by their relative size) for visual rhythm.
  const getRingPercent = (s) => {
    if (typeof s.value !== "number") return 60;
    if (s.value === 0) return 8;
    if (s.suffix === "%") return Math.min(s.value, 100);
    // Scale relative to max but ensure minimum visible progress
    const rel = (s.value / maxVal) * 100;
    return Math.max(rel, 35);
  };

  return (
    <>
      <style>{`
        @keyframes bento-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* BENTO GRID — varied sizes: first card is hero (2x), others are compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const pct = getRingPercent(s);
          const isHero = i === 0; // First stat takes 2x width on larger screens
          const delay = i * 80;

          const card = (
            <div className="group relative rounded-[1.25rem] p-4 border transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${t.surface} 0%, ${t.surface} 70%, ${s.color}08 100%)`
                  : `linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 70%, ${s.color}06 100%)`,
                borderColor: isDark ? t.border : "rgba(0,0,0,0.04)",
                boxShadow: isDark ? "0 2px 16px rgba(0,0,0,0.25)" : "0 2px 12px rgba(15,23,42,0.04)",
                animation: `bento-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
              }}>
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
                background: `radial-gradient(circle at 80% 20%, ${s.color}18, transparent 65%)`
              }} />
              {/* Top gradient accent line */}
              <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-60"
                style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
              {/* Arrow on hover */}
              {s.to && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 -translate-x-1">
                  <ArrowUpRight size={14} style={{ color: s.color }} />
                </div>
              )}

              <div className="relative z-10 flex flex-col h-full">
                {/* Header row: ring + icon + trend */}
                <div className="flex items-start justify-between mb-3">
                  <div className="relative">
                    <ProgressRing percent={pct} color={s.color} delay={delay + 200} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon size={16} style={{ color: s.color }} />
                    </div>
                  </div>
                  {s.trend && (
                    <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg" style={{
                      background: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.06)",
                      border: `1px solid ${isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.1)"}`
                    }}>
                      <TrendingUp size={9} className={isDark ? "text-green-400" : "text-green-600"} />
                      <span className="text-[8px] font-bold" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>{s.trend}</span>
                    </div>
                  )}
                </div>

                {/* Big animated number */}
                <p className={`${isHero ? "text-[34px]" : "text-[26px]"} font-black font-['Space_Grotesk'] leading-none tracking-tight`} style={{ color: t.textPrimary }}>
                  {typeof s.value === "number"
                    ? `${s.value.toLocaleString(undefined, { minimumFractionDigits: s.decimals || 0, maximumFractionDigits: s.decimals || 0 })}${s.suffix || ''}`
                    : s.value}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mt-1.5" style={{ color: t.textMuted }}>{s.label}</p>

                {/* Sparkline on hero card only */}
                {isHero && s.sparkline?.length > 1 && (
                  <div className="mt-3 opacity-80">
                    <Sparkline color={s.color} points={s.sparkline} delay={delay + 300} />
                  </div>
                )}
              </div>
            </div>
          );

          // Bento sizing: first card spans 2 cols on md+
          const wrapperClass = isHero ? "md:col-span-2" : "";

          return s.to ? (
            <Link key={i} to={s.to} className={`block ${wrapperClass}`}>{card}</Link>
          ) : (
            <div key={i} className={wrapperClass}>{card}</div>
          );
        })}
      </div>
    </>
  );
}