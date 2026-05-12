import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ShieldCheck, User, MapPin, ChevronRight, Upload, Loader2 } from "lucide-react";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileOnboardingSheet from "@/components/dashboard/MobileOnboardingSheet";

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
        <div key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === current ? 40 : 24, background: i <= current ? "linear-gradient(90deg, #1FB8FF, #0B3FD9)" : "#E6ECF5" }} />
      ))}
    </div>
  );
}

export default function OnboardingModal({ isOpen, onCompleted }) {
  const isMobile = useIsMobile();
  return isMobile
    ? <MobileOnboardingSheet isOpen={isOpen} onCompleted={onCompleted} />
    : <DesktopOnboardingModal isOpen={isOpen} onCompleted={onCompleted} />;
}

function DesktopOnboardingModal({ isOpen, onCompleted }) {
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
          if ((user.privacy_consent_given || d.privacy_consent_given) && (user.full_name || d.full_name) && (user.country || d.country) && (user.gender || d.gender) && (user.date_of_birth || d.date_of_birth) && (user.city || d.city) && (user.address || d.address) && (user.postal_code || d.postal_code)) {
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
    if (!city.trim()) { toast.error("City / Town is required."); return; }
    if (!address.trim()) { toast.error("Address is required."); return; }
    if (!postalCode.trim()) { toast.error("Postal code is required."); return; }
    if (!/^[A-Za-z0-9][A-Za-z0-9\s\-]{1,9}$/.test(postalCode.trim())) { toast.error("Please enter a valid postal / zip code."); return; }
    setStep(2);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const me = await base44.auth.me();
      await base44.auth.updateMe({ full_name: fullName.trim(), privacy_consent_given: true, country, gender, date_of_birth: dob, city: city.trim(), address: address.trim(), postal_code: postalCode.trim().toUpperCase(), bio: bio.trim(), profile_picture_url: profilePic || undefined, phone: phone.trim() || undefined });
      base44.functions.invoke("autoFollowTerritoryOfficers", { country }).catch(() => {});
      base44.functions.invoke("notifyTerritoryAdmins", { event_type: "new_user", user_email: me?.email, user_country: country, user_city: city.trim() }).catch(() => {});
      onCompleted({ full_name: fullName.trim(), country, gender, date_of_birth: dob, city, address, postal_code: postalCode, bio, profile_picture_url: profilePic });
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setSaving(false); }
  };

  const inputStyle = "w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition";
  const inputColors = { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 z-[9999] [&>button]:hidden overflow-hidden font-['Inter'] bg-card border border-border text-foreground" onInteractOutside={(e) => e.preventDefault()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border text-center">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 bg-blue-500/10 border border-blue-500/20">
            {step === 0 ? <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" /> : step === 1 ? <User className="w-6 h-6 text-blue-600 dark:text-blue-400" /> : <MapPin className="w-6 h-6 text-cyan-500" />}
          </div>
          <h2 className="text-xl font-black font-['Space_Grotesk'] text-foreground">
            {step === 0 ? "Welcome to Generation LightMode" : step === 1 ? "Your Profile" : "Almost Done!"}
          </h2>
          <p className="text-xs mt-1 text-muted-foreground">
            {step === 0 ? "A quick setup before you enter" : step === 1 ? "Required — used throughout the platform" : "Optional but helps the community know you"}
          </p>
          <div className="mt-4"><StepIndicator current={step} total={3} /></div>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-4">
          {step === 0 && (
            <>
              <div className="rounded-xl p-4 bg-muted border border-border">
                <p className="text-sm font-bold mb-1 text-foreground">Privacy & Electronic Communication Consent</p>
                <p className="text-xs mb-3 leading-relaxed text-muted-foreground">I consent to the submission of my information to be stored and processed by Generation LightMode and to be electronically contacted by email as part of this participation process.</p>
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setConsent1(!consent1)}>
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all" style={consent1 ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", border: "none" } : { border: "2px solid #C0C8D8" }}>
                    {consent1 && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-sm select-none text-foreground">I consent.</span>
                </label>
              </div>
              <div className="rounded-xl p-4 bg-muted border border-border">
                <p className="text-sm font-bold mb-1 text-foreground">Privacy Policy</p>
                <p className="text-xs mb-3 leading-relaxed text-muted-foreground">I have read and agreed with the <Link to="/Privacy" target="_blank" className="font-bold underline text-blue-600 dark:text-blue-400">Privacy Policy</Link> of Generation LightMode.</p>
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setConsent2(!consent2)}>
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all" style={consent2 ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", border: "none" } : { border: "2px solid #C0C8D8" }}>
                    {consent2 && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-sm select-none text-foreground">I agree.</span>
                </label>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Full Name <span className="text-red-500">*</span></label><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition bg-muted border border-border text-foreground" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Country <span className="text-red-500">*</span></label><BottomSheetSelect value={country} onChange={setCountry} options={COUNTRIES.map(c => ({value: c, label: c}))} placeholder="Select your country…" triggerClassName="bg-muted border-border text-foreground" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Gender <span className="text-red-500">*</span></label>
                <div className="flex gap-2">{[["male","Male"],["female","Female"],["prefer_not_to_say","Prefer not to say"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setGender(val)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition border ${gender === val ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' : 'border-border text-muted-foreground hover:bg-muted'}`}>{label}</button>
                ))}</div>
              </div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Date of Birth <span className="text-red-500">*</span></label><input type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date().toISOString().split("T")[0]} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition bg-muted border border-border text-foreground" /></div>
              <div className="pt-1 pb-0.5"><div className="flex items-center gap-2 mb-2"><div className="h-px flex-1 bg-border" /><span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Location Details</span><div className="h-px flex-1 bg-border" /></div></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Street Address <span className="text-red-500">*</span></label><input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 12 Church Road" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition bg-muted border border-border text-foreground" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">City / Town <span className="text-red-500">*</span></label><input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Nairobi" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition bg-muted border border-border text-foreground" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Postal Code <span className="text-red-500">*</span></label><input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="e.g. 00100" maxLength={10} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition bg-muted border border-border text-foreground" /></div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Profile Photo</label>
                <div className="flex items-center gap-4">
                  {profilePic ? <img src={profilePic} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30" /> : <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center shrink-0 border-blue-500/30 bg-muted"><User className="w-6 h-6 text-muted-foreground" /></div>}
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed text-sm transition cursor-pointer border-blue-500/30 text-blue-600 dark:text-blue-400 bg-muted hover:bg-muted/80">
                    {uploadingPic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {uploadingPic ? "Uploading…" : "Upload Photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePicUpload} disabled={uploadingPic} />
                  </label>
                </div>
              </div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Bio <span className="text-muted-foreground/60">(optional)</span></label><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the community about yourself…" maxLength={150} rows={3} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition bg-muted border border-border text-foreground resize-none" /><p className="text-[10px] mt-0.5 text-right text-muted-foreground">{bio.length}/150</p></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Phone Number <span className="text-muted-foreground/60">(optional)</span></label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 700 000 000" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition bg-muted border border-border text-foreground" /></div>
              <p className="text-[11px] text-center pt-1 text-muted-foreground">You can always update these later from your profile settings.</p>
            </>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-border">
          {step === 0 && <button onClick={handleConsentNext} className="w-full font-black h-12 rounded-xl transition text-base flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-sm hover:opacity-90">Agree & Continue <ChevronRight className="w-5 h-5" /></button>}
          {step === 1 && <button onClick={handleProfileNext} className="w-full font-black h-12 rounded-xl transition text-base flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-sm hover:opacity-90">Next <ChevronRight className="w-5 h-5" /></button>}
          {step === 2 && <button onClick={handleFinish} disabled={saving || uploadingPic} className="w-full font-black h-12 rounded-xl transition text-base flex items-center justify-center gap-2 disabled:opacity-50 bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-sm hover:opacity-90">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Enter LightMode ⚡"}</button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}