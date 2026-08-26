import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Globe, Mail, Phone, MapPin, Shield, Users, Grid, Heart, Share2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DropCard from "@/components/feed/DropCard";

export default function InstitutionPageView() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");
  const slug = urlParams.get("slug");

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
    });
  }, []);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["institutionPage", pageId, slug],
    queryFn: async () => {
      if (pageId) return [await base44.entities.InstitutionPage.get(pageId)].filter(Boolean);
      if (slug) return base44.entities.InstitutionPage.filter({ slug });
      return [];
    },
    enabled: !!(pageId || slug),
  });

  const page = pages[0];

  const { data: institutionOwner = null } = useQuery({
    queryKey: ["institutionOwner", page?.owner_email],
    queryFn: async () => {
      const response = await base44.functions.invoke("listPublicUsers", { emails: [page.owner_email] });
      return response.data?.[0] || null;
    },
    enabled: !!page?.owner_email,
  });

  const { data: institutionFollowersLive = [] } = useQuery({
    queryKey: ["institutionFollowersLive", institutionOwner?.id],
    queryFn: () => base44.entities.Follow.filter({ following_id: institutionOwner.id }),
    enabled: !!institutionOwner?.id,
    refetchOnWindowFocus: true,
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["institutionDrops", page?.owner_email],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: page?.owner_email, status: "approved" }, "-created_date", 50),
    enabled: !!page?.owner_email,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsersInst"],
    queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; },
    staleTime: 1000 * 60 * 5,
  });

  const teamMembers = useMemo(() => {
    if (!page?.team_members) return [];
    try { return JSON.parse(page.team_members); } catch { return []; }
  }, [page?.team_members]);

  const getUserInfo = (email) => {
    if (user?.email === email) return user;
    return allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0], email };
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  if (!page) return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col items-center justify-center gap-4">
      <p className="text-gray-400">Institution page not found.</p>
      <Link to={createPageUrl("Feed")} className="text-[#00CFFF] hover:underline">Back to Feed</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to={createPageUrl("Feed")} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black truncate flex items-center gap-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {page.name}
              {page.verified && <Shield className="w-4 h-4 text-[#00CFFF] shrink-0" fill="#00CFFF" />}
            </h1>
            <span className="text-xs text-gray-500 capitalize">{page.category}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Banner */}
        <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-[#121826] to-[#0B0F1A] relative overflow-hidden">
          {page.banner_url && <img src={page.banner_url} alt="Banner" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-transparent to-transparent" />
        </div>

        {/* Logo & Info */}
        <div className="px-4 -mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end">
            <div className="w-28 h-28 rounded-2xl bg-[#121826] border-4 border-[#0B0F1A] overflow-hidden shadow-xl">
              {page.logo_url ? (
                <img src={page.logo_url} alt={page.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] flex items-center justify-center text-3xl font-black text-white">
                  {page.name?.[0]}
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                {page.name}
                {page.verified && <Shield className="w-5 h-5 text-[#00CFFF]" fill="#00CFFF" />}
              </h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {institutionFollowersLive.length} followers</span>
                <span className="flex items-center gap-1"><Grid className="w-3.5 h-3.5" /> {drops.length} posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mission */}
        {page.mission_statement && (
          <div className="px-4 mt-6">
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{page.mission_statement}</p>
          </div>
        )}

        {/* Contact row */}
        <div className="px-4 mt-4 flex flex-wrap gap-3">
          {page.website_url && (
            <a href={page.website_url.startsWith("http") ? page.website_url : `https://${page.website_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#00CFFF] font-bold bg-[#00CFFF]/10 px-3 py-1.5 rounded-full border border-[#00CFFF]/20 hover:bg-[#00CFFF]/20 transition">
              <ExternalLink className="w-3 h-3" /> Website
            </a>
          )}
          {page.contact_email && (
            <a href={`mailto:${page.contact_email}`} className="flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 transition">
              <Mail className="w-3 h-3" /> {page.contact_email}
            </a>
          )}
          {page.location && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <MapPin className="w-3 h-3" /> {page.location}
            </span>
          )}
        </div>

        {/* Team */}
        {teamMembers.length > 0 && (
          <div className="px-4 mt-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Team</h3>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {teamMembers.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-20">
                  <div className="w-14 h-14 rounded-full bg-[#121826] border border-white/10 overflow-hidden">
                    {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">{m.name?.[0]}</div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 text-center truncate w-full">{m.name}</span>
                  <span className="text-[9px] text-gray-600 text-center truncate w-full">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="px-4 mt-8 pb-20">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <Grid className="w-4 h-4" /> Official Posts
          </h3>
          {drops.length === 0 ? (
            <div className="text-center py-16 text-gray-600 bg-[#121826]/50 rounded-2xl border border-white/5">
              <p>No posts yet.</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {drops.map(drop => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  user={user}
                  dropUser={getUserInfo(drop.user_email)}
                  allUsers={allUsers}
                  userLikes={[]}
                  savedDropRecords={[]}
                  handleShare={() => {}}
                  likeMutation={{ mutate: () => {} }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}