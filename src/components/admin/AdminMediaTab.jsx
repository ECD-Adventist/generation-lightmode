import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Image, Film, FileText, Loader2, ExternalLink, Download } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

export default function AdminMediaTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const [filter, setFilter] = useState("all");

  const { data: drops = [], isLoading: dropsLoading } = useQuery({
    queryKey: ["media_drops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["media_users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data || [];
    }
  });

  const { data: stories = [] } = useQuery({
    queryKey: ["media_stories"],
    queryFn: () => base44.entities.Story.list("-created_date", 200),
  });

  const userMap = useMemo(() => {
    const m = {};
    users.forEach(u => { m[u.email] = u; });
    return m;
  }, [users]);

  const mediaDrops = useMemo(() => drops.filter(d => d.media_url), [drops]);
  const mediaStories = useMemo(() => stories.filter(s => s.media_url), [stories]);
  const profilePics = useMemo(() => users.filter(u => u.profile_picture_url), [users]);
  const coverPics = useMemo(() => users.filter(u => u.cover_picture_url), [users]);

  const allMedia = useMemo(() => {
    const items = [];
    mediaDrops.forEach(d => items.push({ id: d.id, url: d.media_url, type: "drop", label: d.verse || "Glow Drop", owner: d.user_email, date: d.created_date }));
    mediaStories.forEach(s => items.push({ id: s.id, url: s.media_url, type: "story", label: s.text_content || "Story", owner: s.user_email, date: s.created_date }));
    profilePics.forEach(u => items.push({ id: u.id + "_pic", url: u.profile_picture_url, type: "profile", label: u.full_name || "Profile", owner: u.email, date: u.created_date }));
    coverPics.forEach(u => items.push({ id: u.id + "_cover", url: u.cover_picture_url, type: "cover", label: "Cover Photo", owner: u.email, date: u.created_date }));
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [mediaDrops, mediaStories, profilePics, coverPics]);

  const filtered = useMemo(() => filter === "all" ? allMedia : allMedia.filter(i => i.type === filter), [allMedia, filter]);

  const stats = {
    total: allMedia.length,
    drops: mediaDrops.length,
    stories: mediaStories.length,
    profiles: profilePics.length + coverPics.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Media Library</h1>
        <p className="text-sm mt-1" style={{ color: t.textSecondary }}>All user-uploaded images across Glow Drops, Stories, and Profiles.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Media", value: stats.total, icon: <Image className="w-4 h-4" />, color: isDark ? "#00CFFF" : "#0B3FD9" },
          { label: "Drop Images", value: stats.drops, icon: <Film className="w-4 h-4" />, color: isDark ? "#FFD000" : "#d97706" },
          { label: "Story Images", value: stats.stories, icon: <Image className="w-4 h-4" />, color: isDark ? "#8A5CFF" : "#7e22ce" },
          { label: "Profile Photos", value: stats.profiles, icon: <FileText className="w-4 h-4" />, color: isDark ? "#22c55e" : "#16a34a" },
        ].map(s => (
          <div key={s.label} className="border rounded-2xl p-5 flex items-center gap-4" style={{ background: t.surface, borderColor: t.border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{s.value}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: t.textMuted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "drop", "story", "profile", "cover"].map(type => (
          <button key={type} onClick={() => setFilter(type)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border`}
            style={filter === type ? { background: t.accentSoft, borderColor: t.borderStrong, color: t.accent } : { background: t.surface, borderColor: t.border, color: t.textSecondary }}>
            {type === "all" ? `All (${allMedia.length})` : `${type.charAt(0).toUpperCase() + type.slice(1)}s`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {dropsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: t.accent }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border rounded-2xl" style={{ background: t.surface, borderColor: t.border, color: t.textMuted }}>
          <Image className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>No media files found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(item => {
            const owner = userMap[item.owner];
            return (
              <div key={item.id} className="group relative aspect-square border rounded-xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
                <img src={item.url} alt={item.label} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      item.type === "drop" ? "bg-[#FFD000]/20 text-[#FFD000]" :
                      item.type === "story" ? "bg-[#8A5CFF]/20 text-[#8A5CFF]" :
                      "bg-[#00CFFF]/20 text-[#00CFFF]"
                    }`}>{item.type}</span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
                      <ExternalLink className="w-3 h-3 text-white" />
                    </a>
                  </div>
                  <div>
                    <p className="text-[10px] text-white font-semibold truncate">{item.label}</p>
                    <p className="text-[9px] text-gray-400 truncate">{owner?.full_name || item.owner?.split("@")[0]}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}