import React from "react";
import { Settings, Save, Shield, Database, Cpu, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

export default function AdminSettingsTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const handleSave = () => {
    toast.success("System settings updated successfully", { icon: "🔒" });
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 border text-xs font-bold rounded-full mb-3 uppercase tracking-widest"
          style={{ background: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2", borderColor: isDark ? "rgba(239,68,68,0.2)" : "#fecaca", color: isDark ? "#f87171" : "#dc2626" }}>
          <Lock size={12} /> Super Admin Only
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] flex items-center gap-3" style={{ color: t.textPrimary }}>
          System Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Configure global platform behavior, AI integrations, and security.</p>
      </div>

      <div className="border rounded-2xl p-6 shadow-xl space-y-6" style={{ background: t.surface, borderColor: t.border }}>
        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-4" style={{ color: t.textPrimary, borderColor: t.border }}>
          <Shield className="w-5 h-5" style={{ color: isDark ? "#8A5CFF" : "#7e22ce" }} /> Platform Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold" style={{ color: t.textSecondary }}>Maintenance Mode</label>
            <select className="w-full border rounded-lg p-3 focus:outline-none transition-colors" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}>
              <option value="off">Disabled (Live)</option>
              <option value="on">Enabled (Maintenance)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" style={{ color: t.textSecondary }}>Default User Role on Signup</label>
            <select className="w-full border rounded-lg p-3 focus:outline-none transition-colors" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}>
              <option value="user">Standard User</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold" style={{ color: t.textSecondary }}>Global Announcement Banner</label>
            <input type="text" placeholder="E.g., Welcome to Generation LightMode Phase 2!" className="w-full border rounded-lg p-3 focus:outline-none transition-colors" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
          </div>
        </div>
      </div>

      <div className="border rounded-2xl p-6 shadow-xl space-y-6" style={{ background: t.surface, borderColor: t.border }}>
        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-4" style={{ color: t.textPrimary, borderColor: t.border }}>
          <Cpu className="w-5 h-5" style={{ color: isDark ? "#FFD000" : "#d97706" }} /> AI Assistant & Gamification
        </h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2" style={{ color: t.textSecondary }}>
              Assistant System Prompt <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: t.surfaceMuted, color: t.textMuted }}>LLM Core</span>
            </label>
            <textarea 
              className="w-full border rounded-lg p-4 min-h-[120px] focus:outline-none transition-colors resize-y text-sm font-mono leading-relaxed"
              style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
              defaultValue="You are the Generation LightMode Assistant. Your purpose is to guide youth in their faith journey, provide biblical encouragement, and explain platform mechanics."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: t.textSecondary }}>Base XP per Glow Drop</label>
              <input type="number" defaultValue={5} className="w-full border rounded-lg p-3 focus:outline-none transition-colors" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold" style={{ color: t.textSecondary }}>Content Moderation AI Strictness</label>
              <input type="range" min="1" max="10" defaultValue="8" className="w-full" style={{ accentColor: t.accent }} />
              <div className="flex justify-between text-xs font-medium" style={{ color: t.textMuted }}>
                <span>Lenient</span>
                <span>Balanced</span>
                <span>Strict</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="font-bold px-8 py-6 rounded-xl hover:opacity-90 shadow-lg transition-all transform hover:-translate-y-0.5" style={{ background: t.gradient, color: "#FFFFFF", border: "none" }}>
          <Save className="w-5 h-5 mr-2" /> Save All Settings
        </Button>
      </div>
    </div>
  );
}