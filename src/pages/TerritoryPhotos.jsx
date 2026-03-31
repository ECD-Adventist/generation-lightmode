import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X, Camera, Shield, MapPin, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TerritoryPhotoCard from "@/components/territory/TerritoryPhotoCard";
import TerritoryPhotoUploadModal from "@/components/territory/TerritoryPhotoUploadModal";
import TerritoryModerationQueue from "@/components/territory/TerritoryModerationQueue";

const LEADER_ROLES = ["admin", "super_admin", "moderator", "church_admin", "conference_field_admin", "union_admin", "country_admin", "ecd_admin", "GlowGroup Leader"];

export default function TerritoryPhotos() {
  const [user, setUser] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [modQueue, setModQueue] = useState(false);
  const [filterTerritory, setFilterTerritory] = useState("All");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (isAuth) => {
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
      } else {
        base44.auth.redirectToLogin(window.location.pathname);
      }
    });
  }, []);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["territoryPhotos"],
    queryFn: () => base44.entities.TerritoryPhoto.filter({ status: "approved" }, "-created_date"),
  });

  const { data: pendingPhotos = [] } = useQuery({
    queryKey: ["territoryPhotosPending"],
    queryFn: () => base44.entities.TerritoryPhoto.filter({ status: "pending" }, "-created_date"),
    enabled: !!user && LEADER_ROLES.includes(user?.role),
  });

  const { data: reactions = [] } = useQuery({
    queryKey: ["territoryPhotoReactions"],
    queryFn: () => base44.entities.TerritoryPhotoReaction.list("-created_date", 500),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsersTerritory"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const canModerate = user && LEADER_ROLES.includes(user.role);

  const territories = useMemo(() => {
    const set = new Set(photos.map(p => p.territory).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    if (filterTerritory === "All") return photos;
    return photos.filter(p => p.territory === filterTerritory);
  }, [photos, filterTerritory]);

  const getUserInfo = (email) => {
    if (user?.email === email) return user;
    return allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0], email };
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]">
      <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Feed")} className="text-gray-400 hover:text-white transition">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#00CFFF]" />
              <h1 className="text-lg font-black font-['Space_Grotesk'] text-white">Territory Moments</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canModerate && pendingPhotos.length > 0 && (
              <button
                onClick={() => setModQueue(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFD000]/10 border border-[#FFD000]/30 text-[#FFD000] text-xs font-bold hover:bg-[#FFD000]/20 transition"
              >
                <Shield className="w-3.5 h-3.5" />
                Review ({pendingPhotos.length})
              </button>
            )}
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black text-xs font-black hover:opacity-90 transition"
            >
              <Upload className="w-3.5 h-3.5" /> Share Photo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Subtitle */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <MapPin className="w-4 h-4 text-[#00CFFF]" />
          <span>Community events, service moments, and faith in action across territories</span>
        </div>

        {/* Territory filter */}
        {territories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-6">
            {territories.map(t => (
              <button
                key={t}
                onClick={() => setFilterTerritory(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filterTerritory === t
                    ? "bg-[#00CFFF]/20 text-[#00CFFF] border border-[#00CFFF]/30"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Feed */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <Camera className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg">No moments yet.</p>
            <p className="text-sm mt-1">Be the first to share a community photo from your territory!</p>
            <button onClick={() => setUploadOpen(true)} className="mt-5 px-6 py-2.5 rounded-xl bg-[#00CFFF] text-black font-bold text-sm hover:bg-[#00CFFF]/80 transition">
              Share First Photo
            </button>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filteredPhotos.map(photo => (
              <TerritoryPhotoCard
                key={photo.id}
                photo={photo}
                user={user}
                photoUser={getUserInfo(photo.user_email)}
                reactions={reactions.filter(r => r.photo_id === photo.id)}
                canModerate={canModerate}
                onRefresh={() => {
                  queryClient.invalidateQueries({ queryKey: ["territoryPhotos"] });
                  queryClient.invalidateQueries({ queryKey: ["territoryPhotoReactions"] });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {uploadOpen && (
        <TerritoryPhotoUploadModal
          user={user}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => {
            setUploadOpen(false);
            queryClient.invalidateQueries({ queryKey: ["territoryPhotosPending"] });
            toast.success("Photo submitted for review! A leader will approve it shortly.");
          }}
        />
      )}

      {modQueue && (
        <TerritoryModerationQueue
          user={user}
          pendingPhotos={pendingPhotos}
          allUsers={allUsers}
          onClose={() => setModQueue(false)}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ["territoryPhotos"] });
            queryClient.invalidateQueries({ queryKey: ["territoryPhotosPending"] });
          }}
        />
      )}
    </div>
  );
}