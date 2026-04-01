import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Heart, Grid, Eye, TrendingUp } from "lucide-react";

function StatCard({ icon: Icon, label, value, color = "#00CFFF" }) {
  return (
    <div className="bg-[#121826] rounded-2xl p-6 border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
      </div>
      <div className="text-3xl font-black font-['Space_Grotesk']" style={{ color }}>{value}</div>
    </div>
  );
}

export default function InstitutionAnalytics({ page }) {
  const { data: drops = [] } = useQuery({
    queryKey: ["instDrops", page.owner_email],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: page.owner_email }, "-created_date", 200),
    enabled: !!page.owner_email,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["instFollowers", page.owner_email],
    queryFn: () => base44.entities.Follow.filter({ following_email: page.owner_email }),
    enabled: !!page.owner_email,
  });

  const totalLikes = drops.reduce((sum, d) => sum + (d.likes_count || 0), 0);
  const approvedDrops = drops.filter(d => d.status === "approved");
  const pendingDrops = drops.filter(d => d.status === "pending");

  // Team members count
  let teamCount = 0;
  try {
    teamCount = JSON.parse(page.team_members || "[]").length;
  } catch { teamCount = 0; }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Followers" value={followers.length} color="#00CFFF" />
        <StatCard icon={Grid} label="Total Posts" value={drops.length} color="#8A5CFF" />
        <StatCard icon={Heart} label="Total Likes" value={totalLikes} color="#FFD000" />
        <StatCard icon={Users} label="Team Members" value={teamCount} color="#00CFFF" />
      </div>

      {/* Posts Breakdown */}
      <div className="bg-[#121826] rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00CFFF]" /> Posts Breakdown
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-green-500/5 border border-green-500/10">
            <div className="text-2xl font-black text-green-400">{approvedDrops.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Approved</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
            <div className="text-2xl font-black text-yellow-400">{pendingDrops.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Pending</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-2xl font-black text-white">{page.followers_count || 0}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Page Follows</div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-[#121826] rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <Grid className="w-4 h-4 text-[#8A5CFF]" /> Recent Posts
        </h3>
        {drops.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No posts yet. Create content to grow your institution's presence.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {drops.slice(0, 20).map(drop => (
              <div key={drop.id} className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{drop.verse || drop.reflection || "(No content)"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{drop.created_date ? new Date(drop.created_date).toLocaleDateString() : ""}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-[#FFD000] font-bold"><Heart className="w-3 h-3" />{drop.likes_count || 0}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    drop.status === "approved" ? "bg-green-500/20 text-green-400" : 
                    drop.status === "rejected" ? "bg-red-500/20 text-red-400" : 
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>{drop.status || "pending"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}