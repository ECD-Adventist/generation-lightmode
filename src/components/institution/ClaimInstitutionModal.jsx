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
  const [cropData, setCropData] = useState(null);
  const logoInputRef = useRef(null);
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
    setCropData(null);
    setLogoFile(croppedFile);
    const preview = URL.createObjectURL(croppedFile);
    setLogoPreview(preview);
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
        if (logoFile) {
          const uploadRes = await base44.integrations.Core.UploadFile({ file: logoFile });
          logoUrl = uploadRes.file_url;
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
          procedures_description: "",
          commitment_description: "",
          logo_url: ""
        });
        setLogoFile(null);
        setLogoPreview(null);
      } catch (err) {
        toast.error("Failed to submit application");
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
        <DialogContent className="bg-[#121826] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#00CFFF]">
              {step === 1 ? "Institution Details" : "Commitment & Procedures"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Institution Name *</label>
                  <Input
                    required
                    value={formData.institution_name}
                    onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                    className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
                    placeholder="e.g. Grace Community Church"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Institution Type *</label>
                  <select
                    value={formData.institution_type}
                    onChange={(e) => setFormData({ ...formData, institution_type: e.target.value })}
                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 h-12 text-white focus:outline-none focus:ring-1 focus:ring-[#00CFFF]/50"
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
                    <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Country *</label>
                    <Input
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Contact Person *</label>
                    <Input
                      required
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Email *</label>
                    <Input
                      required
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Phone</label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Institution Logo (Optional)</label>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-white/10 rounded-xl p-6 hover:border-[#00CFFF]/30 transition text-center"
                  >
                    {logoPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
                        <span className="text-xs text-gray-400">Click to change</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-gray-500" />
                        <span className="text-sm text-gray-400">Upload logo (square recommended)</span>
                      </div>
                    )}
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-bold text-white">Commitment & Procedures</h3>
                    
                    <label className="flex items-start gap-3 cursor-pointer hover:bg-white/5 p-3 rounded-lg transition">
                      <input
                        type="checkbox"
                        required
                        checked={formData.agree_procedures}
                        onChange={(e) => setFormData({ ...formData, agree_procedures: e.target.checked })}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-[#0B0F1A] accent-[#00CFFF]"
                      />
                      <span className="text-xs text-gray-300 leading-relaxed">
                        I agree to maintain and enforce clear member <strong>procedures, rules, and guidelines</strong> that align with Generation LightMode standards and ECD compliance requirements.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer hover:bg-white/5 p-3 rounded-lg transition">
                      <input
                        type="checkbox"
                        required
                        checked={formData.agree_commitment}
                        onChange={(e) => setFormData({ ...formData, agree_commitment: e.target.checked })}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-[#0B0F1A] accent-[#00CFFF]"
                      />
                      <span className="text-xs text-gray-300 leading-relaxed">
                        I commit to upholding core <strong>spiritual values and faith-based principles</strong> as the foundation of our institution's mission and territory administration.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer hover:bg-white/5 p-3 rounded-lg transition">
                      <input
                        type="checkbox"
                        required
                        checked={formData.agree_ecd_supervision}
                        onChange={(e) => setFormData({ ...formData, agree_ecd_supervision: e.target.checked })}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-[#0B0F1A] accent-[#00CFFF]"
                      />
                      <span className="text-xs text-gray-300 leading-relaxed">
                        I agree to <strong>administer and supervise all assigned territories</strong> according to ECD (East Central Africa Division of the Seventh-day Adventist Church) standards, including mandatory oversight protocols, compliance audits, and member supervision requirements.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your Institution Dashboard application will be reviewed by our super admin team. You'll be notified once it's approved or if additional information is needed.
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              {step === 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="h-12 px-6"
                >
                  Back
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="h-12 px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold h-12 px-8 rounded-xl"
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