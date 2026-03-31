import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Upload, X, Check } from "lucide-react";

export default function ComplianceAuditForm({ isOpen, onClose, user, institution }) {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    territory_name: institution?.country || "",
    audit_period: "monthly",
    member_count: "",
    supervision_activities: "",
    supervision_frequency: "monthly",
    ecd_alignment_status: "fully_compliant",
    ecd_standards_met: [],
    ecd_gaps: "",
    corrective_actions: "",
    notes: ""
  });

  const ecdStandardsOptions = [
    "Member safety protocols enforced",
    "Staff training and certification documented",
    "Community engagement programs active",
    "Regular supervision activities logged",
    "Compliance documentation maintained",
    "Member welfare assessments conducted",
    "Territory administration protocols followed"
  ];

  const toggleStandard = (standard) => {
    setFormData(prev => ({
      ...prev,
      ecd_standards_met: prev.ecd_standards_met.includes(standard)
        ? prev.ecd_standards_met.filter(s => s !== standard)
        : [...prev.ecd_standards_met, standard]
    }));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setLoading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setDocuments([...documents, { name: file.name, url: res.file_url }]);
      toast.success(`${file.name} uploaded`);
    } catch (err) {
      toast.error("Failed to upload document");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const removeDocument = (url) => {
    setDocuments(documents.filter(doc => doc.url !== url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.territory_name || !formData.member_count || !formData.supervision_activities) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.ComplianceAudit.create({
        institution_id: institution?.id || user?.email,
        leader_email: user.email,
        territory_name: formData.territory_name,
        audit_period: formData.audit_period,
        audit_date: new Date().toISOString().split('T')[0],
        member_count: parseInt(formData.member_count),
        supervision_activities: formData.supervision_activities,
        supervision_frequency: formData.supervision_frequency,
        ecd_alignment_status: formData.ecd_alignment_status,
        ecd_standards_met: formData.ecd_standards_met,
        ecd_gaps: formData.ecd_gaps,
        corrective_actions: formData.corrective_actions,
        documentation_urls: documents.map(d => d.url),
        notes: formData.notes,
        status: "submitted"
      });

      toast.success("Compliance audit submitted successfully!");
      onClose();
      resetForm();
    } catch (err) {
      toast.error("Failed to submit audit");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      territory_name: institution?.country || "",
      audit_period: "monthly",
      member_count: "",
      supervision_activities: "",
      supervision_frequency: "monthly",
      ecd_alignment_status: "fully_compliant",
      ecd_standards_met: [],
      ecd_gaps: "",
      corrective_actions: "",
      notes: ""
    });
    setDocuments([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#121826] border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#00CFFF]">
            ECD (East Central Africa Division) Compliance Audit
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Territory & Basic Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#FFD000]">Territory Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Territory Name *</label>
                <Input
                  required
                  value={formData.territory_name}
                  onChange={(e) => setFormData({...formData, territory_name: e.target.value})}
                  className="bg-[#0B0F1A] border-white/10 h-10 rounded-lg"
                  placeholder="e.g. Nairobi North Territory"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Active Members *</label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={formData.member_count}
                  onChange={(e) => setFormData({...formData, member_count: e.target.value})}
                  className="bg-[#0B0F1A] border-white/10 h-10 rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Audit Period *</label>
                <select
                  value={formData.audit_period}
                  onChange={(e) => setFormData({...formData, audit_period: e.target.value})}
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 h-10 text-white focus:outline-none focus:ring-1 focus:ring-[#00CFFF]/50"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Supervision Frequency *</label>
                <select
                  value={formData.supervision_frequency}
                  onChange={(e) => setFormData({...formData, supervision_frequency: e.target.value})}
                  className="w-full bg-[#0B0F1A] border border-white/10 rounded-lg px-3 h-10 text-white focus:outline-none focus:ring-1 focus:ring-[#00CFFF]/50"
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Supervision Activities */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#FFD000]">Member Supervision Activities</h3>
            
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Supervision Activities Summary *</label>
              <Textarea
                required
                value={formData.supervision_activities}
                onChange={(e) => setFormData({...formData, supervision_activities: e.target.value})}
                placeholder="Describe member supervision activities conducted (visits, meetings, assessments, follow-ups, etc.)"
                className="bg-[#0B0F1A] border-white/10 rounded-lg h-24"
              />
            </div>
          </div>

          {/* ECD Alignment */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#FFD000]">ECD (East Central Africa Division) Alignment Status</h3>
            
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 mb-3 block">Overall Compliance Status *</label>
              <div className="grid grid-cols-2 gap-3">
                {["fully_compliant", "mostly_compliant", "partially_compliant", "non_compliant"].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({...formData, ecd_alignment_status: status})}
                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition border ${
                      formData.ecd_alignment_status === status
                        ? status === "fully_compliant" ? "bg-green-500/20 border-green-500/50 text-green-400" 
                          : status === "mostly_compliant" ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                          : status === "partially_compliant" ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                          : "bg-red-500/20 border-red-500/50 text-red-400"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {status.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">ECD Standards Met</label>
              <div className="space-y-2">
                {ecdStandardsOptions.map(standard => (
                  <label key={standard} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded transition">
                    <input
                      type="checkbox"
                      checked={formData.ecd_standards_met.includes(standard)}
                      onChange={() => toggleStandard(standard)}
                      className="w-4 h-4 rounded border-white/20 bg-[#0B0F1A] accent-[#00CFFF]"
                    />
                    <span className="text-xs text-gray-300">{standard}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">ECD Compliance Gaps (if any)</label>
              <Textarea
                value={formData.ecd_gaps}
                onChange={(e) => setFormData({...formData, ecd_gaps: e.target.value})}
                placeholder="Describe any gaps or areas not yet meeting ECD standards..."
                className="bg-[#0B0F1A] border-white/10 rounded-lg h-20"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Corrective Actions Plan</label>
              <Textarea
                value={formData.corrective_actions}
                onChange={(e) => setFormData({...formData, corrective_actions: e.target.value})}
                placeholder="Plans to address identified gaps and achieve full compliance..."
                className="bg-[#0B0F1A] border-white/10 rounded-lg h-20"
              />
            </div>
          </div>

          {/* Documentation */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#FFD000]">Supporting Documentation</h3>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full border-2 border-dashed border-white/10 rounded-lg p-6 hover:border-[#00CFFF]/30 transition text-center"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 text-[#00CFFF] animate-spin mx-auto mb-2" />
              ) : (
                <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
              )}
              <span className="text-sm text-gray-400">Upload training records, compliance certificates, photos, etc.</span>
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} disabled={loading} />

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                    <span className="text-xs text-gray-300 truncate">{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.url)}
                      className="text-gray-500 hover:text-red-400 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Additional Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional observations or comments..."
              className="bg-[#0B0F1A] border-white/10 rounded-lg h-16"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold h-10 px-8 rounded-lg"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Submit Audit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}