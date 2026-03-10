import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, parseISO } from "date-fns";

export default function PrayerAnalyticsTab() {
  const { data: requests = [] } = useQuery({
    queryKey: ["prayerRequests"],
    queryFn: () => base44.entities.PrayerRequest.list()
  });

  const { data: supports = [] } = useQuery({
    queryKey: ["prayerSupports"],
    queryFn: () => base44.entities.PrayerSupport.list()
  });

  const categoryData = useMemo(() => {
    const counts = requests.reduce((acc, r) => {
      acc[r.category || 'Other'] = (acc[r.category || 'Other'] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [requests]);

  const COLORS = ['#00CFFF', '#FFD000', '#8A5CFF', '#F50057', '#00E676'];

  const monthlyData = useMemo(() => {
    const data = {};
    requests.forEach(r => {
      if(!r.created_date) return;
      const month = format(parseISO(r.created_date), 'MMM yyyy');
      if(!data[month]) data[month] = { name: month, posted: 0, answered: 0 };
      data[month].posted += 1;
      if (r.answered) data[month].answered += 1;
    });
    return Object.values(data);
  }, [requests]);

  const supportActivity = useMemo(() => {
    const data = {};
    supports.forEach(s => {
      if(!s.created_date) return;
      const date = format(parseISO(s.created_date), 'MMM dd');
      if(!data[date]) data[date] = { name: date, supports: 0 };
      data[date].supports += 1;
    });
    return Object.values(data).slice(-30); // last 30 active days
  }, [supports]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-[#00CFFF] mb-6">Prayer Requests Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121826]/80 p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold mb-4">Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#333' }} />
                <Bar dataKey="posted" name="Posted" fill="#00CFFF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="answered" name="Answered" fill="#FFD000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#121826]/80 p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold mb-4">Category Frequency</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#333' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {categoryData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                {c.name} ({c.value})
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121826]/80 p-6 rounded-2xl border border-white/10 md:col-span-2">
          <h3 className="text-lg font-bold mb-4">Community Support Activity (Prayers)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={supportActivity}>
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#333' }} />
                <Line type="monotone" dataKey="supports" name="Supports" stroke="#8A5CFF" strokeWidth={3} dot={{ r: 4, fill: '#8A5CFF' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}