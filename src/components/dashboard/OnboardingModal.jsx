import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ShieldCheck, User, MapPin, ChevronRight, Upload, Loader2 } from "lucide-react";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Bangladesh","Belgium","Benin",
  "Bolivia","Botswana","Brazil","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Central African Republic",
  "Chad","Chile","China","Colombia","Congo","Côte d'Ivoire","Cuba","DR Congo","Denmark","Ecuador","Egypt",
  "Eritrea","Ethiopia","Finland","France","Gabon","Ghana","Germany","Guatemala","Guinea","Haiti","Honduras",
  "Hungary","India","Indonesia","Iran","Iraq","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya",
  "Lesotho","Liberia","Libya","Madagascar","Malawi","Malaysia","Mali","Mauritania","Mexico","Morocco",
  "Mozambique","Myanmar","Namibia","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea",
  "Norway","Pakistan","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Rwanda","Saudi Arabia","Senegal","Sierra Leone","Somalia","South Africa","South Korea","South Sudan",
  "Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Tanzania","Thailand","Togo","Tunisia",
  "Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Vietnam",
  "Yemen","Zambia","Zimbabwe","Other"
];

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-1.5 justify-center mb-4">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all ${i < current ? "bg-[#00CFFF] w-6" : i === current ? "bg-[#00CFFF] w-10" : "bg-white/10 w-6"}`} />
      ))}
    </div>
  );
}

