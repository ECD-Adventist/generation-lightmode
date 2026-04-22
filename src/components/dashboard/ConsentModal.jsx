import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileConsentSheet from "@/components/dashboard/MobileConsentSheet";

export default function ConsentModal({ isOpen, onAccepted }) {
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();

  // Mobile-only branded bottom sheet
  if (isMobile) {
    return <MobileConsentSheet isOpen={isOpen} onAccepted={onAccepted} />;
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg bg-[#0B0F1A] text-white border border-white/10 rounded-2xl p-0 z-[9999] [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#00CFFF]" />
          </div>
          <div>
            <h2 className="text-lg font-black font-['Space_Grotesk'] text-white">Before You Continue</h2>
            <p className="text-xs text-gray-400">Please review and agree to the following</p>
          </div>
        </div>

        {/* Consent Items */}
        <div className="px-6 py-5 space-y-5">
          {/* Consent 1 */}
          <div className="bg-[#121826] border border-white/5 rounded-xl p-4">
            <p className="text-sm font-bold text-white mb-1">Privacy and Electronic Communication Consent</p>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              I consent to the submission of my information, entered in the platform, to be stored and processed by the Generation LightMode service and to be electronically contacted by email as part of this participation process.
            </p>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setConsent1(!consent1)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  consent1 ? "bg-[#00CFFF] border-[#00CFFF]" : "bg-transparent border-gray-500 group-hover:border-[#00CFFF]/60"
                }`}
              >
                {consent1 && (
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-300 select-none">I consent.</span>
            </label>
          </div>

          {/* Consent 2 */}
          <div className="bg-[#121826] border border-white/5 rounded-xl p-4">
            <p className="text-sm font-bold text-white mb-1">Privacy Policy Consent</p>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              I have read and agreed with the{" "}
              <Link
                to="/Privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00CFFF] underline hover:text-[#00CFFF]/80"
              >
                Privacy Policy
              </Link>{" "}
              of Generation LightMode.
            </p>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setConsent2(!consent2)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  consent2 ? "bg-[#00CFFF] border-[#00CFFF]" : "bg-transparent border-gray-500 group-hover:border-[#00CFFF]/60"
                }`}
              >
                {consent2 && (
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-300 select-none">I agree.</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="px-6 pb-6">
          <Button
            onClick={handleSubmit}
            disabled={saving || !consent1 || !consent2}
            className="w-full bg-[#00CFFF] text-black font-black h-12 rounded-xl hover:bg-[#00CFFF]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-base"
          >
            {saving ? "Saving..." : "Continue to Dashboard →"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}