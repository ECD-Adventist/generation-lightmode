import React, { useState, useEffect } from "react";
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
        <div key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === current ? 40 : 24, background: i <= current ? "linear-gradient(90deg, #1FB8FF, #0B3FD9)" : "#E6ECF5" }} />
      ))}
    </div>
  );
}

export default function OnboardingModal({ isOpen, onCompleted }) {
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
    if (isOpen) initializeFromUser();
  }, [isOpen, onCompleted]);

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
      base44.functions.invoke("notifyTerritoryAdmins", { event_type: "new_user", user_email: me?.email, user_country: country, user_city: city.trim() }).catch(() => {});
      onCompleted({ full_name: fullName.trim(), country, gender, date_of_birth: dob, city, address, postal_code: postalCode, bio, profile_picture_url: profilePic });
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setSaving(false); }
  };

  const inputStyle = "w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition";
  const inputColors = { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 z-[9999] [&>button]:hidden overflow-hidden font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }} onInteractOutside={(e) => e.preventDefault()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b text-center" style={{ borderColor: "#E6ECF5" }}>
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: "#EEF3FF", border: "1px solid #D6E4FF" }}>
            {step === 0 ? <ShieldCheck className="w-6 h-6" style={{ color: "#0B3FD9" }} /> : step === 1 ? <User className="w-6 h-6" style={{ color: "#0B3FD9" }} /> : <MapPin className="w-6 h-6" style={{ color: "#1FB8FF" }} />}
          </div>
          <h2 className="text-xl font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>
            {step === 0 ? "Welcome to Generation LightMode" : step === 1 ? "Your Profile" : "Almost Done!"}
          </h2>
          <p className="text-xs mt-1" style={{ color: "#6B7FA0" }}>
            {step === 0 ? "A quick setup before you enter" : step === 1 ? "Required — used throughout the platform" : "Optional but helps the community know you"}
          </p>
          <div className="mt-4"><StepIndicator current={step} total={3} /></div>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-4">
          {step === 0 && (
            <>
              <div className="rounded-xl p-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                <p className="text-sm font-bold mb-1" style={{ color: "#0B1B3D" }}>Privacy & Electronic Communication Consent</p>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: "#6B7FA0" }}>I consent to the submission of my information to be stored and processed by Generation LightMode and to be electronically contacted by email as part of this participation process.</p>
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setConsent1(!consent1)}>
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all" style={consent1 ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", border: "none" } : { border: "2px solid #C0C8D8" }}>
                    {consent1 && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-sm select-none" style={{ color: "#3A4A6B" }}>I consent.</span>
                </label>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                <p className="text-sm font-bold mb-1" style={{ color: "#0B1B3D" }}>Privacy Policy</p>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: "#6B7FA0" }}>I have read and agreed with the <Link to="/Privacy" target="_blank" className="font-bold underline" style={{ color: "#0B3FD9" }}>Privacy Policy</Link> of Generation LightMode.</p>
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setConsent2(!consent2)}>
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all" style={consent2 ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", border: "none" } : { border: "2px solid #C0C8D8" }}>
                    {consent2 && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-sm select-none" style={{ color: "#3A4A6B" }}>I agree.</span>
                </label>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7FA0" }}>Full Name <span style={{ color: "#EF4444" }}>*</span></label><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className={inputStyle} style={inputColors} /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7FA0" }}>Country <span style={{ color: "#EF4444" }}>*</span></label><select value={country} onChange={e => setCountry(e.target.value)} className={inputStyle + " appearance-none"} style={inputColors}><option value="">Select your country…</option>{COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7FA0" }}>Gender <span style={{ color: "#EF4444" }}>*</span></label>
                <div className="flex gap-2">{[["male","Male"],["female","Female"],["prefer_not_to_say","Prefer not to say"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setGender(val)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition" style={gender === val ? { background: "rgba(11,63,217,0.08)", border: "1px solid #D6E4FF", color: "#0B3FD9" } : { border: "1px solid #E6ECF5", color: "#6B7FA0" }}>{label}</button>
                ))}</div>
              </div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7FA0" }}>Date of Birth <span style={{ color: "#EF4444" }}>*</span></label><input type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date().toISOString().split("T")[0]} className={inputStyle} style={{ ...inputColors, colorScheme: "light" }} /></div>
              <div className="pt-1 pb-0.5"><div className="flex items-center gap-2 mb-2"><div className="h-px flex-1" style={{ background: "#E6ECF5" }} /><span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "#8A97B5" }}>Location Details</span><div className="h-px flex-1" style={{ background: "#E6ECF5" }} /></div></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7FA0" }}>Street Address <span style={{ color: "#EF4444" }}>*</span></label><input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 12 Church Road" className={inputStyle} style={inputColors} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7FA0" }}>City / Town <span style={{ color: "#EF4444" }}>*</span></label><input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Nairobi" className={inputStyle} style={inputColors} /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7FA0" }}>Postal Code <span style={{ color: "#EF4444" }}>*</span></label><input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="e.g. 00100" maxLength={10} className={inputStyle} style={inputColors} /></div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7FA0" }}>Profile Photo</label>
                <div className="flex items-center gap-4">
                  {profilePic ? <img src={profilePic} className="w-16 h-16 rounded-full object-cover" style={{ border: "2px solid #D6E4FF" }} /> : <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center shrink-0" style={{ borderColor: "#D6E4FF", background: "#F6F8FC" }}><User className="w-6 h-6" style={{ color: "#8A97B5" }} /></div>}
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed text-sm transition cursor-pointer" style={{ borderColor: "#D6E4FF", color: "#0B3FD9", background: "#F6F8FC" }}>
                    {uploadingPic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {uploadingPic ? "Uploading…" : "Upload Photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePicUpload} disabled={uploadingPic} />
                  </label>
                </div>
              </div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7FA0" }}>Bio <span style={{ color: "#8A97B5" }}>(optional)</span></label><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the community about yourself…" maxLength={150} rows={3} className={inputStyle + " resize-none"} style={inputColors} /><p className="text-[10px] mt-0.5 text-right" style={{ color: "#8A97B5" }}>{bio.length}/150</p></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#6B7FA0" }}>Phone Number <span style={{ color: "#8A97B5" }}>(optional)</span></label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 700 000 000" className={inputStyle} style={inputColors} /></div>
              <p className="text-[11px] text-center pt-1" style={{ color: "#8A97B5" }}>You can always update these later from your profile settings.</p>
            </>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 border-t" style={{ borderColor: "#E6ECF5" }}>
          {step === 0 && <button onClick={handleConsentNext} className="w-full font-black h-12 rounded-xl transition text-base flex items-center justify-center gap-2" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>Agree & Continue <ChevronRight className="w-5 h-5" /></button>}
          {step === 1 && <button onClick={handleProfileNext} className="w-full font-black h-12 rounded-xl transition text-base flex items-center justify-center gap-2" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>Next <ChevronRight className="w-5 h-5" /></button>}
          {step === 2 && <button onClick={handleFinish} disabled={saving || uploadingPic} className="w-full font-black h-12 rounded-xl transition text-base flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 4px 14px rgba(255, 159, 26, 0.35)" }}>{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Enter LightMode ⚡"}</button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}