export default function OnboardingModal({ isOpen, onCompleted }) {
  const [step, setStep] = useState(0); // 0=consent, 1=profile, 2=details
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Step 0 — Consent
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);

  // Step 1 — Core profile
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Step 2 — Extra details
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [phone, setPhone] = useState("");

  const handlePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setProfilePic(res.file_url);
    } catch {
      toast.error("Failed to upload photo.");
    } finally {
      setUploadingPic(false);
    }
    e.target.value = "";
  };

  const handleConsentNext = () => {
    if (!consent1 || !consent2) { toast.error("Please agree to both items to continue."); return; }
    setStep(1);
  };

  const handleProfileNext = () => {
    if (!fullName.trim()) { toast.error("Full name is required."); return; }
    if (!country) { toast.error("Country is required."); return; }
    if (!gender) { toast.error("Please select your gender."); return; }
    if (!dob) { toast.error("Date of birth is required."); return; }
    if (!city.trim()) { toast.error("City / Town is required."); return; }
    if (!address.trim()) { toast.error("Address is required."); return; }
    if (!postalCode.trim()) { toast.error("Postal code is required."); return; }
    if (!/^[A-Za-z0-9][A-Za-z0-9\s\-]{1,9}$/.test(postalCode.trim())) {
      toast.error("Please enter a valid postal / zip code (e.g. 10001 or SW1A 1AA).");
      return;
    }
    setStep(2);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: fullName.trim(),
        privacy_consent_given: true,
        country,
        gender,
        date_of_birth: dob,
        city: city.trim(),
        address: address.trim(),
        postal_code: postalCode.trim().toUpperCase(),
        bio: bio.trim(),
        profile_picture_url: profilePic || undefined,
        phone: phone.trim() || undefined,
      });
      onCompleted({ full_name: fullName.trim(), country, gender, date_of_birth: dob, city, address, postal_code: postalCode, bio, profile_picture_url: profilePic });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md bg-[#0B0F1A] text-white border border-white/10 rounded-2xl p-0 z-[9999] [&>button]:hidden overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-[#00CFFF]/20 to-[#8A5CFF]/20 border border-[#00CFFF]/30 flex items-center justify-center mb-3">
            {step === 0 ? <ShieldCheck className="w-6 h-6 text-[#00CFFF]" /> : step === 1 ? <User className="w-6 h-6 text-[#00CFFF]" /> : <MapPin className="w-6 h-6 text-[#8A5CFF]" />}
          </div>
          <h2 className="text-xl font-black font-['Space_Grotesk'] text-white">
            {step === 0 ? "Welcome to Generation LightMode" : step === 1 ? "Your Profile" : "Almost Done!"}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {step === 0 ? "A quick setup before you enter" : step === 1 ? "Required — used throughout the platform" : "Optional but helps the community know you"}
          </p>
          <div className="mt-4">
            <StepIndicator current={step} total={3} />
          </div>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-4">

          {/* ── STEP 0: CONSENT ── */}
          {step === 0 && (
            <>
              <div className="bg-[#121826] border border-white/5 rounded-xl p-4">
                <p className="text-sm font-bold text-white mb-1">Privacy & Electronic Communication Consent</p>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                  I consent to the submission of my information to be stored and processed by Generation LightMode and to be electronically contacted by email as part of this participation process.
                </p>
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setConsent1(!consent1)}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${consent1 ? "bg-[#00CFFF] border-[#00CFFF]" : "border-gray-500"}`}>
                    {consent1 && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-sm text-gray-300 select-none">I consent.</span>
                </label>
              </div>
              <div className="bg-[#121826] border border-white/5 rounded-xl p-4">
                <p className="text-sm font-bold text-white mb-1">Privacy Policy</p>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                  I have read and agreed with the{" "}
                  <Link to="/Privacy" target="_blank" className="text-[#00CFFF] underline hover:text-[#00CFFF]/80">Privacy Policy</Link>{" "}
                  of Generation LightMode.
                </p>
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setConsent2(!consent2)}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${consent2 ? "bg-[#00CFFF] border-[#00CFFF]" : "border-gray-500"}`}>
                    {consent2 && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-sm text-gray-300 select-none">I agree.</span>
                </label>
              </div>
            </>
          )}

          {/* ── STEP 1: REQUIRED PROFILE ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Country <span className="text-red-400">*</span></label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CFFF]/40 text-sm appearance-none"
                >
                  <option value="">Select your country…</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Gender <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  {[["male","Male"],["female","Female"],["prefer_not_to_say","Prefer not to say"]].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGender(val)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${gender === val ? "bg-[#00CFFF]/15 border-[#00CFFF]/50 text-[#00CFFF]" : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Date of Birth <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CFFF]/40 text-sm [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:scale-125"
                />
              </div>

              <div className="pt-1 pb-0.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Location Details</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Street Address <span className="text-red-400">*</span></label>
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 12 Church Road"
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">City / Town <span className="text-red-400">*</span></label>
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Nairobi"
                    className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Postal Code <span className="text-red-400">*</span></label>
                  <input
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="e.g. 00100"
                    maxLength={10}
                    className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: OPTIONAL EXTRAS ── */}
          {step === 2 && (
            <>
              {/* Profile Photo */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Profile Photo</label>
                <div className="flex items-center gap-4">
                  {profilePic ? (
                    <img src={profilePic} className="w-16 h-16 rounded-full object-cover border-2 border-[#00CFFF]/40" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#121826] border-2 border-dashed border-white/20 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/20 text-sm text-gray-400 hover:border-[#00CFFF]/40 hover:text-[#00CFFF] transition cursor-pointer">
                    {uploadingPic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingPic ? "Uploading…" : "Upload Photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePicUpload} disabled={uploadingPic} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Bio <span className="text-gray-600">(optional)</span></label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell the community about yourself…"
                  maxLength={150}
                  rows={3}
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 text-sm resize-none"
                />
                <p className="text-[10px] text-gray-600 mt-0.5 text-right">{bio.length}/150</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number <span className="text-gray-600">(optional)</span></label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+255 700 000 000"
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40 text-sm"
                />
              </div>

              <p className="text-[11px] text-gray-500 text-center pt-1">You can always update these later from your profile settings.</p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 border-t border-white/5">
          {step === 0 && (
            <button onClick={handleConsentNext} className="w-full bg-[#00CFFF] text-black font-black h-12 rounded-xl hover:bg-[#00CFFF]/80 transition text-base flex items-center justify-center gap-2">
              Agree & Continue <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {step === 1 && (
            <button onClick={handleProfileNext} className="w-full bg-[#00CFFF] text-black font-black h-12 rounded-xl hover:bg-[#00CFFF]/80 transition text-base flex items-center justify-center gap-2">
              Next <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {step === 2 && (
            <button onClick={handleFinish} disabled={saving || uploadingPic} className="w-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-white font-black h-12 rounded-xl hover:opacity-90 transition text-base flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Enter LightMode ⚡"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}