import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Loader2, Calendar, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import ImageCropperModal from "@/components/ui/ImageCropperModal";

export default function EditProfileModal({ isOpen, onClose, user, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropData, setCropData] = useState(null);
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [editData, setEditData] = useState({
    full_name: user?.full_name || "",
    country: user?.country || "",
    bio: user?.bio || "",
    website_url: user?.website_url || "",
    profile_picture_url: user?.profile_picture_url || "",
    cover_picture_url: user?.cover_picture_url || "",
    gender: user?.gender || "",
    date_of_birth: user?.date_of_birth || "",
    phone: user?.phone || "",
    city: user?.city || "",
    address: user?.address || "",
    postal_code: user?.postal_code || "",
  });

  // Sync when user prop changes (e.g. after an image upload outside modal)
  React.useEffect(() => {
    if (user) {
      setEditData({
        full_name: user.full_name || "",
        country: user.country || "",
        bio: user.bio || "",
        website_url: user.website_url || "",
        profile_picture_url: user.profile_picture_url || "",
        cover_picture_url: user.cover_picture_url || "",
        gender: user.gender || "",
        date_of_birth: user.date_of_birth || "",
        phone: user.phone || "",
        city: user.city || "",
        address: user.address || "",
        postal_code: user.postal_code || "",
      });
    }
  }, [user?.email, isOpen]); // re-sync on open

  const set = (field, value) => setEditData(prev => ({ ...prev, [field]: value }));

  const handleImageSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropData({ file, type, aspectRatio: type === "profile" ? 1 : 3 });
    e.target.value = null;
  };

  const handleCropComplete = async (croppedFile) => {
    const type = cropData.type;
    setCropData(null);
    setUploadingImage(true);
    const toastId = toast.loading(`Uploading ${type} photo…`);
    try {
      const res = await base44.integrations.Core.UploadFile({ file: croppedFile });
      const urlField = type === "profile" ? "profile_picture_url" : "cover_picture_url";
      set(urlField, res.file_url);
      // Save immediately to user record so it persists even if modal closed
      await base44.auth.updateMe({ [urlField]: res.file_url });
      toast.success(`${type === "profile" ? "Profile" : "Cover"} photo updated!`, { id: toastId });
    } catch {
      toast.error(`Failed to upload photo`, { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editData.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await base44.functions.invoke("updateProfile", editData);
      if (!res.data?.success) throw new Error(res.data?.error || "Save failed");

      // Small delay then re-fetch fresh user
      await new Promise(r => setTimeout(r, 200));
      const updated = await base44.auth.me();

      // Prefer the just-saved values so the profile reflects them immediately
      const merged = { ...updated, ...editData, full_name: editData.full_name.trim() };
      toast.success("Profile saved! ✨");
      onSaved(merged);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

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

      {/* Overlay */}
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="relative z-10 w-full max-w-lg bg-[#0D1524] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
            <div>
              <h2 className="text-lg font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Edit Profile</h2>
              <p className="text-xs text-gray-500 mt-0.5">Changes are saved to your account</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Photos row */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-3 block">Photos</Label>
              <div className="flex items-center gap-4">
                {/* Profile pic */}
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#00CFFF] to-[#8A5CFF] p-[2px] shrink-0 group"
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#0B0F1A]">
                    <img src={editData.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </button>
                <input type="file" ref={profileInputRef} accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "profile")} />

                {/* Cover */}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="relative flex-1 h-16 rounded-xl bg-[#121826] border border-white/10 overflow-hidden group"
                  style={editData.cover_picture_url ? { backgroundImage: `url(${editData.cover_picture_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                      <Camera className="w-4 h-4" /> Cover Photo
                    </div>
                  </div>
                  {!editData.cover_picture_url && (
                    <span className="text-gray-600 text-xs absolute inset-0 flex items-center justify-center">
                      + Cover Photo
                    </span>
                  )}
                </button>
                <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "cover")} />
              </div>
              {uploadingImage && (
                <p className="text-xs text-[#00CFFF] mt-2 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Full Name <span className="text-red-400">*</span></Label>
              <Input
                required
                value={editData.full_name}
                onChange={e => set("full_name", e.target.value)}
                placeholder="Your full name"
                className="bg-[#121826] border-white/10 h-11 rounded-xl text-white"
              />
            </div>

            {/* Bio */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center justify-between">
                <span>Bio</span>
                <span className="text-gray-600">{editData.bio.length}/1200</span>
              </Label>
              <textarea
                value={editData.bio}
                onChange={e => set("bio", e.target.value.slice(0, 1200))}
                placeholder="Tell people about yourself…"
                rows={3}
                className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#00CFFF]/40"
              />
            </div>

            {/* Gender + DOB */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Gender</Label>
                <select
                  value={editData.gender}
                  onChange={e => set("gender", e.target.value)}
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-3 h-11 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00CFFF]/40"
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Date of Birth</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={editData.date_of_birth}
                    onChange={e => set("date_of_birth", e.target.value)}
                    className="bg-[#121826] border-white/10 h-11 rounded-xl text-white [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Country + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Country</Label>
                <Input value={editData.country} onChange={e => set("country", e.target.value)} placeholder="e.g. Kenya" className="bg-[#121826] border-white/10 h-11 rounded-xl text-white" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Phone</Label>
                <Input type="tel" value={editData.phone} onChange={e => set("phone", e.target.value)} placeholder="+254 700 000 000" className="bg-[#121826] border-white/10 h-11 rounded-xl text-white" />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Street Address</Label>
              <Input value={editData.address} onChange={e => set("address", e.target.value)} placeholder="e.g. 12 Church Road" className="bg-[#121826] border-white/10 h-11 rounded-xl text-white" />
            </div>

            {/* City + Postal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">City / Town</Label>
                <Input value={editData.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Nairobi" className="bg-[#121826] border-white/10 h-11 rounded-xl text-white" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Postal Code</Label>
                <Input value={editData.postal_code} onChange={e => set("postal_code", e.target.value)} placeholder="e.g. 00100" maxLength={10} className="bg-[#121826] border-white/10 h-11 rounded-xl text-white" />
              </div>
            </div>

            {/* Website */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Website / Link</Label>
              <Input value={editData.website_url} onChange={e => set("website_url", e.target.value)} placeholder="https://your-link.com" className="bg-[#121826] border-white/10 h-11 rounded-xl text-white" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-5 text-gray-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || uploadingImage}
              className="h-11 px-8 rounded-xl font-bold bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black hover:opacity-90 transition shadow-[0_0_20px_rgba(0,207,255,0.3)]"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}