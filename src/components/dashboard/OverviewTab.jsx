import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, Award, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function OverviewTab({ user }) {
  const { data: glowDrops = [] } = useQuery({
    queryKey: ["myGlowDrops", user.email],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: user.email })
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-[#121826] border-gray-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Total Drops</CardTitle>
          <Flame className="w-4 h-4 text-[#00CFFF]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{glowDrops.length}</div>
          <p className="text-xs text-gray-500 mt-1">Submitted reflections</p>
        </CardContent>
      </Card>

      <Card className="bg-[#121826] border-gray-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Current Streak</CardTitle>
          <Trophy className="w-4 h-4 text-[#FFD000]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{user.streak_count || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Days active</p>
        </CardContent>
      </Card>

      <Card className="bg-[#121826] border-gray-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Badges</CardTitle>
          <Award className="w-4 h-4 text-[#8A5CFF]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-gray-500 mt-1">Earned so far</p>
        </CardContent>
      </Card>

      <Card className="bg-[#121826] border-gray-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Country</CardTitle>
          <MapPin className="w-4 h-4 text-[#1DA1FF]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{user.country || "Not set"}</div>
          <p className="text-xs text-gray-500 mt-1">Representing</p>
        </CardContent>
      </Card>

      <div className="lg:col-span-4 mt-6">
        <h3 className="text-xl font-bold mb-4 font-['Space_Grotesk'] text-[#00CFFF]">Recent Drops</h3>
        <div className="space-y-4">
          {glowDrops.length === 0 ? (
            <p className="text-gray-500 italic">No drops submitted yet. Switch on your faith!</p>
          ) : (
            glowDrops.slice(0, 5).map(drop => (
              <div key={drop.id} className="p-4 bg-[#1A2033] border border-gray-800 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-[#8A5CFF]">{drop.verse}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${drop.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {drop.status}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{drop.reflection}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}