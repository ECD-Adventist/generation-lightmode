import React, { useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import { Camera, CheckCircle2, Loader2, Plus, Share2, Target, Users, X } from "lucide-react";
import { toast } from "sonner";

const steps = [
  { key: "banner", title: "Hero Banner", icon: Camera },
  { key: "social", title: "Social Links", icon: Share2 },
  { key: "team", title: "Team Members", icon: Users },
  { key: "mission", title: "Mission", icon: Target },
];

const emptySocial = { facebook: "", instagram: "", youtube: "", x: "", linkedin: "" };

export default function InstitutionSetupWizard({ page, onComplete }) {
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [cropData, setCropData] = useState(null);
  const bannerRef = useRef(null);

  const initialSocial = useMemo(() => {
    try { return { ...emptySocial, ...JSON.parse(page.social_links || "{}") }; } catch { return emptySocial; }
  }, [page.social_links]);

  const initialTeam = useMemo(() => {
    try { return JSON.parse(page.team_members || "[]"); } catch { return []; }
  }, [page.team_members]);

  const [form, setForm] = useState({
    banner_url: page.banner_url || "",
    social_links: initialSocial,
    team_members: initialTeam.length ? initialTeam : [{ name: "", role: "", avatar: "" }],
    mission_statement: page.mission_statement || "",
  });

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropData({ file, aspectRatio: 3 });
    e.target.value = null;
  };

  const handleCropComplete = async (croppedFile) => {
    setCropData(null);
    const toastId = toast.loading("Uploading banner...");
    const res = await base44.integrations.Core.UploadFile({ file: croppedFile });
    setForm(prev => ({ ...prev, banner_url: res.file_url }));
    toast.success("Banner uploaded", { id: toastId });
  };

  const updateTeamMember = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      team_members: prev.team_members.map((member, i) => i === index ? { ...member, [field]: value } : member)
    }));
  };

  const addTeamMember = () => {
    setForm(prev => ({ ...prev, team_members: [...prev.team_members, { name: "", role: "", avatar: "" }] }));
  };

  const removeTeamMember = (index) => {
    setForm(prev => ({ ...prev, team_members: prev.team_members.filter((_, i) => i !== index) }));
  };

  const handleFinish = async () => {
    if (!form.banner_url) { toast.error("Please upload a hero banner first."); setActiveStep(0); return; }
    if (!form.mission_statement.trim()) { toast.error("Please add your mission statement."); setActiveStep(3); return; }

    setSaving(true);
    await base44.entities.InstitutionPage.update(page.id, {
      banner_url: form.banner_url,
      social_links: JSON.stringify(form.social_links),
      team_members: JSON.stringify(form.team_members.filter(member => member.name?.trim())),
      mission_statement: form.mission_statement,
      setup_completed: true,
      setup_completed_at: new Date().toISOString(),
    });
    toast.success("Institution profile setup completed!");
    setSaving(false);
    onComplete?.();
  };

  const StepIcon = steps[activeStep].icon;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {cropData && <ImageCropperModal file={cropData.file} aspectRatio={cropData.aspectRatio} onCancel={() => setCropData(null)} onCrop={handleCropComplete} />}

      <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-[#121826] shadow-2xl">
        <div className="relative p-7 sm:p-9 bg-gradient-to-br from-[#0B0F1A] via-[#101B35] to-[#0B3FD9]/30">
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at top right, #00CFFF 0%, transparent 35%), radial-gradient(circle at bottom left, #FFD000 0%, transparent 25%)" }} />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD000] mb-2">Approved Institution Setup</p>
            <h2 className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-white">Finish your institution profile</h2>
            <p className="text-sm text-gray-300 mt-2 max-w-2xl">Complete these guided steps so your public institution page looks polished and ready for the LightMode community.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          <div className="p-5 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0B0F1A]/60">
            <div className="space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const active = activeStep === index;
                const done = index < activeStep;
                return (
                  <button key={step.key} onClick={() => setActiveStep(index)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition" style={{ background: active ? "rgba(0,207,255,0.12)" : "transparent", color: active ? "#00CFFF" : "#C8D0E0" }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: done ? "rgba(34,197,94,0.15)" : active ? "rgba(0,207,255,0.15)" : "rgba(255,255,255,0.05)" }}>
                      {done ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Icon className="w-4 h-4" />}
                    </span>
                    <span className="font-bold text-sm">{step.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 sm:p-8 min-h-[430px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-[#00CFFF]/10 border border-[#00CFFF]/20 flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-[#00CFFF]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white font-['Space_Grotesk']">{steps[activeStep].title}</h3>
                <p className="text-xs text-gray-500">Step {activeStep + 1} of {steps.length}</p>
              </div>
            </div>

            {activeStep === 0 && (
              <div>
                <div onClick={() => bannerRef.current?.click()} className="h-56 rounded-2xl border-2 border-dashed border-white/10 bg-[#0B0F1A] cursor-pointer overflow-hidden group relative flex items-center justify-center">
                  {form.banner_url ? <img src={form.banner_url} className="w-full h-full object-cover" /> : <div className="text-center text-gray-500"><Camera className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">Upload a wide hero banner</p></div>}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold">Change Banner</div>
                </div>
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </div>
            )}

            {activeStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(emptySocial).map((key) => (
                  <Input key={key} placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} URL`} value={form.social_links[key] || ""} onChange={(e) => setForm(prev => ({ ...prev, social_links: { ...prev.social_links, [key]: e.target.value } }))} className="bg-[#0B0F1A] border-white/10 rounded-xl h-12" />
                ))}
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-3">
                {form.team_members.map((member, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 bg-[#0B0F1A] border border-white/10 rounded-xl p-3">
                    <Input placeholder="Name" value={member.name} onChange={(e) => updateTeamMember(index, "name", e.target.value)} className="bg-[#121826] border-white/10" />
                    <Input placeholder="Role" value={member.role} onChange={(e) => updateTeamMember(index, "role", e.target.value)} className="bg-[#121826] border-white/10" />
                    <Input placeholder="Avatar URL" value={member.avatar} onChange={(e) => updateTeamMember(index, "avatar", e.target.value)} className="bg-[#121826] border-white/10" />
                    <button onClick={() => removeTeamMember(index)} className="w-10 h-10 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <Button onClick={addTeamMember} className="bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
              </div>
            )}

            {activeStep === 3 && (
              <Textarea value={form.mission_statement} onChange={(e) => setForm(prev => ({ ...prev, mission_statement: e.target.value }))} placeholder="Write your institution’s primary mission statement..." className="bg-[#0B0F1A] border-white/10 rounded-xl min-h-[190px]" />
            )}

            <div className="flex justify-between gap-3 pt-8 mt-8 border-t border-white/10">
              <Button variant="ghost" disabled={activeStep === 0} onClick={() => setActiveStep(prev => Math.max(0, prev - 1))} className="border border-white/10 text-gray-300 rounded-xl">Back</Button>
              {activeStep < steps.length - 1 ? (
                <Button onClick={() => setActiveStep(prev => prev + 1)} className="bg-[#00CFFF] text-[#0B0F1A] font-black rounded-xl">Next Step</Button>
              ) : (
                <Button onClick={handleFinish} disabled={saving} className="bg-gradient-to-r from-[#FFD000] to-[#00CFFF] text-[#0B0F1A] font-black rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Finish Setup
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}