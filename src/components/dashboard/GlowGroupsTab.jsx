import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function GlowGroupsTab({ user }) {
  const [creating, setCreating] = useState(false);
  const [groupData, setGroupData] = useState({ name: "", country: "", description: "" });

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-[#00CFFF] w-6 h-6" />
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">My GlowGroups</h2>
        </div>
        <Button onClick={() => setCreating(!creating)} className="bg-transparent border border-[#00CFFF] text-[#00CFFF] hover:bg-[#00CFFF]/10">
          <Plus className="w-4 h-4 mr-2" /> New Group
        </Button>
      </div>

      {creating && (
        <Card className="bg-[#121826] border-[#00CFFF]/30 mb-8 text-white">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Group Name</Label>
                <Input required value={groupData.name} onChange={e => setGroupData({...groupData, name: e.target.value})} className="bg-[#1A2033] border-gray-700 mt-1" />
              </div>
              <div>
                <Label>Country/Region</Label>
                <Input required value={groupData.country} onChange={e => setGroupData({...groupData, country: e.target.value})} className="bg-[#1A2033] border-gray-700 mt-1" />
              </div>
              <div>
                <Label>Description</Label>
                <Input required value={groupData.description} onChange={e => setGroupData({...groupData, description: e.target.value})} className="bg-[#1A2033] border-gray-700 mt-1" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80">Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {myGroups.length === 0 && !creating ? (
          <p className="text-gray-400 italic col-span-2">You haven't created any GlowGroups yet. Start one to disciple others!</p>
        ) : (
          myGroups.map(g => (
            <Card key={g.id} className="bg-[#1A2033] border-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-lg text-[#00CFFF]">{g.name}</CardTitle>
                <p className="text-xs text-gray-400">{g.country}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">{g.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-4 h-4" /> You are the leader
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}