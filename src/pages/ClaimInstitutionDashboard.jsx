import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";

export default function ClaimInstitutionDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    institution_name: "",
    institution_type: "school",
    description: "",
    contact_person_name: "",
    contact_email: "",
    contact_phone: "",
    institution_address: "",
    website_url: "",
    commitment: false
  });

  React.useEffect(() => {
    base44.auth.me().then(me => {
      setUser(me);
      setFormData(prev => ({ ...prev, applicant_email: me.email, contact_email: me.email }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.institution_name || !formData.contact_person_name || !formData.institution_address) {
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
        status: "pending"
      });

      setSubmitted(true);
      toast.success("Application submitted successfully!");
      
      setTimeout(() => {
        navigate(createPageUrl("Feed"));
      }, 2000);
    } catch (err) {
      toast.error(err?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle2 className="w-20 h-20 text-[#00CFFF] mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">Application Submitted!</h1>
          <p className="text-gray-400 mb-6">Your institution dashboard application has been submitted for review.</p>
          <p className="text-sm text-gray-500">Our admin team will review your application shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#00CFFF] hover:text-[#00CFFF]/80 mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-[#121826] rounded-3xl p-8 border border-white/10">
          <h1 className="text-3xl font-bold font-['Space_Grotesk'] mb-2">Claim Institution Dashboard</h1>
          <p className="text-gray-400 mb-8">Register your institution for an official dashboard to reach more users and manage your community.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Institution Info */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Institution Name *</label>
              <Input
                required
                value={formData.institution_name}
                onChange={e => setFormData({ ...formData, institution_name: e.target.value })}
                placeholder="e.g., Faith Academy"
                className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Institution Type *</label>
              <select
                required
                value={formData.institution_type}
                onChange={e => setFormData({ ...formData, institution_type: e.target.value })}
                className="w-full bg-[#0B0F1A] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00CFFF]/50"
              >
                <option value="school">School</option>
                <option value="church">Church</option>
                <option value="ministry">Ministry</option>
                <option value="organization">Organization</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Description *</label>
              <Textarea
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about your institution..."
                className="bg-[#0B0F1A] border-white/10 min-h-[100px] rounded-xl"
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Contact Person Name *</label>
                <Input
                  required
                  value={formData.contact_person_name}
                  onChange={e => setFormData({ ...formData, contact_person_name: e.target.value })}
                  placeholder="Full name"
                  className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Contact Email *</label>
                <Input
                  required
                  type="email"
                  value={formData.contact_email}
                  onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="email@example.com"
                  className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Contact Phone</label>
              <Input
                value={formData.contact_phone}
                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Institution Address *</label>
              <Input
                required
                value={formData.institution_address}
                onChange={e => setFormData({ ...formData, institution_address: e.target.value })}
                placeholder="Street address, city, country"
                className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Website (Optional)</label>
              <Input
                value={formData.website_url}
                onChange={e => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://example.com"
                className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl"
              />
            </div>

            {/* Commitment */}
            <div className="bg-[#0B0F1A] p-4 rounded-xl border border-[#00CFFF]/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.commitment}
                  onChange={e => setFormData({ ...formData, commitment: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm mb-1">Commitment to Community Guidelines</p>
                  <p className="text-xs text-gray-400">
                    I commit to promoting faith-based content, maintaining respectful community standards, and supporting the mission of Generation LightMode to spread light and faith online.
                  </p>
                </div>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold rounded-xl hover:opacity-90 transition"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </span>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}