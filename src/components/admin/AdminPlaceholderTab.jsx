import React from "react";
import { Construction } from "lucide-react";

export default function AdminPlaceholderTab({ title, description }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-24 px-4">
      <div className="w-24 h-24 bg-gradient-to-br from-[#00CFFF]/10 to-[#8A5CFF]/10 rounded-full flex items-center justify-center mb-6 border border-[#00CFFF]/20 shadow-[0_0_30px_rgba(0,207,255,0.1)] relative">
        <div className="absolute inset-0 bg-[#00CFFF]/5 rounded-full animate-ping"></div>
        <Construction className="w-10 h-10 text-[#00CFFF] relative z-10" />
      </div>
      <h2 className="text-3xl font-bold font-['Space_Grotesk'] mb-3 text-white">{title}</h2>
      <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">{description}</p>
      
      <div className="mt-12 inline-flex flex-col items-center p-6 bg-[#121826] rounded-2xl border border-white/5 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-[#FFD000] font-bold uppercase tracking-widest mb-2">
          <span className="w-2 h-2 rounded-full bg-[#FFD000] animate-pulse"></span>
          Structure Ready
        </div>
        <p className="text-xs text-gray-500 max-w-xs text-center">
          This module is part of the scalable backend architecture and will be fully integrated in the next rollout phase.
        </p>
      </div>
    </div>
  );
}