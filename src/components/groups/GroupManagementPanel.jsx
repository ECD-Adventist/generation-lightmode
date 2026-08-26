import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Shield, Crown, UserX, Trash2, Edit3, ChevronDown, Loader2, X, AlertTriangle, Camera, Image as ImageIcon, Lock, Globe2, Sparkles } from "lucide-react";
import ImageCropperModal from "@/components/ui/ImageCropperModal";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

const ROLE_OPTIONS = [
  { value: "member", label: "Member", color: "#6B7FA0" },
  { value: "moderator", label: "Moderator", color: "#0B3FD9" },
  { value: "scribe", label: "Scribe", color: "#7C3AED" },
  { value: "coordinator", label: "Coordinator", color: "#16A34A" },
  { value: "worship_lead", label: "Worship Lead", color: "#CC7A00" },
  { value: "prayer_lead", label: "Prayer Lead", color: "#DC2626" },
];

export const ROLE_META = Object.fromEntries(ROLE_OPTIONS.map(r => [r.value, r]));

export default function GroupManagementPanel({ group, members, allUsers, currentUser }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(null);

  const getUser = (email) => allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0] || "Member", email };

  const manageMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await base44.functions.invoke("manageGroupMembership", { group_id: group.id, ...payload });
      if (!res.data?.success) throw new Error(res.data?.error || "Failed");
      return res.data;
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["groupMembers", group.id] });
      queryClient.invalidateQueries({ queryKey: ["glowGroup", group.id] });
      queryClient.invalidateQueries({ queryKey: ["allGroups"] });
      if (vars.action === "set_role") toast.success("Role updated ✅");
      else if (vars.action === "remove_member") toast.success("Member removed");
      else if (vars.action === "transfer_leadership") { toast.success("Leadership transferred 👑"); setShowTransferConfirm(null); }
      else if (vars.action === "update_group") { toast.success("Group updated"); setShowEdit(false); }
      else if (vars.action === "delete_group") { toast.success("Group deleted"); navigate(createPageUrl("GlowGroups")); }
      setOpenMenuFor(null);
    },
    onError: (err) => toast.error(err.message || "Action failed"),
  });

  // Members excluding leader
  const manageable = members.filter(m => m.user_email !== group.leader_email);

  return (
    <div className="space-y-3">
      {/* Edit group info */}
      <button onClick={() => setShowEdit(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
        <Edit3 className="w-4 h-4" style={{ color: "#0B3FD9" }} /> Edit Group Details
      </button>

      {/* Manage members with roles */}
      <div className="rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
        <div className="px-3 py-2.5 border-b" style={{ borderColor: "#F0F4FA" }}>
          <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#0B3FD9" }}>
            <Shield className="w-3.5 h-3.5" /> Manage Roles & Members
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {manageable.length === 0 && <div className="text-center text-xs py-4" style={{ color: "#8A97B5" }}>No other members yet.</div>}
          {manageable.map(m => {
            const u = getUser(m.user_email);
            const role = m.role || "member";
            const meta = ROLE_META[role] || ROLE_META.member;
            const isBusy = manageMutation.isPending && manageMutation.variables?.target_email === m.user_email;
            return (
              <div key={m.id} className="px-3 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "#F0F4FA" }}>
                <img src={u.profile_picture_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover shrink-0" style={{ border: "1px solid #E6ECF5" }} alt={u.full_name} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: "#0B1B3D" }}>{u.full_name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</div>
                </div>

                {/* Role selector — opens an overlay sheet to avoid sidebar clipping */}
                <button onClick={() => setOpenMenuFor(m)} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }} title="Change role">
                  {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger zone */}
      <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
        <Trash2 className="w-4 h-4" /> Delete Group (Permanent)
      </button>

      {/* Modals */}
      {openMenuFor && (
        <RolePickerModal
          member={openMenuFor}
          user={getUser(openMenuFor.user_email)}
          isBusy={manageMutation.isPending}
          onClose={() => setOpenMenuFor(null)}
          onSetRole={(role) => manageMutation.mutate({ action: "set_role", target_email: openMenuFor.user_email, role })}
          onTransfer={() => { setShowTransferConfirm(openMenuFor.user_email); setOpenMenuFor(null); }}
          onRemove={() => { if (confirm(`Remove ${getUser(openMenuFor.user_email).full_name} from the group?`)) { manageMutation.mutate({ action: "remove_member", target_email: openMenuFor.user_email }); } }}
        />
      )}

      {showEdit && <EditGroupModal group={group} onClose={() => setShowEdit(false)} onSave={(data) => manageMutation.mutate({ action: "update_group", ...data })} isBusy={manageMutation.isPending} />}

      {showTransferConfirm && (
        <ConfirmModal
          icon={<Crown className="w-6 h-6" style={{ color: "#CC7A00" }} />}
          iconBg="#FFF8E6"
          title="Transfer Leadership?"
          message={<>You will become a regular member. <strong>{getUser(showTransferConfirm).full_name}</strong> will become the new leader of "{group.name}". This action cannot be undone by you.</>}
          confirmLabel="Yes, transfer"
          confirmColor="#CC7A00"
          onConfirm={() => manageMutation.mutate({ action: "transfer_leadership", target_email: showTransferConfirm })}
          onCancel={() => setShowTransferConfirm(null)}
          isBusy={manageMutation.isPending}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          icon={<AlertTriangle className="w-6 h-6" style={{ color: "#DC2626" }} />}
          iconBg="#FEF2F2"
          title="Delete this group permanently?"
          message={<>This will permanently delete <strong>"{group.name}"</strong>, all its messages, events, resources, and remove all members. <strong>This cannot be undone.</strong></>}
          confirmLabel="Delete Forever"
          confirmColor="#DC2626"
          onConfirm={() => manageMutation.mutate({ action: "delete_group" })}
          onCancel={() => setShowDeleteConfirm(false)}
          isBusy={manageMutation.isPending}
        />
      )}
    </div>
  );
}

function EditGroupModal({ group, onClose, onSave, isBusy }) {
  const [form, setForm] = useState({
    name: group.name || "",
    country: group.country || "",
    description: group.description || "",
    welcome_message: group.welcome_message || "",
    privacy: group.privacy || "public",
    tags: group.tags || "",
    profile_picture_url: group.profile_picture_url || "",
    cover_picture_url: group.cover_picture_url || "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [cropData, setCropData] = useState(null);
  const avatarInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);

  const inputStyle = { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" };

  const handleImageSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropData({ file, type, aspectRatio: type === 'avatar' ? 1 : 3 });
    e.target.value = null;
  };

  const handleCropComplete = async (croppedFile) => {
    const type = cropData.type;
    setCropData(null);
    const setUploading = type === "avatar" ? setUploadingAvatar : setUploadingCover;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file: croppedFile });
      setForm(f => ({ ...f, [type === "avatar" ? "profile_picture_url" : "cover_picture_url"]: res.file_url }));
      toast.success(`${type === "avatar" ? "Profile picture" : "Cover"} uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(11, 27, 61, 0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col" style={{ background: "#FFFFFF", boxShadow: "0 30px 80px rgba(11, 63, 217, 0.35)", maxHeight: "92vh" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 4, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9, #FFD000)" }} />
        <div className="px-6 py-4 flex items-center justify-between border-b shrink-0" style={{ borderColor: "#E6ECF5", background: "linear-gradient(180deg, #F6F8FC 0%, #FFFFFF 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight" style={{ color: "#0B1B3D", fontFamily: "Space Grotesk, sans-serif" }}>Edit Group</h3>
              <p className="text-[11px]" style={{ color: "#6B7FA0" }}>Customize how your group looks & feels</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center transition hover:rotate-90" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}><X className="w-4 h-4" /></button>
        </div>
        {cropData && (
          <ImageCropperModal file={cropData.file} aspectRatio={cropData.aspectRatio} onCancel={() => setCropData(null)} onCrop={handleCropComplete} />
        )}
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4 overflow-y-auto">
          {/* Cover + Avatar preview */}
          <div className="relative rounded-2xl overflow-hidden" style={{ height: 120, background: form.cover_picture_url ? `url(${form.cover_picture_url}) center/cover` : "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)" }}>
            <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 disabled:opacity-60" style={{ background: "rgba(255,255,255,0.95)", color: "#0B3FD9", backdropFilter: "blur(8px)" }}>
              {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />} Cover
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "cover")} />

            {/* Avatar */}
            <div className="absolute -bottom-8 left-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl" style={{ background: form.profile_picture_url ? `url(${form.profile_picture_url}) center/cover` : "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", border: "4px solid #FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.2)" }}>
                  {!form.profile_picture_url && "✨"}
                </div>
                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-60" style={{ background: "#0B3FD9", color: "#FFFFFF", border: "2px solid #FFFFFF", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.3)" }}>
                  {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "avatar")} />
              </div>
            </div>
          </div>
          <div className="h-10" />

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>Group Name</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none" style={inputStyle} placeholder="e.g. LightMode Champions | Tanzania" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>City / Country</label>
              <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none" style={inputStyle} placeholder="Nairobi, Kenya" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>Privacy</label>
              <div className="flex gap-1 rounded-xl p-1" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                <button type="button" onClick={() => setForm({ ...form, privacy: "public" })} className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg text-xs font-bold transition" style={form.privacy === "public" ? { background: "#FFFFFF", color: "#0B3FD9", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.1)" } : { background: "transparent", color: "#6B7FA0" }}>
                  <Globe2 className="w-3 h-3" /> Public
                </button>
                <button type="button" onClick={() => setForm({ ...form, privacy: "private" })} className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg text-xs font-bold transition" style={form.privacy === "private" ? { background: "#FFFFFF", color: "#CC7A00", boxShadow: "0 2px 6px rgba(204, 122, 0, 0.1)" } : { background: "transparent", color: "#6B7FA0" }}>
                  <Lock className="w-3 h-3" /> Private
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none" style={inputStyle} placeholder="What's this group about?" />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5" style={{ color: "#6B7FA0" }}><Sparkles className="w-3 h-3" /> Welcome Message</label>
            <textarea value={form.welcome_message} onChange={e => setForm({ ...form, welcome_message: e.target.value })} rows={2} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none" style={inputStyle} placeholder="Greeting shown to new members when they join" />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#6B7FA0" }}>Tags</label>
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none" style={inputStyle} placeholder="prayer, youth, worship (comma-separated)" />
          </div>

          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>Cancel</button>
            <button type="submit" disabled={isBusy || uploadingAvatar || uploadingCover} className="px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-60" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>
              {isBusy && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RolePickerModal({ member, user, isBusy, onClose, onSetRole, onTransfer, onRemove }) {
  const currentRole = member.role || "member";
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(11, 27, 61, 0.55)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", boxShadow: "0 20px 60px rgba(11, 27, 61, 0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9, #FFD000)" }} />
        <div className="px-5 py-4 flex items-center gap-3 border-b" style={{ borderColor: "#E6ECF5" }}>
          <img src={user.profile_picture_url || defaultAvatar} className="w-10 h-10 rounded-full object-cover" style={{ border: "1px solid #E6ECF5" }} alt={user.full_name} />
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate" style={{ color: "#0B1B3D" }}>{user.full_name}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ROLE_META[currentRole]?.color || "#6B7FA0" }}>Currently: {ROLE_META[currentRole]?.label || "Member"}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}><X className="w-4 h-4" /></button>
        </div>

        <div className="p-3">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8A97B5" }}>Assign Role</div>
          <div className="grid grid-cols-1 gap-1">
            {ROLE_OPTIONS.map(opt => {
              const isCurrent = currentRole === opt.value;
              return (
                <button key={opt.value} disabled={isBusy} onClick={() => onSetRole(opt.value)} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-3 disabled:opacity-60" style={{ background: isCurrent ? `${opt.color}12` : "transparent", border: isCurrent ? `1px solid ${opt.color}40` : "1px solid transparent", color: opt.color }}
                  onMouseOver={e => { if (!isCurrent) e.currentTarget.style.background = "#F6F8FC"; }}
                  onMouseOut={e => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />
                  <span className="flex-1">{opt.label}</span>
                  {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: opt.color, color: "#FFFFFF" }}>Current</span>}
                </button>
              );
            })}
          </div>

          <div className="border-t mt-3 pt-2" style={{ borderColor: "#F0F4FA" }}>
            <button disabled={isBusy} onClick={onTransfer} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-3 disabled:opacity-60" style={{ color: "#CC7A00" }}
              onMouseOver={e => e.currentTarget.style.background = "#FFF8E6"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <Crown className="w-4 h-4" /> Transfer Leadership
            </button>
            <button disabled={isBusy} onClick={onRemove} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-3 disabled:opacity-60" style={{ color: "#DC2626" }}
              onMouseOver={e => e.currentTarget.style.background = "#FEF2F2"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <UserX className="w-4 h-4" /> Remove from Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ icon, iconBg, title, message, confirmLabel, confirmColor, onConfirm, onCancel, isBusy }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(11, 27, 61, 0.55)" }} onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden p-6" style={{ background: "#FFFFFF", boxShadow: "0 20px 60px rgba(11, 27, 61, 0.3)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: iconBg }}>{icon}</div>
          <h3 className="font-bold text-lg" style={{ color: "#0B1B3D" }}>{title}</h3>
        </div>
        <p className="text-sm mb-5" style={{ color: "#4A5878" }}>{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>Cancel</button>
          <button onClick={onConfirm} disabled={isBusy} className="px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-60" style={{ background: confirmColor, color: "#FFFFFF" }}>
            {isBusy && <Loader2 className="w-4 h-4 animate-spin" />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}