import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Loader2, Calendar, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";

export default function EditProfileModal({ isOpen, onClose, user, onSaved }) {
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropData, setCropData] = useState(null);
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [editData, setEditData] = useState({
    display_name: user?.display_name || user?.full_name || "",
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
        display_name: user.display_name || user.full_name || "",
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
    if (!editData.display_name.trim()) {
      toast.error("Display name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await base44.functions.invoke("updateProfile", editData);
      if (!res.data?.success) throw new Error(res.data?.error || "Save failed");

      // Re-fetch the fresh user record from the server (source of truth)
      const updated = await base44.auth.me();

      // Invalidate caches so Profile page + public user lists re-fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["allUsersForProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["overviewPublicUsers"] });

      toast.success("Profile saved! ✨");
      onSaved(updated);
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
        <div className="relative z-10 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[92vh]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b shrink-0" style={{ borderColor: "#E6ECF5" }}>
            <div>
              <h2 className="text-lg font-black" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#0B1B3D" }}>Edit Profile</h2>
              <p className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>Changes are saved to your account</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center transition" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Photos row */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider mb-3 block" style={{ color: "#6B7FA0" }}>Photos</Label>
              <div className="flex items-center gap-4">
                {/* Profile pic */}
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="relative w-16 h-16 rounded-full p-[2px] shrink-0 group"
                  style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF" }}>
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
                  className="relative flex-1 h-16 rounded-xl overflow-hidden group"
                  style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}
                  style={editData.cover_picture_url ? { backgroundImage: `url(${editData.cover_picture_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                      <Camera className="w-4 h-4" /> Cover Photo
                    </div>
                  </div>
                  {!editData.cover_picture_url && (
                    <span className="text-xs absolute inset-0 flex items-center justify-center" style={{ color: "#8A97B5" }}>
                      + Cover Photo
                    </span>
                  )}
                </button>
                <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "cover")} />
              </div>
              {uploadingImage && (
                <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "#0B3FD9" }}><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#6B7FA0" }}>Display Name <span className="text-red-400">*</span></Label>
              <Input required value={editData.display_name} onChange={e => set("display_name", e.target.value)} placeholder="How your name appears in the app" className="h-11 rounded-xl" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }} />
              <p className="text-[11px] mt-1.5" style={{ color: "#8A97B5" }}>This is the name shown throughout the app. You can change it anytime.</p>
            </div>

            {/* Bio */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider mb-1.5 flex items-center justify-between" style={{ color: "#6B7FA0" }}>
                <span>Bio</span>
                <span style={{ color: "#8A97B5" }}>{editData.bio.length}/1200</span>
              </Label>
              <textarea
                value={editData.bio}
                onChange={e => set("bio", e.target.value.slice(0, 1200))}
                placeholder="Tell people about yourself…"
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
              />
            </div>

            {/* Gender + DOB */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#6B7FA0" }}>Gender</Label>
                <BottomSheetSelect
                  value={editData.gender}
                  onChange={v => set("gender", v)}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "prefer_not_to_say", label: "Prefer not to say" }
                  ]}
                  placeholder="Select…"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#6B7FA0" }}>Date of Birth</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={editData.date_of_birth}
                    onChange={e => set("date_of_birth", e.target.value)}
                    className="h-11 rounded-xl [color-scheme:light]"
                    style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
                  />
                </div>
              </div>
            </div>

            {/* Country + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#6B7FA0" }}>Country</Label>
                <Input value={editData.country} onChange={e => set("country", e.target.value)} placeholder="e.g. Kenya" className="h-11 rounded-xl" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }} />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#6B7FA0" }}>Phone</Label>
                <Input type="tel" value={editData.phone} onChange={e => set("phone", e.target.value)} placeholder="+254 700 000 000" className="h-11 rounded-xl" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }} />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#6B7FA0" }}>Street Address</Label>
              <Input value={editData.address} onChange={e => set("address", e.target.value)} placeholder="e.g. 12 Church Road" className="h-11 rounded-xl" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }} />
            </div>

            {/* City + Postal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#6B7FA0" }}>City / Town</Label>
                <Input value={editData.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Nairobi" className="h-11 rounded-xl" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }} />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#6B7FA0" }}>Postal Code</Label>
                <Input value={editData.postal_code} onChange={e => set("postal_code", e.target.value)} placeholder="e.g. 00100" maxLength={10} className="h-11 rounded-xl" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }} />
              </div>
            </div>

            {/* Website */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#6B7FA0" }}>Website / Link</Label>
              <Input value={editData.website_url} onChange={e => set("website_url", e.target.value)} placeholder="https://your-link.com" className="h-11 rounded-xl" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex justify-end gap-3 shrink-0" style={{ borderColor: "#E6ECF5" }}>
            <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-5" style={{ color: "#4A5878" }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || uploadingImage}
              className="h-11 px-8 rounded-xl font-bold hover:opacity-90 transition"
              style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}