import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ShieldCheck, User, MapPin, ChevronRight, Upload, Loader2, Check, Mail, Lock } from "lucide-react";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import MobileBottomSheet from "@/components/mobile/MobileBottomSheet";
import { AGE_RESTRICTION_MESSAGE, AGE_VERIFICATION_DISCLAIMER, getMinimumBirthDateForAge, isAtLeastAge } from "@/lib/agePolicy";

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

function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === current ? 32 : 18, background: i <= current ? "linear-gradient(90deg, #1FB8FF, #0B3FD9)" : "#E6ECF5" }} />
      ))}
    </div>
  );
}

/**
 * Mobile-only onboarding sheet — LightMode branded (light mode).
 * 3 steps: consent → profile → finishing touches.
 */
export default function MobileOnboardingSheet({ isOpen, onCompleted }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [phone, setPhone] = useState("");
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const initializeFromUser = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const d = user.data || {};
          setFullName(user.full_name || d.full_name || "");
          setCountry(user.country || d.country || "");
          setGender(user.gender || d.gender || "");
          setDob(user.date_of_birth || d.date_of_birth || "");
          setCity(user.city || d.city || "");
          setAddress(user.address || d.address || "");
          setPostalCode(user.postal_code || d.postal_code || "");
          setBio(user.bio || d.bio || "");
          setProfilePic(user.profile_picture_url || d.profile_picture_url || "");
          setPhone(user.phone || d.phone || "");
          if ((user.privacy_consent_given || d.privacy_consent_given) && (user.full_name || d.full_name) && (user.country || d.country) && (user.gender || d.gender) && (user.date_of_birth || d.date_of_birth) && isAtLeastAge(user.date_of_birth || d.date_of_birth) && (user.city || d.city) && (user.address || d.address) && (user.postal_code || d.postal_code)) {
            onCompleted({ full_name: user.full_name || d.full_name || "", country: user.country || d.country || "", gender: user.gender || d.gender || "", date_of_birth: user.date_of_birth || d.date_of_birth || "", city: user.city || d.city || "", address: user.address || d.address || "", postal_code: user.postal_code || d.postal_code || "", bio: user.bio || d.bio || "", profile_picture_url: user.profile_picture_url || d.profile_picture_url || "" });
          }
        }
      } catch (err) { console.error("Failed to load user data:", err); }
    };
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initializeFromUser();
    }
  }, [isOpen]);

  const handlePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try { const res = await base44.integrations.Core.UploadFile({ file }); setProfilePic(res.file_url); }
    catch { toast.error("Failed to upload photo."); }
    finally { setUploadingPic(false); }
    e.target.value = "";
  };

  const handleConsentNext = () => { if (!consent1 || !consent2) { toast.error("Please agree to both items to continue."); return; } setStep(1); };
  const handleProfileNext = () => {
    if (!fullName.trim()) { toast.error("Full name is required."); return; }
    if (!country) { toast.error("Country is required."); return; }
    if (!gender) { toast.error("Please select your gender."); return; }
    if (!dob) { toast.error("Date of birth is required."); return; }
    if (!isAtLeastAge(dob)) { toast.error(AGE_RESTRICTION_MESSAGE); return; }
    if (!city.trim()) { toast.error("City / Town is required."); return; }
    if (!address.trim()) { toast.error("Address is required."); return; }
    if (!postalCode.trim()) { toast.error("Postal code is required."); return; }
    if (!/^[A-Za-z0-9][A-Za-z0-9\s\-]{1,9}$/.test(postalCode.trim())) { toast.error("Please enter a valid postal / zip code."); return; }
    setStep(2);
  };

  const handleFinish = async () => {
    if (!isAtLeastAge(dob)) { toast.error(AGE_RESTRICTION_MESSAGE); return; }
    setSaving(true);
    try {
      const me = await base44.auth.me();
      await base44.auth.updateMe({ full_name: fullName.trim(), privacy_consent_given: true, country, gender, date_of_birth: dob, city: city.trim(), address: address.trim(), postal_code: postalCode.trim().toUpperCase(), bio: bio.trim(), profile_picture_url: profilePic || undefined, phone: phone.trim() || undefined });
      base44.functions.invoke("notifyTerritoryAdmins", { event_type: "new_user", user_email: me?.email, user_country: country, user_city: city.trim() }).catch(() => {});
      onCompleted({ full_name: fullName.trim(), country, gender, date_of_birth: dob, city, address, postal_code: postalCode, bio, profile_picture_url: profilePic });
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition";
  const inputStyle = { background: "#F6F8FC", border: "1.5px solid #E6ECF5", color: "#0B1B3D" };
  const labelCls = "block text-[11px] font-black uppercase tracking-wider mb-1.5";
  const labelStyle = { color: "#6B7FA0" };

  const StepIcon = step === 0 ? ShieldCheck : step === 1 ? User : MapPin;
  const stepTitle = step === 0 ? "Welcome to LightMode" : step === 1 ? "Your Profile" : "Almost Done!";
  const stepDesc = step === 0 ? "A quick setup before you enter" : step === 1 ? "Required — used throughout the app" : "Optional but helps the community";

  const header = (
    <div className="relative overflow-hidden px-5 pt-4 pb-4" style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #FFFFFF 100%)" }}>
      <div className="absolute -top-6 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: "#1FB8FF", opacity: 0.2 }} />
      <div className="relative text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-2.5" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", boxShadow: "0 6px 20px rgba(11, 63, 217, 0.3)" }}>
          <StepIcon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{stepTitle}</h2>
        <p className="text-[11px] mt-0.5" style={{ color: "#6B7FA0" }}>{stepDesc}</p>
        <div className="mt-3"><StepDots current={step} total={3} /></div>
      </div>
    </div>
  );

  const ConsentCard = ({ checked, onToggle, icon: IconCmp, title, children }) => (
    <button type="button" onClick={onToggle} className="w-full text-left rounded-2xl p-3.5 transition active:scale-[0.99]" style={{ background: checked ? "rgba(31, 184, 255, 0.06)" : "#FFFFFF", border: checked ? "1.5px solid #1FB8FF" : "1.5px solid #E6ECF5" }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: checked ? "linear-gradient(135deg, #1FB8FF, #0B3FD9)" : "#F6F8FC" }}>
          <IconCmp className="w-4 h-4" style={{ color: checked ? "#FFFFFF" : "#6B7FA0" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black mb-1" style={{ color: "#0B1B3D" }}>{title}</p>
          <p className="text-[12px] leading-relaxed" style={{ color: "#6B7FA0" }}>{children}</p>
        </div>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={checked ? { background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" } : { background: "#FFFFFF", border: "2px solid #C0CAE0" }}>
          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );

  return (
    <MobileBottomSheet isOpen={isOpen} onClose={() => {}} dismissible={false} header={header} maxHeight="94dvh">
      <div className="px-5 py-4 space-y-3">
        {step === 0 && (
          <>
            <ConsentCard checked={consent1} onToggle={() => setConsent1(!consent1)} icon={Mail} title="Privacy & Electronic Communication">
              I consent to the submission of my information to be stored and processed by Generation LightMode and to be electronically contacted by email.
            </ConsentCard>
            <ConsentCard checked={consent2} onToggle={() => setConsent2(!consent2)} icon={Lock} title="Privacy Policy">
              I have read and agreed with the{" "}
              <Link to="/Privacy" target="_blank" rel="noopener noreferrer" className="font-bold underline" style={{ color: "#0B3FD9" }} onClick={(e) => e.stopPropagation()}>
                Privacy Policy
              </Link>{" "}
              of Generation LightMode.
            </ConsentCard>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className={labelCls} style={labelStyle}>Full Name <span style={{ color: "#EF4444" }}>*</span></label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Country <span style={{ color: "#EF4444" }}>*</span></label>
              <BottomSheetSelect value={country} onChange={setCountry} options={COUNTRIES.map(c => ({value: c, label: c}))} placeholder="Select your country…" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Gender <span style={{ color: "#EF4444" }}>*</span></label>
              <div className="flex gap-2">
                {[["male","Male"],["female","Female"],["prefer_not_to_say","Prefer not to say"]].map(([val, label]) => {
                  const active = gender === val;
                  return (
                    <button key={val} type="button" onClick={() => setGender(val)} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition active:scale-95" style={active ? { background: "rgba(31, 184, 255, 0.1)", border: "1.5px solid #1FB8FF", color: "#0B3FD9" } : { background: "#FFFFFF", border: "1.5px solid #E6ECF5", color: "#6B7FA0" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Age Verification <span style={{ color: "#EF4444" }}>*</span></label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} max={getMinimumBirthDateForAge()} className={inputCls} style={{ ...inputStyle, colorScheme: "light" }} />
              <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "#6B7FA0" }}>{AGE_VERIFICATION_DISCLAIMER}</p>
            </div>
            <div className="pt-1 pb-0.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1" style={{ background: "#E6ECF5" }} />
                <span className="text-[10px] uppercase tracking-wider font-black" style={{ color: "#8A97B5" }}>Location Details</span>
                <div className="h-px flex-1" style={{ background: "#E6ECF5" }} />
              </div>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Street Address <span style={{ color: "#EF4444" }}>*</span></label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 12 Church Road" className={inputCls} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={labelStyle}>City / Town <span style={{ color: "#EF4444" }}>*</span></label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Nairobi" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Postal Code <span style={{ color: "#EF4444" }}>*</span></label>
                <input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="00100" maxLength={10} className={inputCls} style={inputStyle} />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className={labelCls} style={labelStyle}>Profile Photo</label>
              <div className="flex items-center gap-4">
                {profilePic ? (
                  <img src={profilePic} className="w-16 h-16 rounded-full object-cover" style={{ border: "2px solid #1FB8FF" }} />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center shrink-0" style={{ borderColor: "#1FB8FF", background: "#F6F8FC" }}>
                    <User className="w-6 h-6" style={{ color: "#8A97B5" }} />
                  </div>
                )}
                <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-black transition cursor-pointer active:scale-[0.98]" style={{ background: "rgba(31, 184, 255, 0.08)", border: "1.5px dashed #1FB8FF", color: "#0B3FD9" }}>
                  {uploadingPic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingPic ? "Uploading…" : "Upload Photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePicUpload} disabled={uploadingPic} />
                </label>
              </div>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Bio <span style={{ color: "#C0CAE0" }}>(optional)</span></label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the community about yourself…" maxLength={150} rows={3} className={`${inputCls} resize-none`} style={inputStyle} />
              <p className="text-[10px] mt-1 text-right" style={{ color: "#8A97B5" }}>{bio.length}/150</p>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Phone Number <span style={{ color: "#C0CAE0" }}>(optional)</span></label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000" className={inputCls} style={inputStyle} />
            </div>
            <p className="text-[11px] text-center pt-1" style={{ color: "#8A97B5" }}>You can always update these later from your profile settings.</p>
          </>
        )}
      </div>

      <div className="px-5 pt-3 pb-4 border-t" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
        {step === 0 && (
          <button onClick={handleConsentNext} disabled={!consent1 || !consent2} className="w-full h-14 rounded-full font-black text-[15px] flex items-center justify-center gap-2 font-['Space_Grotesk'] active:scale-[0.98] transition disabled:cursor-not-allowed" style={{ background: (consent1 && consent2) ? "linear-gradient(90deg, #1FB8FF, #0B3FD9)" : "#E6ECF5", color: (consent1 && consent2) ? "#FFFFFF" : "#8A97B5", boxShadow: (consent1 && consent2) ? "0 8px 24px rgba(11, 63, 217, 0.35)" : "none" }}>
            Agree & Continue <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {step === 1 && (
          <button onClick={handleProfileNext} className="w-full h-14 rounded-full font-black text-[15px] flex items-center justify-center gap-2 font-['Space_Grotesk'] active:scale-[0.98] transition" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.35)" }}>
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {step === 2 && (
          <button onClick={handleFinish} disabled={saving || uploadingPic} className="w-full h-14 rounded-full font-black text-[15px] flex items-center justify-center gap-2 font-['Space_Grotesk'] active:scale-[0.98] transition disabled:opacity-50" style={{ background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 8px 24px rgba(255, 159, 26, 0.4)" }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Enter LightMode ⚡"}
          </button>
        )}
      </div>
    </MobileBottomSheet>
  );
}