import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import ImageCropperModal from "@/components/ui/ImageCropperModal";

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
    procedures_description: "",
    commitment_description: "",
    logo_url: ""
  });

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
      if (!formData.procedures_description || !formData.commitment_description) {
        toast.error("Please fill in procedures and commitment");
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
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
          procedures_description: formData.procedures_description,
          commitment_description: formData.commitment_description,
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
              {step === 1 ? "Institution Details" : step === 2 ? "Commitment & Procedures" : "Acknowledge & Submit"}
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
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Procedures & Guidelines *</label>
                  <Textarea
                    required
                    value={formData.procedures_description}
                    onChange={(e) => setFormData({ ...formData, procedures_description: e.target.value })}
                    placeholder="Describe the procedures members should follow, rules, and guidelines..."
                    className="bg-[#0B0F1A] border-white/10 rounded-xl h-32"
                  />
                  <span className="text-[10px] text-gray-500">{formData.procedures_description.length}/1000</span>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Commitment & Values *</label>
                  <Textarea
                    required
                    value={formData.commitment_description}
                    onChange={(e) => setFormData({ ...formData, commitment_description: e.target.value })}
                    placeholder="Describe what members must commit to, core values, spiritual focus, etc..."
                    className="bg-[#0B0F1A] border-white/10 rounded-xl h-32"
                  />
                  <span className="text-[10px] text-gray-500">{formData.commitment_description.length}/1000</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your Institution Dashboard application will be reviewed by our super admin team. You'll be notified once it's approved or if additional information is needed.
                  </p>
                </div>
              </>
            ) : step === 3 ? (
              <>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-[#00CFFF]/10 to-[#8A5CFF]/10 border border-[#00CFFF]/20 rounded-xl p-5">
                    <h4 className="text-sm font-bold text-[#00CFFF] mb-3 uppercase tracking-wider">Important Commitment</h4>
                    <p className="text-sm text-gray-300 leading-relaxed mb-4">
                      As an institution dashboard administrator, you commit to:
                    </p>
                    <ul className="text-xs text-gray-400 space-y-2 ml-4">
                      <li>• <span className="font-semibold text-gray-300">Full Territory Administration</span> - Managing all institutional activities, members, and groups within your territory</li>
                      <li>• <span className="font-semibold text-gray-300">Regular Supervision</span> - Conducting periodic reviews and monitoring compliance with ECD guidelines</li>
                      <li>• <span className="font-semibold text-gray-300">Community Standards</span> - Ensuring all members follow the Community Guidelines and Codes of Conduct</li>
                      <li>• <span className="font-semibold text-gray-300">Reporting & Documentation</span> - Maintaining accurate records and submitting required reports to ECD authorities</li>
                      <li>• <span className="font-semibold text-gray-300">Support & Development</span> - Providing guidance, training, and support to institution members and leaders</li>
                      <li>• <span className="font-semibold text-gray-300">Compliance Audits</span> - Cooperating with ECD supervisors during compliance audits and reviews</li>
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      By submitting this application, you acknowledge that you have read and agree to the Commitment & Procedures outlined above. Your institution dashboard application will be reviewed by our super admin team. You'll be notified once it's approved or if additional information is needed.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                    <input
                      type="checkbox"
                      id="commitment-agree"
                      className="mt-1 w-4 h-4 rounded border-white/20 accent-[#00CFFF] cursor-pointer"
                      required
                    />
                    <label htmlFor="commitment-agree" className="text-xs text-gray-400 cursor-pointer">
                      I confirm that I have read and understand the commitment and procedures for institutional dashboard administration, and I agree to fulfill all responsibilities outlined above.
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 1 ? "Next" : step === 2 ? "Next" : "Submit Application"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}