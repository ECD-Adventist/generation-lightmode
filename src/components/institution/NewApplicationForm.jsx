import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewApplicationForm({ user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    institution_name: "",
    institution_type: "church",
    description: "",
    contact_person_name: user?.full_name || "",
    contact_email: user?.email || "",
    contact_phone: "",
    institution_address: "",
    commitment: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.institution_name || !formData.description || !formData.contact_person_name || !formData.contact_email || !formData.institution_address) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!formData.commitment) {
      toast.error("You must agree to the commitment");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.InstitutionApplication.create({
        user_email: user.email,
        institution_name: formData.institution_name,
        institution_type: formData.institution_type,
        country: formData.institution_address,
        contact_person: formData.contact_person_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        procedures_description: formData.description,
        commitment_description: "Committed to community guidelines and the mission of Generation LightMode.",
        status: "pending",
      });
      toast.success("Application submitted successfully!");
      onSuccess();
    } catch (err) {
      toast.error(err?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121826] rounded-3xl p-6 sm:p-8 border border-[#00CFFF]/20 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition">
        <X className="w-5 h-5" />
      </button>
      <h2 className="text-xl font-bold font-['Space_Grotesk'] text-[#00CFFF] mb-1">New Application</h2>
      <p className="text-sm text-gray-500 mb-6">Register your institution for an official dashboard.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Institution Name *</label>
          <Input required value={formData.institution_name} onChange={e => setFormData({ ...formData, institution_name: e.target.value })} placeholder="e.g., Faith Academy" className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Type *</label>
            <select required value={formData.institution_type} onChange={e => setFormData({ ...formData, institution_type: e.target.value })} className="w-full bg-[#0B0F1A] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00CFFF]/50">
              <option value="church">Church</option>
              <option value="school">School</option>
              <option value="ministry">Ministry</option>
              <option value="organization">Organization</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Country / Address *</label>
            <Input required value={formData.institution_address} onChange={e => setFormData({ ...formData, institution_address: e.target.value })} placeholder="City, Country" className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Description *</label>
          <Textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Tell us about your institution..." className="bg-[#0B0F1A] border-white/10 min-h-[80px] rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Contact Person *</label>
            <Input required value={formData.contact_person_name} onChange={e => setFormData({ ...formData, contact_person_name: e.target.value })} placeholder="Full name" className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Contact Email *</label>
            <Input required type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} placeholder="email@example.com" className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Phone (Optional)</label>
          <Input value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="+1 234 567 8900" className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl" />
        </div>

        <div className="bg-[#0B0F1A] p-4 rounded-xl border border-[#00CFFF]/20">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" required checked={formData.commitment} onChange={e => setFormData({ ...formData, commitment: e.target.checked })} className="mt-1" />
            <div>
              <p className="font-bold text-sm mb-1">Commitment to Community Guidelines</p>
              <p className="text-xs text-gray-400">I commit to promoting faith-based content, maintaining respectful community standards, and supporting the mission of Generation LightMode.</p>
            </div>
          </label>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold rounded-xl hover:opacity-90 transition">
          {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span> : "Submit Application"}
        </Button>
      </form>
    </div>
  );
}