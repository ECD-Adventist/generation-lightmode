import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import { useEffect } from "react";

export default function ClaimInstitutionModal({ isOpen, onClose, user }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [orgMapFile, setOrgMapFile] = useState(null);
  const [orgMapPreview, setOrgMapPreview] = useState(null);
  const [cropData, setCropData] = useState(null);
  const logoInputRef = useRef(null);
  const orgMapInputRef = useRef(null);
  const [formData, setFormData] = useState({
    institution_name: "",
    institution_type: "church",
    country: user?.country || "",
    contact_person: user?.full_name || "",
    contact_email: user?.email || "",
    contact_phone: user?.phone || "",
    agree_procedures: false,
    agree_commitment: false,
    agree_ecd_supervision: false,
    logo_url: ""
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        institution_name: "",
        institution_type: "church",
        country: user?.country || "",
        contact_person: user?.full_name || "",
        contact_email: user?.email || "",
        contact_phone: user?.phone || "",
        agree_procedures: false,
        agree_commitment: false,
        agree_ecd_supervision: false,
        logo_url: ""
      });
      setLogoFile(null);
      setLogoPreview(null);
      setOrgMapFile(null);
      setOrgMapPreview(null);
      setStep(1);
    }
  }, [isOpen, user]);

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropData({ file, type: "logo", aspectRatio: 1 });
    e.target.value = null;
  };

  const handleCropComplete = async (croppedFile) => {
    if (cropData?.type === "orgmap") {
      setCropData(null);
      setOrgMapFile(croppedFile);
      setOrgMapPreview(URL.createObjectURL(croppedFile));
    } else {
      setCropData(null);
      setLogoFile(croppedFile);
      setLogoPreview(URL.createObjectURL(croppedFile));
    }
  };

  const handleOrgMapSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropData({ file, type: "orgmap", aspectRatio: 16 / 9 });
    e.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.institution_name || !formData.contact_person || !formData.contact_email) {
        toast.error("Please fill in all required fields");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!formData.agree_procedures || !formData.agree_commitment || !formData.agree_ecd_supervision) {
        toast.error("Please agree to all terms");
        return;
      }

      setLoading(true);
      try {
        let logoUrl = "";
        let orgMapUrl = "";
        if (logoFile) {
          const uploadRes = await base44.integrations.Core.UploadFile({ file: logoFile });
          logoUrl = uploadRes.file_url;
        }
        if (orgMapFile) {
          const uploadRes = await base44.integrations.Core.UploadFile({ file: orgMapFile });
          orgMapUrl = uploadRes.file_url;
        }

        await base44.entities.InstitutionApplication.create({
          user_email: user.email,
          institution_name: formData.institution_name,
          institution_type: formData.institution_type,
          country: formData.country,
          contact_person: formData.contact_person,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          procedures_description: "Agreed to maintain and enforce clear member procedures, rules, and guidelines aligned with Generation LightMode and ECD standards.",
          commitment_description: "Committed to upholding spiritual values, faith-based principles, and ECD (East Central Africa Division) territory supervision requirements.",
          logo_url: logoUrl,
          organization_map_url: orgMapUrl,
          status: "pending"
        });

        toast.success("Application submitted! Super admin will review it soon.");
        onClose();
        setStep(1);
        setFormData({
          institution_name: "",
          institution_type: "church",
          country: user?.country || "",
          contact_person: user?.full_name || "",
          contact_email: user?.email || "",
          contact_phone: user?.phone || "",
          agree_procedures: false,
          agree_commitment: false,
          agree_ecd_supervision: false,
          logo_url: ""
        });
        setLogoFile(null);
        setLogoPreview(null);
        setOrgMapFile(null);
        setOrgMapPreview(null);
      } catch (err) {
        toast.error(err?.message || "Failed to submit application");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      {cropData && (
        <ImageCropperModal
          file={cropData.file}
          aspectRatio={cropData.aspectRatio}
          onCancel={() => setCropData(null)}
          onCrop={handleCropComplete}
        />
      )}

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D", boxShadow: "0 16px 48px rgba(11, 63, 217, 0.18)" }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: "#0B3FD9" }}>
              {step === 1 ? "Institution Details" : "Commitment & Procedures"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div>
                  <label className="text-xs uppercase tracking-wider mb-2 block font-bold" style={{ color: "#6B7FA0" }}>Institution Name *</label>
                  <Input
                    required
                    value={formData.institution_name}
                    onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                    className="h-12 rounded-xl"
                    style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
                    placeholder="e.g. Grace Community Church"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider mb-2 block font-bold" style={{ color: "#6B7FA0" }}>Institution Type *</label>
                  <select
                    value={formData.institution_type}
                    onChange={(e) => setFormData({ ...formData, institution_type: e.target.value })}
                    className="w-full rounded-xl px-4 h-12 focus:outline-none focus:ring-1"
                    style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
                  >
                    <option value="church">Church</option>
                    <option value="school">School</option>
                    <option value="ministry">Ministry</option>
                    <option value="organization">Organization</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider mb-2 block font-bold" style={{ color: "#6B7FA0" }}>Country *</label>
                    <Input
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="h-12 rounded-xl"
                      style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider mb-2 block font-bold" style={{ color: "#6B7FA0" }}>Contact Person *</label>
                    <Input
                      required
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="h-12 rounded-xl"
                      style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider mb-2 block font-bold" style={{ color: "#6B7FA0" }}>Email *</label>
                    <Input
                      required
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="h-12 rounded-xl"
                      style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider mb-2 block font-bold" style={{ color: "#6B7FA0" }}>Phone</label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="h-12 rounded-xl"
                      style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider mb-2 block font-bold" style={{ color: "#6B7FA0" }}>Institution Logo (Optional)</label>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-xl p-6 transition text-center hover:opacity-90"
                    style={{ borderColor: "#D6E4FF", background: "#F6F8FC" }}
                  >
                    {logoPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
                        <span className="text-xs" style={{ color: "#6B7FA0" }}>Click to change</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6" style={{ color: "#8A97B5" }} />
                        <span className="text-sm" style={{ color: "#8A97B5" }}>Upload logo (square recommended)</span>
                      </div>
                    )}
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider mb-2 block font-bold" style={{ color: "#6B7FA0" }}>Organization Map / Structure (Optional)</label>
                  <button
                    type="button"
                    onClick={() => orgMapInputRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-xl p-6 transition text-center hover:opacity-90"
                    style={{ borderColor: "#D6E4FF", background: "#F6F8FC" }}
                  >
                    {orgMapPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={orgMapPreview} alt="Org Map" className="w-full max-h-32 rounded-lg object-contain" />
                        <span className="text-xs" style={{ color: "#6B7FA0" }}>Click to change</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6" style={{ color: "#8A97B5" }} />
                        <span className="text-sm" style={{ color: "#8A97B5" }}>Upload your organization map/structure image</span>
                      </div>
                    )}
                  </button>
                  <input ref={orgMapInputRef} type="file" accept="image/*" className="hidden" onChange={handleOrgMapSelect} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="rounded-xl p-4 space-y-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                    <h3 className="text-sm font-bold" style={{ color: "#0B1B3D" }}>Commitment & Procedures</h3>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                      <input
                        type="checkbox"
                        checked={formData.agree_procedures}
                        onChange={(e) => setFormData({ ...formData, agree_procedures: e.target.checked })}
                        className="mt-1 w-4 h-4 rounded"
                        style={{ accentColor: "#0B3FD9" }}
                      />
                      <span className="text-xs leading-relaxed" style={{ color: "#3A4A6B" }}>
                        I agree to maintain and enforce clear member <strong style={{ color: "#0B1B3D" }}>procedures, rules, and guidelines</strong> that align with Generation LightMode standards and ECD compliance requirements.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                      <input
                        type="checkbox"
                        checked={formData.agree_commitment}
                        onChange={(e) => setFormData({ ...formData, agree_commitment: e.target.checked })}
                        className="mt-1 w-4 h-4 rounded"
                        style={{ accentColor: "#0B3FD9" }}
                      />
                      <span className="text-xs leading-relaxed" style={{ color: "#3A4A6B" }}>
                        I commit to upholding core <strong style={{ color: "#0B1B3D" }}>spiritual values and faith-based principles</strong> as the foundation of our institution's mission and territory administration.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                      <input
                        type="checkbox"
                        checked={formData.agree_ecd_supervision}
                        onChange={(e) => setFormData({ ...formData, agree_ecd_supervision: e.target.checked })}
                        className="mt-1 w-4 h-4 rounded"
                        style={{ accentColor: "#0B3FD9" }}
                      />
                      <span className="text-xs leading-relaxed" style={{ color: "#3A4A6B" }}>
                        I agree to <strong style={{ color: "#0B1B3D" }}>administer and supervise all assigned territories</strong> according to ECD (East Central Africa Division of the Seventh-day Adventist Church) standards, including mandatory oversight protocols, compliance audits, and member supervision requirements.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ background: "rgba(255, 208, 0, 0.06)", border: "1px solid #FFE4A0" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "#8B6914" }}>
                    Your Institution Dashboard application will be reviewed by our super admin team. You'll be notified once it's approved or if additional information is needed.
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "#E6ECF5" }}>
              {step === 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="h-12 px-6"
                  style={{ color: "#4A5878" }}
                >
                  Back
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="h-12 px-6"
                style={{ color: "#4A5878" }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="font-black h-12 px-8 rounded-xl hover:opacity-90 transition"
                style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 1 ? "Next" : "Submit Application"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}