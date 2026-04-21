import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import GlowGroupChat from "./GlowGroupChat";
import GlowGroupEvents from "./GlowGroupEvents";
import GroupStudyPlanTab from "./GroupStudyPlanTab";

export default function GlowGroupsTab({ user }) {
  const [creating, setCreating] = useState(false);
  const [groupData, setGroupData] = useState({ name: "", country: "", description: "" });
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupTab, setGroupTab] = useState("feed");

  const { data: myGroups = [], refetch } = useQuery({
    queryKey: ["myGroups", user.email],
    queryFn: () => base44.entities.GlowGroup.filter({ leader_email: user.email })
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.GlowGroup.create({ leader_email: user.email, ...groupData });
      toast.success("GlowGroup created!");
      setGroupData({ name: "", country: "", description: "" });
      setCreating(false);
      refetch();
    } catch (err) {
      toast.error("Failed to create group");
    }
  };

  const inputStyle = { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" };
  const labelStyle = { color: "#6B7FA0" };
  const cardStyle = { background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };
  const primaryBtnStyle = { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", border: "none", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-['Inter']">
      {activeGroup ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setActiveGroup(null)} className="p-0 mr-2 h-auto" style={{ color: "#6B7FA0" }}>← Back</Button>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
              {activeGroup.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{activeGroup.name}</h2>
              <p className="text-sm font-medium mt-1" style={{ color: "#0B3FD9" }}>{activeGroup.country}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.08)" }}>
              <Users className="w-6 h-6" style={{ color: "#0B3FD9" }} />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>My GlowGroups</h2>
              <p className="text-sm font-medium mt-1" style={{ color: "#0B3FD9" }}>Micro discipleship pods</p>
            </div>
          </div>
          <Button onClick={() => setCreating(!creating)} className="font-bold font-['Space_Grotesk'] h-12 px-6 rounded-xl" style={primaryBtnStyle}>
            {creating ? "Cancel" : <><Plus className="w-5 h-5 mr-2" /> Start New Group</>}
          </Button>
        </div>
      )}

      {creating && !activeGroup && (
        <div className="mb-10 rounded-[1.5rem] p-8 relative overflow-hidden animate-in slide-in-from-top-4" style={cardStyle}>
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9, #FFD000)" }} />
          <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-6" style={{ color: "#0B1B3D" }}>Create a Digital Campfire</h3>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider ml-1" style={labelStyle}>Group Name</Label>
                <Input required placeholder="e.g. Nairobi Radiant" value={groupData.name} onChange={e => setGroupData({...groupData, name: e.target.value})} className="h-12 rounded-xl px-4" style={inputStyle} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider ml-1" style={labelStyle}>City / Country</Label>
                <Input required placeholder="e.g. Kigali, Rwanda" value={groupData.country} onChange={e => setGroupData({...groupData, country: e.target.value})} className="h-12 rounded-xl px-4" style={inputStyle} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider ml-1" style={labelStyle}>Mission Focus (Description)</Label>
              <Input required placeholder="e.g. Campus outreach and weekly prayer..." value={groupData.description} onChange={e => setGroupData({...groupData, description: e.target.value})} className="h-12 rounded-xl px-4" style={inputStyle} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" className="font-bold h-12 px-8 rounded-xl" style={primaryBtnStyle}>Launch Group ⚡</Button>
            </div>
          </form>
        </div>
      )}

      {!activeGroup ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myGroups.length === 0 && !creating ? (
            <div className="col-span-full rounded-[1.5rem] p-16 text-center cursor-pointer transition-all" style={{ background: "#FFFFFF", border: "2px dashed #D6E4FF" }} onClick={() => setCreating(true)}>
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF" }}>
                <Users className="w-10 h-10" style={{ color: "#0B3FD9" }} />
              </div>
              <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-2" style={{ color: "#0B1B3D" }}>No Groups Yet</h3>
              <p className="mb-6 max-w-md mx-auto" style={{ color: "#6B7FA0" }}>GlowGroups are small accountability pods of 4-6 friends. Start one today to multiply the light!</p>
              <span className="inline-block font-bold pb-1 border-b" style={{ color: "#0B3FD9", borderColor: "#D6E4FF" }}>Click to create your first group →</span>
            </div>
          ) : (
            myGroups.map(g => (
              <div key={g.id} onClick={() => setActiveGroup(g)} className="cursor-pointer rounded-[1.5rem] p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl transition-opacity">✨</div>
                <div className="mb-4">
                  <h3 className="text-2xl font-bold font-['Space_Grotesk'] mb-1" style={{ color: "#0B3FD9" }}>{g.name}</h3>
                  <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#6B7FA0" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }}></span>
                    {g.country}
                  </div>
                </div>
                <p className="text-[15px] mb-6 leading-relaxed min-h-[60px]" style={{ color: "#4A5878" }}>{g.description}</p>
                <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: "#E6ECF5" }}>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", border: "2px solid #FFFFFF" }}>YOU</div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: "#F6F8FC", border: "2px dashed #D6E4FF", color: "#8A97B5" }}>+</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg" style={{ background: "rgba(255, 208, 0, 0.12)", border: "1px solid #FFE4A0", color: "#CC7A00" }}>
                    Leader
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-[1.5rem] overflow-hidden" style={cardStyle}>
          <div className="flex border-b" style={{ borderColor: "#E6ECF5" }}>
            {[{ key: 'feed', label: 'Group Feed' }, { key: 'chat', label: 'Chat' }, { key: 'events', label: 'Events' }, { key: 'study', label: 'Study Plan' }].map(tab => (
              <button key={tab.key} onClick={() => setGroupTab(tab.key)} className="flex-1 py-4 font-bold transition border-b-2" style={groupTab === tab.key ? { color: "#0B3FD9", borderColor: "#0B3FD9" } : { color: "#6B7FA0", borderColor: "transparent" }}>{tab.label}</button>
            ))}
          </div>
          <div className="p-6">
            {groupTab === 'feed' && (
              <div className="text-center py-8" style={{ color: "#6B7FA0" }}>
                <div className="text-4xl mb-4">🌱</div>
                <p>Your group's private feed is growing here. Share updates, prayers, and Glow Drops with your members.</p>
                <Button className="mt-6" style={primaryBtnStyle}>Post to Group</Button>
              </div>
            )}
            {groupTab === 'chat' && <GlowGroupChat group={activeGroup} user={user} />}
            {groupTab === 'events' && <GlowGroupEvents group={activeGroup} user={user} />}
            {groupTab === 'study' && <GroupStudyPlanTab group={activeGroup} user={user} />}
          </div>
        </div>
      )}
    </div>
  );
}