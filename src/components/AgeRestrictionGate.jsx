import React from "react";
import { ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AGE_RESTRICTION_MESSAGE, isAtLeastAge, PRIVACY_CONTACT_EMAIL } from "@/lib/agePolicy";

export default function AgeRestrictionGate({ user, children }) {
  if (!user?.date_of_birth || isAtLeastAge(user.date_of_birth)) return children;

  return (
    <div className="min-h-screen flex items-center justify-center px-5 font-['Inter']" style={{ background: "linear-gradient(180deg, #F6F8FC 0%, #EEF3FF 100%)", color: "#0B1B3D" }}>
      <div className="w-full max-w-md rounded-3xl p-6 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 16px 48px rgba(11, 63, 217, 0.12)" }}>
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-black font-['Space_Grotesk'] mb-2">Age Requirement</h1>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "#4A5878" }}>{AGE_RESTRICTION_MESSAGE}</p>
        <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="block w-full rounded-full py-3 text-sm font-black no-underline mb-3" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
          Contact Privacy Team
        </a>
        <button type="button" onClick={() => base44.auth.logout("/Home")} className="w-full rounded-full py-3 text-sm font-bold" style={{ background: "#F6F8FC", color: "#4A5878", border: "1px solid #E6ECF5" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}