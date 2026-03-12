import React from "react";
import { Settings, Save, Shield, Database, Cpu, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminSettingsTab() {
  const handleSave = () => {
    toast.success("System settings updated successfully", { icon: "🔒" });
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full mb-3 uppercase tracking-widest">
          <Lock size={12} /> Super Admin Only
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] flex items-center gap-3">
          System Settings
        </h1>
        <p className="text-gray-400 mt-1">Configure global platform behavior, AI integrations, and security.</p>
      </div>

      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
          <Shield className="text-[#8A5CFF] w-5 h-5" /> Platform Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400">Maintenance Mode</label>
            <select className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00CFFF] transition-colors">
              <option value="off">Disabled (Live)</option>
              <option value="on">Enabled (Maintenance)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400">Default User Role on Signup</label>
            <select className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00CFFF] transition-colors">
              <option value="user">Standard User</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-gray-400">Global Announcement Banner</label>
            <input type="text" placeholder="E.g., Welcome to Generation LightMode Phase 2!" className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00CFFF] transition-colors" />
          </div>
        </div>
      </div>

      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
          <Cpu className="text-[#FFD000] w-5 h-5" /> AI Assistant & Gamification
        </h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              Assistant System Prompt <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-500">LLM Core</span>
            </label>
            <textarea 
              className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg p-4 text-white min-h-[120px] focus:outline-none focus:border-[#00CFFF] transition-colors resize-y text-sm font-mono leading-relaxed"
              defaultValue="You are the Generation LightMode Assistant. Your purpose is to guide youth in their faith journey, provide biblical encouragement, and explain platform mechanics."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400">Base XP per Glow Drop</label>
              <input type="number" defaultValue={5} className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00CFFF] transition-colors" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-400">Content Moderation AI Strictness</label>
              <input type="range" min="1" max="10" defaultValue="8" className="w-full accent-[#00CFFF]" />
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>Lenient</span>
                <span>Balanced</span>
                <span>Strict</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-[#0B0F1A] font-bold px-8 py-6 rounded-xl hover:opacity-90 shadow-[0_0_20px_rgba(0,207,255,0.3)] transition-all transform hover:-translate-y-0.5">
          <Save className="w-5 h-5 mr-2" /> Save All Settings
        </Button>
      </div>
    </div>
  );
}