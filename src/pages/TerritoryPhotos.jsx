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
import AppTopNav from "@/components/AppTopNav";
import AppFooter from "@/components/AppFooter";

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-12 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <AppTopNav />
      {/* Sub-header */}
      <div className="border-b" style={{ background: "#FFFFFF", borderColor: "#E6ECF5" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Feed")} className="transition" style={{ color: "#6B7FA0" }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" style={{ color: "#1FB8FF" }} />
              <h1 className="text-lg font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Territory Moments</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canModerate && pendingPhotos.length > 0 && (
              <button
                onClick={() => setModQueue(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
                style={{ background: "rgba(255, 208, 0, 0.12)", border: "1px solid #FFE4A0", color: "#CC7A00" }}
              >
                <Shield className="w-3.5 h-3.5" />
                Review ({pendingPhotos.length})
              </button>
            )}
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black hover:opacity-90 transition"
              style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}
            >
              <Upload className="w-3.5 h-3.5" /> Share Photo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Subtitle */}
        <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: "#6B7FA0" }}>
          <MapPin className="w-4 h-4" style={{ color: "#1FB8FF" }} />
          <span>Community events, service moments, and faith in action across territories</span>
        </div>

        {/* Territory filter */}
        {territories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-6">
            {territories.map(t => {
              const active = filterTerritory === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilterTerritory(t)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                  style={active
                    ? { background: "rgba(31, 184, 255, 0.12)", color: "#0B3FD9", border: "1px solid #B8E5FF" }
                    : { background: "#FFFFFF", color: "#6B7FA0", border: "1px solid #E6ECF5" }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}

        {/* Feed */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-24 rounded-[1.5rem]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.04)" }}>
            <Camera className="w-14 h-14 mx-auto mb-4 opacity-40" style={{ color: "#8A97B5" }} />
            <p className="font-bold text-lg" style={{ color: "#0B1B3D" }}>No moments yet.</p>
            <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Be the first to share a community photo from your territory!</p>
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-5 px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition"
              style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}
            >
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
      <AppFooter />

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