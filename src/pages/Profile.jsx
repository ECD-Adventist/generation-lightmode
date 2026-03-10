import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings, Grid, Bookmark, Award, Heart, MessageCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: "", country: "" });

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const me = await base44.auth.me();
          setUser(me);
          setEditData({ full_name: me.full_name || "", country: me.country || "" });
        } else {
          base44.auth.redirectToLogin(window.location.pathname);
        }
      } catch (err) {}
    }
    checkAuth();
  }, []);

  const { data: myDrops = [], isLoading: dropsLoading } = useQuery({
    queryKey: ["myGlowDropsProfile", user?.email],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await base44.auth.updateMe({ full_name: editData.full_name, country: editData.country });
      const updated = await base44.auth.me();
      setUser(updated);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  if (!user || dropsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white pt-8 pb-20 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between mb-8 py-4">
          <Link to={createPageUrl("Feed")} className="text-gray-400 hover:text-white transition font-medium">← Feed</Link>
          <div className="font-bold text-lg">{user.email}</div>
          <div className="flex gap-4">
            <Link to={createPageUrl("Dashboard")} className="text-gray-400 hover:text-white transition">
               Dashboard
            </Link>
            <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-white transition">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 border-b border-white/5 pb-12">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#00CFFF] to-[#8A5CFF] p-1 flex-shrink-0 shadow-[0_0_30px_rgba(0,207,255,0.3)]">
            <div className="w-full h-full rounded-full bg-[#121826] border-4 border-[#0B0F1A] flex items-center justify-center text-5xl font-bold font-['Space_Grotesk'] uppercase">
              {user.full_name?.charAt(0) || "U"}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 justify-center md:justify-start">
              <h1 className="text-3xl font-bold font-['Inter']">{user.full_name}</h1>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition border border-white/5">
                  Edit Profile
                </button>
              )}
            </div>
            
            <div className="flex gap-8 justify-center md:justify-start mb-6">
              <div className="text-center md:text-left"><span className="font-bold text-2xl">{myDrops.length}</span> <span className="text-gray-400 text-sm block md:inline">posts</span></div>
              <div className="text-center md:text-left"><span className="font-bold text-2xl text-[#FFD000]">{user.glow_score || 0}</span> <span className="text-gray-400 text-sm block md:inline">score</span></div>
              <div className="text-center md:text-left"><span className="font-bold text-2xl text-[#00CFFF]">{user.streak_count || 0}</span> <span className="text-gray-400 text-sm block md:inline">streak</span></div>
            </div>
            
            <div className="text-sm text-gray-300 max-w-md mx-auto md:mx-0 bg-white/5 p-4 rounded-xl border border-white/5">
              <p className="font-bold text-white mb-1 uppercase tracking-wider text-xs">{user.country || "Global Citizen"}</p>
              <p className="leading-relaxed">Digital Missionary ⚡ Spreading light through faith in the online world. Join me on the LightMode movement!</p>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="bg-[#121826]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 mb-12 animate-in fade-in slide-in-from-top-4 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 font-['Space_Grotesk'] text-[#00CFFF]">Edit Your Details</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <Label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block ml-1">Full Name</Label>
                <Input required value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} className="bg-[#0B0F1A] border-white/10 h-12 text-lg rounded-xl" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block ml-1">Country</Label>
                <Input value={editData.country} onChange={e => setEditData({...editData, country: e.target.value})} className="bg-[#0B0F1A] border-white/10 h-12 text-lg rounded-xl" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="h-12 px-6">Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-[#0B0F1A] font-bold h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(0,207,255,0.3)]">Save Profile</Button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-t border-white/10 mb-2">
          <div className="flex-1 py-4 flex items-center justify-center gap-2 border-t-[3px] border-[#00CFFF] -mt-[2px] text-white font-bold tracking-widest text-xs cursor-pointer">
            <Grid className="w-4 h-4" /> DROPS
          </div>
          <div className="flex-1 py-4 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 font-bold tracking-widest text-xs cursor-pointer transition">
            <Bookmark className="w-4 h-4" /> SAVED
          </div>
          <div className="flex-1 py-4 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 font-bold tracking-widest text-xs cursor-pointer transition">
            <Award className="w-4 h-4" /> BADGES
          </div>
        </div>

        {/* Grid (Instagram profile style) */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4">
          {myDrops.map(drop => (
            <div key={drop.id} className="aspect-square bg-gradient-to-br from-[#121826] to-[#0B0F1A] border border-white/5 relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 text-center rounded-sm sm:rounded-xl">
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <span className="text-[#00CFFF] font-bold font-['Space_Grotesk'] text-xs sm:text-base md:text-xl lg:text-2xl px-1 break-words line-clamp-4 leading-tight drop-shadow-md">
                  {drop.verse}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                <div className="flex items-center gap-2 font-bold text-lg md:text-2xl text-white">
                  <Heart className="w-5 h-5 md:w-8 md:h-8 fill-white" /> {drop.likes_count || 0}
                </div>
                <div className="flex items-center gap-2 font-bold text-lg md:text-2xl text-white">
                  <MessageCircle className="w-5 h-5 md:w-8 md:h-8 fill-white" /> 0
                </div>
              </div>
            </div>
          ))}
          {myDrops.length === 0 && (
            <div className="col-span-3 py-32 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              <div className="w-20 h-20 rounded-full border-2 border-gray-600 flex items-center justify-center mb-6">
                <Grid className="w-10 h-10 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-2">No Drops Yet</h2>
              <p className="text-gray-400 mb-6 text-center max-w-md">When you share verses and reflections, they will appear on your profile grid.</p>
              <Link to={createPageUrl("Dashboard")} className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">
                Share your first Drop
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}