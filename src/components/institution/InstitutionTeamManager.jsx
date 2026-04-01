import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Users } from "lucide-react";

export default function InstitutionTeamManager({ page, onUpdated }) {
  const [saving, setSaving] = useState(false);

  const initialMembers = useMemo(() => {
    try { return JSON.parse(page.team_members || "[]"); } catch { return []; }
  }, [page.team_members]);

  const [members, setMembers] = useState(initialMembers);

  const addMember = () => {
    setMembers(prev => [...prev, { name: "", role: "", avatar: "" }]);
  };

  const updateMember = (index, field, value) => {
    setMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const removeMember = (index) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Filter out empty entries
    const validMembers = members.filter(m => m.name.trim());
    setSaving(true);
    try {
      await base44.entities.InstitutionPage.update(page.id, {
        team_members: JSON.stringify(validMembers)
      });
      toast.success("Team updated!");
      onUpdated();
    } catch (err) {
      toast.error(err?.message || "Failed to save team");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold font-['Space_Grotesk'] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00CFFF]" /> Team Members
          </h3>
          <p className="text-sm text-gray-500 mt-1">Add people who are part of your institution's leadership team.</p>
        </div>
        <Button onClick={addMember} className="bg-[#00CFFF]/15 text-[#00CFFF] border border-[#00CFFF]/30 hover:bg-[#00CFFF]/25 font-bold rounded-xl h-10 px-4">
          <Plus className="w-4 h-4 mr-1" /> Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-16 bg-[#121826] rounded-2xl border border-white/5">
          <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No team members yet.</p>
          <Button onClick={addMember} className="bg-[#00CFFF]/15 text-[#00CFFF] border border-[#00CFFF]/30 hover:bg-[#00CFFF]/25 font-bold rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Add First Member
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member, idx) => (
            <div key={idx} className="bg-[#121826] rounded-xl p-4 border border-white/5 flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00CFFF]/20 to-[#8A5CFF]/20 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {member.avatar ? (
                  <img src={member.avatar} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-gray-500">{member.name?.[0]?.toUpperCase() || "?"}</span>
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Name *"
                  value={member.name}
                  onChange={e => updateMember(idx, "name", e.target.value)}
                  className="bg-[#0B0F1A] border-white/10 h-10 rounded-lg text-sm"
                />
                <Input
                  placeholder="Role (e.g. Pastor)"
                  value={member.role}
                  onChange={e => updateMember(idx, "role", e.target.value)}
                  className="bg-[#0B0F1A] border-white/10 h-10 rounded-lg text-sm"
                />
                <Input
                  placeholder="Avatar URL (optional)"
                  value={member.avatar}
                  onChange={e => updateMember(idx, "avatar", e.target.value)}
                  className="bg-[#0B0F1A] border-white/10 h-10 rounded-lg text-sm"
                />
              </div>

              <button onClick={() => removeMember(idx)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {members.length > 0 && (
        <div className="flex justify-end pt-4 border-t border-white/5">
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold h-12 px-8 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Team
          </Button>
        </div>
      )}
    </div>
  );
}