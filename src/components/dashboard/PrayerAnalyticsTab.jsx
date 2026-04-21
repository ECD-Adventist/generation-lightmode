import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, parseISO } from "date-fns";

export default function PrayerAnalyticsTab() {
  const { data: requests = [] } = useQuery({ queryKey: ["prayerRequests"], queryFn: () => base44.entities.PrayerRequest.list() });
  const { data: supports = [] } = useQuery({ queryKey: ["prayerSupports"], queryFn: () => base44.entities.PrayerSupport.list() });

  const categoryData = useMemo(() => {
    const counts = requests.reduce((acc, r) => { acc[r.category || 'Other'] = (acc[r.category || 'Other'] || 0) + 1; return acc; }, {});
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [requests]);

  const COLORS = ['#1FB8FF', '#CC7A00', '#0B3FD9', '#FF5A5A', '#22C55E'];

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
    return Object.values(data).slice(-30);
  }, [supports]);

  const cardStyle = { background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Inter']">
      <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-6" style={{ color: "#0B3FD9" }}>Prayer Requests Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-[1.5rem]" style={cardStyle}>
          <h3 className="text-lg font-bold mb-4" style={{ color: "#0B1B3D" }}>Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" stroke="#8A97B5" fontSize={12} />
                <YAxis stroke="#8A97B5" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E0EAF5', borderRadius: 12, boxShadow: '0 4px 16px rgba(11, 63, 217, 0.12)' }} />
                <Bar dataKey="posted" name="Posted" fill="#1FB8FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="answered" name="Answered" fill="#FFD60A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-[1.5rem]" style={cardStyle}>
          <h3 className="text-lg font-bold mb-4" style={{ color: "#0B1B3D" }}>Category Frequency</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E0EAF5', borderRadius: 12, boxShadow: '0 4px 16px rgba(11, 63, 217, 0.12)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {categoryData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1 text-xs" style={{ color: "#4A5878" }}>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                {c.name} ({c.value})
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-[1.5rem] md:col-span-2" style={cardStyle}>
          <h3 className="text-lg font-bold mb-4" style={{ color: "#0B1B3D" }}>Community Support Activity (Prayers)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={supportActivity}>
                <XAxis dataKey="name" stroke="#8A97B5" fontSize={12} />
                <YAxis stroke="#8A97B5" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E0EAF5', borderRadius: 12, boxShadow: '0 4px 16px rgba(11, 63, 217, 0.12)' }} />
                <Line type="monotone" dataKey="supports" name="Supports" stroke="#0B3FD9" strokeWidth={3} dot={{ r: 4, fill: '#0B3FD9' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}