import React from "react";
import { Building2 } from "lucide-react";

export default function InstitutionOwnerBadge({ applications = [] }) {
  if (applications.length === 0) return null;

  const institutionName = applications[0]?.institution_name;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FFD000]/15 to-[#00CFFF]/15 border border-[#FFD000]/30">
      <Building2 className="w-3.5 h-3.5 text-[#FFD000]" />
      <span className="text-[11px] font-bold text-[#FFD000] uppercase tracking-wider">
        {applications.length === 1 ? institutionName : `${applications.length} Institutions`}
      </span>
    </div>
  );
}