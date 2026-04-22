import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Check, ChevronRight, Lock, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import MobileBottomSheet from "@/components/mobile/MobileBottomSheet";

/**
 * Mobile-only consent sheet — LightMode branded (light mode).
 */
export default function MobileConsentSheet({ isOpen, onAccepted }) {
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!consent1 || !consent2) {
      toast.error("Please check both boxes to continue.");
      return;
    }
    setSaving(true);
    try {
      await base44.auth.updateMe({ privacy_consent_given: true });
      onAccepted();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <div className="relative overflow-hidden px-5 pt-4 pb-5" style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #FFFFFF 100%)" }}>
      <div className="absolute -top-6 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: "#1FB8FF", opacity: 0.2 }} />
      <div className="relative flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", boxShadow: "0 8px 20px rgba(11, 63, 217, 0.3)" }}>
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Before You Continue</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>Please review and agree</p>
        </div>
      </div>
    </div>
  );

  const ConsentCard = ({ checked, onToggle, icon: Icon, title, children }) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left rounded-2xl p-4 transition active:scale-[0.99]"
      style={{
        background: checked ? "rgba(31, 184, 255, 0.06)" : "#FFFFFF",
        border: checked ? "1.5px solid #1FB8FF" : "1.5px solid #E6ECF5",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: checked ? "linear-gradient(135deg, #1FB8FF, #0B3FD9)" : "#F6F8FC" }}>
          <Icon className="w-4 h-4" style={{ color: checked ? "#FFFFFF" : "#6B7FA0" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black mb-1" style={{ color: "#0B1B3D" }}>{title}</p>
          <p className="text-[12px] leading-relaxed" style={{ color: "#6B7FA0" }}>{children}</p>
        </div>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={checked ? { background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", border: "none" } : { background: "#FFFFFF", border: "2px solid #C0CAE0" }}>
          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );

  return (
    <MobileBottomSheet isOpen={isOpen} onClose={() => {}} dismissible={false} header={header} maxHeight="90dvh">
      <div className="px-5 py-4 space-y-3">
        <ConsentCard checked={consent1} onToggle={() => setConsent1(!consent1)} icon={Mail} title="Privacy & Electronic Communication">
          I consent to the submission of my information to be stored and processed by Generation LightMode and to be electronically contacted by email as part of this participation.
        </ConsentCard>

        <ConsentCard checked={consent2} onToggle={() => setConsent2(!consent2)} icon={Lock} title="Privacy Policy">
          I have read and agreed with the{" "}
          <Link to="/Privacy" target="_blank" className="font-bold underline" style={{ color: "#0B3FD9" }} onClick={(e) => e.stopPropagation()}>
            Privacy Policy
          </Link>{" "}
          of Generation LightMode.
        </ConsentCard>

        <button
          onClick={handleSubmit}
          disabled={saving || !consent1 || !consent2}
          className="w-full h-14 rounded-full font-black text-[15px] flex items-center justify-center gap-2 font-['Space_Grotesk'] mt-4 active:scale-[0.98] transition disabled:cursor-not-allowed"
          style={{
            background: (consent1 && consent2) ? "linear-gradient(90deg, #1FB8FF, #0B3FD9)" : "#E6ECF5",
            color: (consent1 && consent2) ? "#FFFFFF" : "#8A97B5",
            boxShadow: (consent1 && consent2) ? "0 8px 24px rgba(11, 63, 217, 0.35)" : "none",
          }}
        >
          {saving ? "Saving..." : <>Continue <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </MobileBottomSheet>
  );
}