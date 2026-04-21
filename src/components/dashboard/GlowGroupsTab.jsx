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

  const inputClass = "bg-muted border border-border text-foreground h-12 rounded-xl focus:ring-1 focus:ring-ring px-4";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-['Inter']">
      {activeGroup ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setActiveGroup(null)} className="p-0 mr-2 h-auto text-muted-foreground hover:text-foreground">← Back</Button>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
              {activeGroup.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-foreground">{activeGroup.name}</h2>
              <p className="text-sm font-medium mt-1 text-blue-600 dark:text-blue-400">{activeGroup.country}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shadow-sm">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-foreground">My GlowGroups</h2>
              <p className="text-sm font-medium mt-1 text-blue-600 dark:text-blue-400">Micro discipleship pods</p>
            </div>
          </div>
          <Button onClick={() => setCreating(!creating)} className="font-bold font-['Space_Grotesk'] h-12 px-6 rounded-xl transition-all bg-gradient-to-r from-cyan-400 to-blue-600 text-white border-none shadow-sm hover:opacity-90">
            {creating ? "Cancel" : <><Plus className="w-5 h-5 mr-2" /> Start New Group</>}
          </Button>
        </div>
      )}

      {creating && !activeGroup && (
        <div className="mb-10 rounded-[1.5rem] p-8 relative overflow-hidden animate-in slide-in-from-top-4 bg-card border border-blue-500/20 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-amber-500" />
          <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-6 text-foreground">Create a Digital Campfire</h3>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider ml-1 text-muted-foreground">Group Name</Label>
                <Input required placeholder="e.g. Nairobi Radiant" value={groupData.name} onChange={e => setGroupData({...groupData, name: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider ml-1 text-muted-foreground">City / Country</Label>
                <Input required placeholder="e.g. Kigali, Rwanda" value={groupData.country} onChange={e => setGroupData({...groupData, country: e.target.value})} className={inputClass} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider ml-1 text-muted-foreground">Mission Focus (Description)</Label>
              <Input required placeholder="e.g. Campus outreach and weekly prayer..." value={groupData.description} onChange={e => setGroupData({...groupData, description: e.target.value})} className={inputClass} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" className="font-bold h-12 px-8 rounded-xl transition-all bg-gradient-to-r from-cyan-400 to-blue-600 text-white border-none shadow-sm hover:opacity-90">Launch Group ⚡</Button>
            </div>
          </form>
        </div>
      )}

      {!activeGroup ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myGroups.length === 0 && !creating ? (
            <div className="col-span-full rounded-[1.5rem] p-16 text-center cursor-pointer transition-all bg-card border-2 border-dashed border-blue-500/30 hover:bg-muted" onClick={() => setCreating(true)}>
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 bg-blue-500/10 border border-blue-500/20">
                <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-2 text-foreground">No Groups Yet</h3>
              <p className="mb-6 max-w-md mx-auto text-muted-foreground">GlowGroups are small accountability pods of 4-6 friends. Start one today to multiply the light!</p>
              <span className="inline-block font-bold pb-1 border-b border-blue-500/30 text-blue-600 dark:text-blue-400">Click to create your first group →</span>
            </div>
          ) : (
            myGroups.map(g => (
              <div key={g.id} onClick={() => setActiveGroup(g)} className="cursor-pointer rounded-[1.5rem] p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 bg-card border border-border shadow-sm hover:shadow-md">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl transition-opacity">✨</div>
                <div className="mb-4">
                  <h3 className="text-2xl font-bold font-['Space_Grotesk'] mb-1 text-blue-600 dark:text-blue-400">{g.name}</h3>
                  <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-muted border border-border text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    {g.country}
                  </div>
                </div>
                <p className="text-[15px] mb-6 leading-relaxed min-h-[60px] text-card-foreground">{g.description}</p>
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-background text-white">YOU</div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-muted border-2 border-dashed border-border text-muted-foreground">+</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                    Leader
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-[1.5rem] overflow-hidden bg-card border border-border shadow-sm">
          <div className="flex border-b border-border">
            {[{ key: 'feed', label: 'Group Feed' }, { key: 'chat', label: 'Chat' }, { key: 'events', label: 'Events' }, { key: 'study', label: 'Study Plan' }].map(tab => (
              <button key={tab.key} onClick={() => setGroupTab(tab.key)} className={`flex-1 py-4 font-bold transition border-b-2 ${groupTab === tab.key ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400" : "text-muted-foreground border-transparent hover:text-foreground"}`}>{tab.label}</button>
            ))}
          </div>
          <div className="p-6">
            {groupTab === 'feed' && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-4">🌱</div>
                <p>Your group's private feed is growing here. Share updates, prayers, and Glow Drops with your members.</p>
                <Button className="mt-6 bg-gradient-to-r from-cyan-400 to-blue-600 text-white border-none hover:opacity-90">Post to Group</Button>
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