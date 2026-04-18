import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart3, MessageSquare, TrendingUp, Users as UsersIcon, Crown, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function GroupAnalyticsPanel({ group, messages, members, allUsers }) {
  const { data: joinRequests = [], isLoading: reqLoading } = useQuery({
    queryKey: ["groupJoinRequestsAnalytics", group?.id],
    queryFn: () => base44.entities.GlowGroupJoinRequest.filter({ group_id: group.id }),
    enabled: !!group?.id,
  });

  const getUser = (email) => allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0] || "Member", email };

  // 14-day windows
  const days = useMemo(() => {
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      out.push({ date: d, label: format(d, "MMM d"), key: format(d, "yyyy-MM-dd") });
    }
    return out;
  }, []);

  // Message frequency per day (14 days)
  const messageFrequency = useMemo(() => {
    const counts = Object.fromEntries(days.map(d => [d.key, 0]));
    messages.forEach(m => {
      if (!m.created_date) return;
      const k = format(startOfDay(new Date(m.created_date)), "yyyy-MM-dd");
      if (counts[k] !== undefined) counts[k] += 1;
    });
    return days.map(d => ({ name: d.label, messages: counts[d.key] }));
  }, [messages, days]);

  // Growth (cumulative new members by joined_at — fallback to created_date)
  const growthData = useMemo(() => {
    const perDay = Object.fromEntries(days.map(d => [d.key, 0]));
    members.forEach(m => {
      const stamp = m.joined_at || m.created_date;
      if (!stamp) return;
      const k = format(startOfDay(new Date(stamp)), "yyyy-MM-dd");
      if (perDay[k] !== undefined) perDay[k] += 1;
    });
    // cumulative baseline = members joined before the window
    const firstKey = days[0].key;
    const baseline = members.filter(m => {
      const stamp = m.joined_at || m.created_date;
      if (!stamp) return false;
      return format(startOfDay(new Date(stamp)), "yyyy-MM-dd") < firstKey;
    }).length;
    let running = baseline;
    return days.map(d => { running += perDay[d.key]; return { name: d.label, members: running, new: perDay[d.key] }; });
  }, [members, days]);

  // Most active members (top 5 by message count)
  const mostActive = useMemo(() => {
    const counts = {};
    messages.forEach(m => { counts[m.user_email] = (counts[m.user_email] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([email, count]) => ({ user: getUser(email), email, count, isLeader: email === group?.leader_email }));
  }, [messages, allUsers, group]);

  // Summary stats
  const stats = useMemo(() => {
    const last7 = messages.filter(m => {
      if (!m.created_date) return false;
      return new Date(m.created_date) >= subDays(new Date(), 7);
    });
    const prev7 = messages.filter(m => {
      if (!m.created_date) return false;
      const d = new Date(m.created_date);
      return d >= subDays(new Date(), 14) && d < subDays(new Date(), 7);
    });
    const change = prev7.length === 0
      ? (last7.length > 0 ? 100 : 0)
      : Math.round(((last7.length - prev7.length) / prev7.length) * 100);
    const activeEmails = new Set(last7.map(m => m.user_email));
    const pending = joinRequests.filter(r => r.status === "pending").length;
    const approved = joinRequests.filter(r => r.status === "approved").length;
    return {
      messages7d: last7.length,
      messagesChange: change,
      activeMembers7d: activeEmails.size,
      totalMessages: messages.length,
      totalMembers: members.length,
      pendingRequests: pending,
      approvedRequests: approved,
    };
  }, [messages, members, joinRequests]);

  if (reqLoading) {
    return <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#0B3FD9" }} /></div>;
  }

  const StatCard = ({ icon, label, value, sub, color }) => (
    <div className="rounded-xl p-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${color}18`, color }}>{icon}</div>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7FA0" }}>{label}</div>
      </div>
      <div className="font-bold text-xl" style={{ color: "#0B1B3D", fontFamily: "Space Grotesk, sans-serif" }}>{value}</div>
      {sub !== undefined && <div className="text-[10px]" style={{ color: sub.startsWith("-") ? "#DC2626" : "#16A34A" }}>{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={<MessageSquare className="w-3.5 h-3.5" />} label="Msgs / 7d" value={stats.messages7d} sub={stats.messagesChange >= 0 ? `+${stats.messagesChange}% vs prev` : `${stats.messagesChange}% vs prev`} color="#0B3FD9" />
        <StatCard icon={<UsersIcon className="w-3.5 h-3.5" />} label="Active / 7d" value={stats.activeMembers7d} sub={`of ${stats.totalMembers} members`} color="#1FB8FF" />
        <StatCard icon={<BarChart3 className="w-3.5 h-3.5" />} label="Total Msgs" value={stats.totalMessages} color="#CC7A00" />
        <StatCard icon={<TrendingUp className="w-3.5 h-3.5" />} label="Join Requests" value={stats.pendingRequests} sub={`${stats.approvedRequests} approved`} color="#16A34A" />
      </div>

      {/* Message frequency chart */}
      <div className="rounded-xl p-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
        <div className="flex items-center gap-1.5 mb-2">
          <MessageSquare className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#0B1B3D" }}>Message Frequency (14d)</div>
        </div>
        <div style={{ width: "100%", height: 140 }}>
          <ResponsiveContainer>
            <BarChart data={messageFrequency} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid stroke="#F0F4FA" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#8A97B5" }} interval={1} />
              <YAxis tick={{ fontSize: 9, fill: "#8A97B5" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="messages" fill="#0B3FD9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Growth chart */}
      <div className="rounded-xl p-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#0B1B3D" }}>Member Growth (14d)</div>
        </div>
        <div style={{ width: "100%", height: 140 }}>
          <ResponsiveContainer>
            <LineChart data={growthData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid stroke="#F0F4FA" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#8A97B5" }} interval={1} />
              <YAxis tick={{ fontSize: 9, fill: "#8A97B5" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="members" stroke="#16A34A" strokeWidth={2} dot={{ r: 2, fill: "#16A34A" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most active members */}
      <div className="rounded-xl p-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
        <div className="flex items-center gap-1.5 mb-3">
          <UsersIcon className="w-3.5 h-3.5" style={{ color: "#CC7A00" }} />
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#0B1B3D" }}>Most Active Members</div>
        </div>
        {mostActive.length === 0 ? (
          <div className="text-center py-4 text-xs" style={{ color: "#8A97B5" }}>No activity yet.</div>
        ) : (
          <div className="space-y-2">
            {mostActive.map((m, i) => {
              const max = mostActive[0].count || 1;
              const pct = Math.round((m.count / max) * 100);
              return (
                <div key={m.email} className="flex items-center gap-2">
                  <div className="text-xs font-bold w-5 text-center" style={{ color: "#8A97B5" }}>#{i + 1}</div>
                  <img src={m.user.profile_picture_url || defaultAvatar} className="w-7 h-7 rounded-full object-cover shrink-0" style={{ border: "1px solid #E6ECF5" }} alt={m.user.full_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <div className="text-xs font-semibold truncate" style={{ color: "#0B1B3D" }}>{m.user.full_name}</div>
                      {m.isLeader && <Crown className="w-3 h-3 shrink-0" style={{ color: "#CC7A00" }} />}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F0F4FA" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)" }} />
                    </div>
                  </div>
                  <div className="text-xs font-bold w-8 text-right" style={{ color: "#0B3FD9" }}>{m.count}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}