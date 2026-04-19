import React from "react";

// Injects global admin-theme utility styles via a <style> tag.
// Avoids Vite CSS-import issues; stays co-located with AdminThemeContext.
const CSS = `
/* ── CSS variables keyed to theme attribute ─────────────────────── */
html[data-admin-theme="dark"] {
  --adm-bg: #060B18;
  --adm-surface: #0F1421;
  --adm-surface-muted: #0B1226;
  --adm-surface-alt: #0A1F4A;
  --adm-border: rgba(255,255,255,0.06);
  --adm-border-strong: rgba(31,184,255,0.3);
  --adm-text: #FFFFFF;
  --adm-text-secondary: #C8D0E0;
  --adm-text-muted: #8A97B5;
  --adm-accent: #5AC8FF;
  --adm-accent-sky: #1FB8FF;
  --adm-accent-deep: #0B3FD9;
  --adm-accent-soft: rgba(31,184,255,0.12);
  --adm-gold: #FFD60A;
  --adm-gold-soft: rgba(255,214,10,0.15);
  --adm-success: #4ade80;
  --adm-danger: #f87171;
  --adm-shadow: 0 2px 16px rgba(0,0,0,0.25);
  --adm-shadow-lg: 0 4px 24px rgba(0,0,0,0.4);
  --adm-gradient: linear-gradient(135deg, #5AC8FF 0%, #1FB8FF 50%, #0B3FD9 100%);
  --adm-gradient-mesh: linear-gradient(135deg, #060B18 0%, #0B1226 25%, #0F1730 50%, #0A1F4A 75%, #060B18 100%);
}

html[data-admin-theme="light"] {
  --adm-bg: #F4F8FF;
  --adm-surface: #FFFFFF;
  --adm-surface-muted: #F6F9FE;
  --adm-surface-alt: #EEF3FC;
  --adm-border: rgba(11,63,217,0.08);
  --adm-border-strong: rgba(11,63,217,0.18);
  --adm-text: #0B1B3D;
  --adm-text-secondary: #334261;
  --adm-text-muted: #6B7FA0;
  --adm-accent: #0B3FD9;
  --adm-accent-sky: #1FB8FF;
  --adm-accent-deep: #0B3FD9;
  --adm-accent-soft: rgba(11,63,217,0.08);
  --adm-gold: #FF9F1A;
  --adm-gold-soft: #FEF3C7;
  --adm-success: #16a34a;
  --adm-danger: #DC2626;
  --adm-shadow: 0 2px 12px rgba(15,23,42,0.04);
  --adm-shadow-lg: 0 4px 16px rgba(11,63,217,0.08);
  --adm-gradient: linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%);
  --adm-gradient-mesh: linear-gradient(135deg, #EBF1FF 0%, #E3EAFF 25%, #EDE5FF 50%, #F0ECFF 75%, #EBF1FF 100%);
}

html:not([data-admin-theme]) {
  --adm-bg: #060B18;
  --adm-surface: #0F1421;
  --adm-text: #FFFFFF;
  --adm-accent: #5AC8FF;
}

/* ── Reusable utility classes ───────────────────────────────────── */
.adm-bg       { background: var(--adm-bg) !important; }
.adm-surface  { background: var(--adm-surface) !important; }
.adm-surface-muted { background: var(--adm-surface-muted) !important; }

.adm-text            { color: var(--adm-text) !important; }
.adm-text-secondary  { color: var(--adm-text-secondary) !important; }
.adm-text-muted      { color: var(--adm-text-muted) !important; }
.adm-text-accent     { color: var(--adm-accent) !important; }
.adm-text-gold       { color: var(--adm-gold) !important; }

.adm-border          { border-color: var(--adm-border) !important; }
.adm-border-strong   { border-color: var(--adm-border-strong) !important; }

/* ── Premium card (Dashboard bento DNA) ─────────────────────────── */
.adm-card {
  position: relative;
  border-radius: 1.25rem;
  padding: 1.25rem;
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  box-shadow: var(--adm-shadow);
  transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, border-color 0.3s ease;
  overflow: hidden;
}
.adm-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--adm-shadow-lg);
  border-color: var(--adm-border-strong);
}
.adm-card-accent::before {
  content: "";
  position: absolute;
  top: 0; left: 16px; right: 16px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--adm-accent), transparent);
  opacity: 0.7;
}

/* ── Hero block (Dashboard hero DNA) ────────────────────────────── */
.adm-hero {
  position: relative;
  border-radius: 1.75rem;
  padding: 2px;
  overflow: hidden;
}
.adm-hero::before {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 200%; height: 600%;
  background: conic-gradient(from 0deg, transparent 55%, #5AC8FF 68%, #1FB8FF 78%, #0B3FD9 88%, #FFD60A 95%, transparent 100%);
  animation: adm-hero-spin 8s linear infinite;
  z-index: 0;
  pointer-events: none;
}
html[data-admin-theme="light"] .adm-hero::before { opacity: 0.75; }
html[data-admin-theme="dark"]  .adm-hero::before { opacity: 0.95; }

.adm-hero-inner {
  position: relative;
  z-index: 2;
  border-radius: calc(1.75rem - 2px);
  overflow: hidden;
  background: var(--adm-gradient-mesh);
}
.adm-hero-inner::after {
  content: "";
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 30%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
  animation: adm-hero-sweep 6s infinite ease-in-out;
  pointer-events: none;
  z-index: 3;
}
html[data-admin-theme="light"] .adm-hero-inner::after {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
}
@keyframes adm-hero-spin {
  0%   { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes adm-hero-sweep {
  0%   { transform: translateX(-150%) skewX(-20deg); }
  100% { transform: translateX(300%) skewX(-20deg); }
}

/* ── Section eyebrow / big numbers ──────────────────────────────── */
.adm-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--adm-accent);
}
.adm-stat-big {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-weight: 900;
  font-size: 26px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--adm-text);
}
.adm-stat-hero { font-size: 34px; }
.adm-stat-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--adm-text-muted);
  margin-top: 6px;
}

/* ── Buttons ────────────────────────────────────────────────────── */
.adm-btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
  background: var(--adm-gradient);
  border: none;
  cursor: pointer;
  box-shadow: var(--adm-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.adm-btn-primary:hover { transform: translateY(-1px); box-shadow: var(--adm-shadow-lg); }

.adm-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--adm-text-secondary);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  cursor: pointer;
  transition: all 0.2s ease;
}
.adm-btn-secondary:hover {
  color: var(--adm-accent);
  border-color: var(--adm-border-strong);
  background: var(--adm-accent-soft);
}

/* ── Badges ─────────────────────────────────────────────────────── */
.adm-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--adm-accent-soft);
  color: var(--adm-accent);
  border: 1px solid var(--adm-border-strong);
}
.adm-badge-gold    { background: var(--adm-gold-soft); color: var(--adm-gold); border-color: var(--adm-gold-soft); }
.adm-badge-success { background: rgba(34,197,94,0.12); color: var(--adm-success); border-color: rgba(34,197,94,0.25); }
.adm-badge-danger  { background: rgba(239,68,68,0.12); color: var(--adm-danger); border-color: rgba(239,68,68,0.25); }

/* ── Scrollbar ──────────────────────────────────────────────────── */
html[data-admin-theme="dark"] .adm-scroll::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.12); border-radius: 3px; }
html[data-admin-theme="light"] .adm-scroll::-webkit-scrollbar-thumb { background: rgba(11,63,217,0.15); border-radius: 3px; }
.adm-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.adm-scroll::-webkit-scrollbar-track { background: transparent; }

@keyframes adm-fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.adm-fade-up { animation: adm-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }

/* ── Theme-aware native date inputs ─────────────────────────────── */
html[data-admin-theme="dark"] input[type="date"],
html[data-admin-theme="dark"] input[type="datetime-local"],
html[data-admin-theme="dark"] input[type="time"] { color-scheme: dark; }
html[data-admin-theme="light"] input[type="date"],
html[data-admin-theme="light"] input[type="datetime-local"],
html[data-admin-theme="light"] input[type="time"] { color-scheme: light; }
`;

export function AdminThemeStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}