import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import GlowGroupChat from "./GlowGroupChat";
import GlowGroupEvents from "./GlowGroupEvents";

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
      await base44.entities.GlowGroup.create({
        leader_email: user.email,
        ...groupData
      });
      toast.success("GlowGroup created!");
      setGroupData({ name: "", country: "", description: "" });
      setCreating(false);
      refetch();
    } catch (err) {
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {activeGroup ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setActiveGroup(null)} className="text-gray-400 hover:text-white p-0 mr-2 h-auto">← Back</Button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] flex items-center justify-center font-bold text-black text-xl">
              {activeGroup.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-white">{activeGroup.name}</h2>
              <p className="text-sm text-[#00CFFF] font-medium font-['Inter'] mt-1">{activeGroup.country}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00CFFF]/10 flex items-center justify-center border border-[#00CFFF]/30 shadow-[0_0_15px_rgba(0,207,255,0.15)]">
              <Users className="text-[#00CFFF] w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-white">My GlowGroups</h2>
              <p className="text-sm text-[#00CFFF] font-medium font-['Inter'] mt-1">Micro discipleship pods</p>
            </div>
          </div>
          <Button onClick={() => setCreating(!creating)} className="bg-white/5 border border-white/10 text-white hover:bg-gradient-to-r hover:from-[#00CFFF] hover:to-[#8A5CFF] hover:border-transparent hover:text-[#0B0F1A] font-bold font-['Space_Grotesk'] h-12 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(0,207,255,0.4)]">
            {creating ? "Cancel" : <><Plus className="w-5 h-5 mr-2" /> Start New Group</>}
          </Button>
        </div>
      )}

      {creating && !activeGroup && (
        <div className="bg-[#121826]/90 backdrop-blur-xl border border-[#00CFFF]/30 mb-10 text-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative overflow-hidden animate-in slide-in-from-top-4">
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #00CFFF, #8A5CFF, #FFD000)" }} />
          <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-6">Create a Digital Campfire</h3>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-gray-300 text-xs font-bold uppercase tracking-wider ml-1">Group Name</Label>
                <Input required placeholder="e.g. Nairobi Radiant" value={groupData.name} onChange={e => setGroupData({...groupData, name: e.target.value})} className="bg-[#0B0F1A] border-white/10 text-white h-12 rounded-xl focus-visible:ring-[#00CFFF]/50 focus-visible:border-[#00CFFF]" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-xs font-bold uppercase tracking-wider ml-1">City / Country</Label>
                <Input required placeholder="e.g. Kigali, Rwanda" value={groupData.country} onChange={e => setGroupData({...groupData, country: e.target.value})} className="bg-[#0B0F1A] border-white/10 text-white h-12 rounded-xl focus-visible:ring-[#00CFFF]/50 focus-visible:border-[#00CFFF]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-xs font-bold uppercase tracking-wider ml-1">Mission Focus (Description)</Label>
              <Input required placeholder="e.g. Campus outreach and weekly prayer..." value={groupData.description} onChange={e => setGroupData({...groupData, description: e.target.value})} className="bg-[#0B0F1A] border-white/10 text-white h-12 rounded-xl focus-visible:ring-[#00CFFF]/50 focus-visible:border-[#00CFFF]" />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-[#00CFFF] text-[#0B0F1A] hover:bg-white font-bold h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all">Launch Group ⚡</Button>
            </div>
          </form>
        </div>
      )}

      {!activeGroup ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myGroups.length === 0 && !creating ? (
            <div className="col-span-full bg-[#121826]/50 border border-white/5 rounded-2xl p-16 text-center cursor-pointer hover:bg-[#121826]/80 transition-all border-dashed hover:border-[#00CFFF]/30" onClick={() => setCreating(true)}>
              <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold font-['Space_Grotesk'] text-white mb-2">No Groups Yet</h3>
              <p className="text-gray-400 font-['Inter'] mb-6 max-w-md mx-auto">GlowGroups are small accountability pods of 4-6 friends. Start one today to multiply the light!</p>
              <span className="inline-block text-[#00CFFF] font-bold pb-1 border-b border-[#00CFFF]/30">Click to create your first group →</span>
            </div>
          ) : (
            myGroups.map(g => (
              <div key={g.id} onClick={() => setActiveGroup(g)} className="cursor-pointer bg-[#121826]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[#00CFFF]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,207,255,0.15)]">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:opacity-20 transition-opacity transform group-hover:rotate-12">✨</div>
                
                <div className="mb-4">
                  <h3 className="text-2xl font-bold font-['Space_Grotesk'] text-[#00CFFF] mb-1">{g.name}</h3>
                  <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    {g.country}
                  </div>
                </div>
                
                <p className="text-[15px] text-gray-300 mb-6 font-['Inter'] leading-relaxed min-h-[60px]">{g.description}</p>
                
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] border-2 border-[#121826] flex items-center justify-center text-xs font-bold text-[#0B0F1A]">YOU</div>
                      <div className="w-8 h-8 rounded-full bg-[#1A2033] border-2 border-[#121826] border-dashed flex items-center justify-center text-xs text-gray-400">+</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-[#8A5CFF] uppercase tracking-wider bg-[#8A5CFF]/10 px-3 py-1.5 rounded-lg border border-[#8A5CFF]/20">
                    Leader
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-[#121826]/50 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            <button onClick={() => setGroupTab('feed')} className={`flex-1 py-4 font-bold transition ${groupTab === 'feed' ? 'text-[#00CFFF] border-b-2 border-[#00CFFF]' : 'text-gray-400 hover:text-white'}`}>Group Feed</button>
            <button onClick={() => setGroupTab('chat')} className={`flex-1 py-4 font-bold transition ${groupTab === 'chat' ? 'text-[#00CFFF] border-b-2 border-[#00CFFF]' : 'text-gray-400 hover:text-white'}`}>Chat</button>
            <button onClick={() => setGroupTab('events')} className={`flex-1 py-4 font-bold transition ${groupTab === 'events' ? 'text-[#00CFFF] border-b-2 border-[#00CFFF]' : 'text-gray-400 hover:text-white'}`}>Events</button>
          </div>
          <div className="p-6">
            {groupTab === 'feed' && (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-4">🌱</div>
                <p>Your group's private feed is growing here. Share updates, prayers, and Glow Drops with your members.</p>
                <Button className="mt-6 bg-[#00CFFF]/20 text-[#00CFFF] hover:bg-[#00CFFF]/30">Post to Group</Button>
              </div>
            )}
            {groupTab === 'chat' && <GlowGroupChat group={activeGroup} user={user} />}
            {groupTab === 'events' && <GlowGroupEvents group={activeGroup} user={user} />}
          </div>
        </div>
      )}
    </div>
  );
}