import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, Save } from "lucide-react";
import ImageCropperModal from "@/components/ui/ImageCropperModal";

export default function InstitutionDetailsEditor({ page, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [cropData, setCropData] = useState(null);
  const logoRef = useRef(null);
  const bannerRef = useRef(null);

  const [form, setForm] = useState({
    name: page.name || "",
    mission_statement: page.mission_statement || "",
    category: page.category || "ministry",
    contact_email: page.contact_email || "",
    contact_phone: page.contact_phone || "",
    website_url: page.website_url || "",
    location: page.location || "",
    logo_url: page.logo_url || "",
    banner_url: page.banner_url || "",
  });

  const handleImageSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropData({ file, type, aspectRatio: type === "logo" ? 1 : 3 });
    e.target.value = null;
  };

  const handleCropComplete = async (croppedFile) => {
    const type = cropData.type;
    setCropData(null);
    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      const res = await base44.integrations.Core.UploadFile({ file: croppedFile });
      const key = type === "logo" ? "logo_url" : "banner_url";
      setForm(prev => ({ ...prev, [key]: res.file_url }));
      toast.success(`${type} uploaded!`, { id: toastId });
    } catch {
      toast.error(`Failed to upload ${type}`, { id: toastId });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await base44.entities.InstitutionPage.update(page.id, form);
      toast.success("Institution page updated!");
      onUpdated();
    } catch (err) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Banner Preview */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Banner Image</label>
          <div
            className="w-full h-40 rounded-2xl bg-[#121826] border-2 border-dashed border-white/10 hover:border-[#00CFFF]/30 cursor-pointer overflow-hidden relative group transition"
            onClick={() => bannerRef.current?.click()}
          >
            {form.banner_url ? (
              <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Upload className="w-6 h-6 mb-2" />
                <span className="text-sm">Click to upload banner (3:1 ratio)</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-sm">
              Change Banner
            </div>
          </div>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "banner")} />
        </div>

        {/* Logo & Name Row */}
        <div className="flex gap-6 items-start">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Logo</label>
            <div
              className="w-24 h-24 rounded-2xl bg-[#121826] border-2 border-dashed border-white/10 hover:border-[#00CFFF]/30 cursor-pointer overflow-hidden relative group transition"
              onClick={() => logoRef.current?.click()}
            >
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <Upload className="w-5 h-5" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                Change
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "logo")} />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Institution Name *</label>
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 h-12 text-white focus:outline-none focus:ring-1 focus:ring-[#00CFFF]/50">
                <option value="church">Church</option>
                <option value="ministry">Ministry</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="school">School</option>
                <option value="community">Community</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Mission Statement</label>
          <Textarea value={form.mission_statement} onChange={e => setForm({ ...form, mission_statement: e.target.value })} placeholder="Describe your institution's mission..." className="bg-[#0B0F1A] border-white/10 min-h-[120px] rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Contact Email</label>
            <Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Phone</label>
            <Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Website URL</label>
            <Input value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Location</label>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City, Country" className="bg-[#0B0F1A] border-white/10 h-12 rounded-xl" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/5">
          <Button type="submit" disabled={saving} className="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold h-12 px-8 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>
    </>
  );
}