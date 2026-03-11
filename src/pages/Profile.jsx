import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings, Grid, Award, Heart, MessageCircle, Camera, Target, CheckCircle, Clock, XCircle, Zap, Home, Users, Bell, Globe } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import SubmitDropModal from "@/components/feed/SubmitDropModal";
import DropViewerModal from "@/components/feed/DropViewerModal";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: "", country: "", profile_picture_url: "", cover_picture_url: "" });
  const [activeProfileTab, setActiveProfileTab] = useState("drops");
  const [viewingDrop, setViewingDrop] = useState(null);
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const me = await base44.auth.me();
          setUser(me);
          setEditData({ 
            full_name: me.full_name || "", 
            country: me.country || "", 
            profile_picture_url: me.profile_picture_url || "", 
            cover_picture_url: me.cover_picture_url || "" 
          });
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

  const { data: mySupports = [] } = useQuery({
    queryKey: ["mySupports", user?.email],
    queryFn: () => base44.entities.PrayerSupport.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: myFollowing = [] } = useQuery({
    queryKey: ["myFollowing", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.email],
    queryFn: () => base44.entities.GlowGroupMember.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["myCerts", user?.email],
    queryFn: () => base44.entities.Certificate.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: challengeSubmissions = [] } = useQuery({
    queryKey: ["myChallengeSubmissions", user?.email],
    queryFn: () => base44.entities.ChallengeSubmission.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ["allChallenges"],
    queryFn: () => base44.entities.Challenge.list(),
    enabled: !!user
  });

  useEffect(() => {
    async function checkCertificates() {
      if (!user) return;
      const myCerts = await base44.entities.Certificate.filter({ user_email: user.email });
      const newCerts = [];
      
      if (!myCerts.find(c => c.title === '30 Days Consistent Posting')) {
        const drops = await base44.entities.GlowDrop.filter({ user_email: user.email });
        const uniqueDays = new Set(drops.map(d => d.created_date?.split('T')[0])).size;
        if (uniqueDays >= 30) {
          newCerts.push({ user_email: user.email, title: '30 Days Consistent Posting', description: 'Posted Glow Drops on 30 distinct days.', icon: '🏅' });
        }
      }
      
      if (!myCerts.find(c => c.title === 'Community Leader')) {
        const groups = await base44.entities.GlowGroup.filter({ leader_email: user.email });
        if (groups.length > 0) {
          newCerts.push({ user_email: user.email, title: 'Community Leader', description: 'Led a GlowGroup for the first time.', icon: '👑' });
        }
      }

      if (newCerts.length > 0) {
        await base44.entities.Certificate.bulkCreate(newCerts);
        queryClient.invalidateQueries({ queryKey: ["myCerts"] });
        toast.success(`You earned ${newCerts.length} new Glow Certificate(s)!`);
      }
    }
    checkCertificates();
  }, [user, queryClient]);

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await base44.auth.updateMe({ 
        full_name: editData.full_name, 
        country: editData.country,
        profile_picture_url: editData.profile_picture_url,
        cover_picture_url: editData.cover_picture_url
      });
      const updated = await base44.auth.me();
      setUser(updated);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const [cropData, setCropData] = useState(null);

  const handleImageSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropData({ file, type, aspectRatio: type === 'profile' ? 1 : 3 });
    e.target.value = null; // reset input
  };

  const handleCropComplete = async (croppedFile) => {
    const type = cropData.type;
    setCropData(null);
    setUploadingImage(true);
    const toastId = toast.loading(`Uploading ${type} photo...`);
    try {
      const res = await base44.integrations.Core.UploadFile({ file: croppedFile });
      
      const updates = {};
      if (type === "profile") {
        updates.profile_picture_url = res.file_url;
      } else {
        updates.cover_picture_url = res.file_url;
      }
      
      await base44.auth.updateMe(updates);
      const updated = await base44.auth.me();
      setUser(updated);
      setEditData(prev => ({ ...prev, ...updates }));
      
      toast.success(`${type === 'profile' ? 'Profile' : 'Cover'} photo updated!`, { id: toastId });
    } catch (err) {
      toast.error(`Failed to upload ${type} photo`, { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user || dropsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white pb-20 relative overflow-hidden">
      {/* Top Nav Bar */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_692b64307296ee339e64b660/c20e0f05a_GENERATIONLIGHTMODE-LOGO.png"
              alt="LightMode"
              style={{ height: 32, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("GlowGroups")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Users className="w-4 h-4" /><span className="hidden sm:inline">Groups</span>
            </Link>
            <Link to={createPageUrl("Notifications")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Bell className="w-4 h-4" /><span className="hidden sm:inline">Alerts</span>
            </Link>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-sm font-medium border border-white/5">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </div>
        </div>
      </div>

      {cropData && (
        <ImageCropperModal
          file={cropData.file}
          aspectRatio={cropData.aspectRatio}
          onCancel={() => setCropData(null)}
          onCrop={handleCropComplete}
        />
      )}
      <SubmitDropModal isOpen={isDropModalOpen} onClose={() => setIsDropModalOpen(false)} user={user} />
      {viewingDrop && (
        <DropViewerModal
          drop={viewingDrop}
          drops={myDrops}
          user={user}
          onClose={() => setViewingDrop(null)}
          onNavigate={(d) => setViewingDrop(d)}
        />
      )}
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between mb-8 py-4">
          <div className="font-bold text-lg text-gray-400">{user.email}</div>
          <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-white transition">
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Cover Photo */}
        <style>{`
          @keyframes sweep-light {
            0% { transform: translateX(-150%) skewX(-20deg); }
            100% { transform: translateX(300%) skewX(-20deg); }
          }
          @keyframes spin-border {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}</style>
        <div 
          className="w-full h-48 sm:h-64 rounded-2xl mb-8 relative group cursor-pointer p-[2px] overflow-hidden shadow-[0_0_30px_rgba(0,207,255,0.15)]"
          onClick={() => coverInputRef.current?.click()}
        >
          {/* Rotating Edge Light */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", width: "200%", height: "200%",
            background: "conic-gradient(from 0deg, transparent 60%, #00CFFF 80%, #8A5CFF 100%)",
            animation: "spin-border 4s linear infinite",
            zIndex: 0
          }} />

          {/* Inner Content Wrapper */}
          <div 
            className="w-full h-full rounded-[14px] bg-[#121826] overflow-hidden relative z-10"
            style={user.cover_picture_url ? { backgroundImage: `url(${user.cover_picture_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            {/* Sweeping Light Effect */}
            <div style={{
              position: "absolute", top: 0, bottom: 0, left: 0, width: "30%",
              background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.1), rgba(255,255,255,0.3), rgba(0,207,255,0.1), transparent)",
              animation: "sweep-light 4s infinite ease-in-out",
              zIndex: 1, pointerEvents: "none",
              boxShadow: "0 0 20px rgba(0,207,255,0.4)"
            }} />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
              <div className="flex items-center gap-2 text-white font-bold bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                <Camera className="w-5 h-5" /> Change Cover
              </div>
            </div>
            {!user.cover_picture_url && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 bg-gradient-to-br from-[#0B0F1A] to-[#121826]">
                No Cover Photo
              </div>
            )}
          </div>
        </div>
        <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "cover")} disabled={uploadingImage} />

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 border-b border-white/5 pb-12 -mt-20 sm:-mt-24 relative z-10 px-4">
          <div 
            className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#00CFFF] to-[#8A5CFF] p-1 flex-shrink-0 shadow-[0_0_30px_rgba(0,207,255,0.3)] overflow-hidden group cursor-pointer relative"
            onClick={() => profileInputRef.current?.click()}
          >
            <div className="w-full h-full rounded-full bg-[#121826] border-4 border-[#0B0F1A] flex items-center justify-center text-5xl font-bold font-['Space_Grotesk'] uppercase overflow-hidden relative">
              <img src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="Profile" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
              </div>
            </div>
          </div>
          <input type="file" ref={profileInputRef} accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "profile")} disabled={uploadingImage} />
          
          <div className="flex-1 text-center md:text-left mt-4 md:mt-16">
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
              <div className="text-center md:text-left"><span className="font-bold text-2xl text-[#FFD000]">{user.glow_score || 0}</span> <span className="text-gray-400 text-sm block md:inline">XP</span></div>
              <div className="text-center md:text-left"><span className="font-bold text-2xl text-[#00CFFF]">Lvl {Math.floor((user.glow_score || 0) / 50) + 1}</span> <span className="text-gray-400 text-sm block md:inline">rank</span></div>
            </div>

            <div className="w-full max-w-md mx-auto md:mx-0 mb-6 bg-white/5 h-2 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]" style={{ width: `${(((user.glow_score || 0) % 50) / 50) * 100}%` }}></div>
            </div>
            <div className="text-xs text-gray-400 text-center md:text-left max-w-md mx-auto md:mx-0 mb-6 -mt-4">
              {50 - ((user.glow_score || 0) % 50)} XP to Next Level
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
              <div>
                <Label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block ml-1">Profile Picture</Label>
                <Input type="file" accept="image/*" onChange={e => handleImageSelect(e, "profile")} disabled={uploadingImage} className="bg-[#0B0F1A] border-dashed border-2 border-white/10 text-gray-400 text-sm h-auto px-3 py-3 rounded-xl file:bg-[#121826] file:text-[#00CFFF] file:border file:border-[#00CFFF]/30 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:font-bold hover:file:bg-[#00CFFF]/10 file:cursor-pointer cursor-pointer hover:border-[#00CFFF]/30" />
                {editData.profile_picture_url && <img src={editData.profile_picture_url} alt="Profile preview" className="w-16 h-16 rounded-full mt-2 object-cover border border-white/10" />}
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block ml-1">Cover Photo</Label>
                <Input type="file" accept="image/*" onChange={e => handleImageSelect(e, "cover")} disabled={uploadingImage} className="bg-[#0B0F1A] border-dashed border-2 border-white/10 text-gray-400 text-sm h-auto px-3 py-3 rounded-xl file:bg-[#121826] file:text-[#00CFFF] file:border file:border-[#00CFFF]/30 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:font-bold hover:file:bg-[#00CFFF]/10 file:cursor-pointer cursor-pointer hover:border-[#00CFFF]/30" />
                {editData.cover_picture_url && <img src={editData.cover_picture_url} alt="Cover preview" className="w-full h-24 rounded-xl mt-2 object-cover border border-white/10" />}
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
          <div onClick={() => setActiveProfileTab("drops")} className={`flex-1 py-4 flex items-center justify-center gap-2 border-t-[3px] -mt-[2px] font-bold tracking-widest text-xs cursor-pointer transition ${activeProfileTab === "drops" ? "border-[#00CFFF] text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            <Grid className="w-4 h-4" /> DROPS
          </div>
          <div onClick={() => setActiveProfileTab("missions")} className={`flex-1 py-4 flex items-center justify-center gap-2 border-t-[3px] -mt-[2px] font-bold tracking-widest text-xs cursor-pointer transition ${activeProfileTab === "missions" ? "border-[#00CFFF] text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            <Target className="w-4 h-4" /> MY MISSIONS
          </div>
          <div onClick={() => setActiveProfileTab("badges")} className={`flex-1 py-4 flex items-center justify-center gap-2 border-t-[3px] -mt-[2px] font-bold tracking-widest text-xs cursor-pointer transition ${activeProfileTab === "badges" ? "border-[#00CFFF] text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            <Award className="w-4 h-4" /> ACHIEVEMENTS
          </div>
        </div>

        {activeProfileTab === "drops" && (
        <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4">
          {myDrops.map(drop => (
            <div key={drop.id} onClick={() => setViewingDrop(drop)} className="aspect-square bg-gradient-to-br from-[#121826] to-[#0B0F1A] border border-white/5 relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 text-center rounded-sm sm:rounded-xl">
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
              <button onClick={() => setIsDropModalOpen(true)} className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">
                Share your first Drop
              </button>
            </div>
          )}
        </div>
        )}

        {activeProfileTab === "missions" && (
          <div className="py-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#121826] rounded-2xl p-4 border border-white/5 text-center">
                <div className="text-2xl font-black text-[#00CFFF] font-['Space_Grotesk']">{myDrops.length}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Drops Shared</div>
              </div>
              <div className="bg-[#121826] rounded-2xl p-4 border border-white/5 text-center">
                <div className="text-2xl font-black text-[#FFD000] font-['Space_Grotesk']">{challengeSubmissions.length}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Challenges Done</div>
              </div>
              <div className="bg-[#121826] rounded-2xl p-4 border border-white/5 text-center">
                <div className="text-2xl font-black text-[#8A5CFF] font-['Space_Grotesk']">{myMemberships.length}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Groups Joined</div>
              </div>
              <div className="bg-[#121826] rounded-2xl p-4 border border-white/5 text-center">
                <div className="text-2xl font-black text-white font-['Space_Grotesk']">{user.glow_score || 0}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider flex items-center justify-center gap-1"><Zap className="w-3 h-3 text-[#FFD000]" />Total XP</div>
              </div>
            </div>

            {/* Glow Drops Contributions */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[#00CFFF] mb-3 flex items-center gap-2"><Grid className="w-4 h-4" /> Glow Drop Contributions</h3>
              {myDrops.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-[#121826]/50 rounded-2xl border border-white/5">No drops submitted yet.</div>
              ) : (
                <div className="space-y-2">
                  {myDrops.map(drop => (
                    <div key={drop.id} className="bg-[#121826] rounded-xl px-5 py-4 border border-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${drop.status === 'approved' ? 'bg-green-400' : drop.status === 'rejected' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                        <p className="text-sm text-gray-200 truncate">{drop.verse || "(No verse)"}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="flex items-center gap-1 text-xs text-[#FFD000] font-bold"><Heart className="w-3 h-3" />{drop.likes_count || 0}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${drop.status === 'approved' ? 'bg-green-500/20 text-green-400' : drop.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {drop.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Challenge Submissions */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[#FFD000] mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Challenge Submissions</h3>
              {challengeSubmissions.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-[#121826]/50 rounded-2xl border border-white/5">No challenges submitted yet. Head to Challenges to earn XP!</div>
              ) : (
                <div className="space-y-2">
                  {challengeSubmissions.map(sub => {
                    const challenge = allChallenges.find(c => c.id === sub.challenge_id);
                    return (
                      <div key={sub.id} className="bg-[#121826] rounded-xl px-5 py-4 border border-white/5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{challenge?.title || "Challenge"}</p>
                            <p className="text-xs text-gray-500 truncate">{sub.submission_url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[#FFD000] font-black text-sm flex-shrink-0">
                          <Zap className="w-3.5 h-3.5" />+{sub.points_awarded || challenge?.points_reward || 0} XP
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeProfileTab === "badges" && (
           <div className="py-8">
             {certificates.length > 0 && (
               <div className="mb-10">
                 <h3 className="text-xl font-bold font-['Space_Grotesk'] text-[#FFD000] mb-4 flex items-center gap-2"><Award className="w-6 h-6" /> Glow Certificates</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {certificates.map(cert => (
                     <div key={cert.id} className="bg-gradient-to-r from-[#121826] to-[#0B0F1A] p-6 rounded-2xl border border-[#FFD000]/30 shadow-[0_0_20px_rgba(255,208,0,0.15)] flex items-center gap-6">
                       <div className="text-5xl drop-shadow-lg bg-black/30 w-20 h-20 rounded-full flex items-center justify-center border-2 border-[#FFD000]/50">{cert.icon}</div>
                       <div>
                         <div className="text-xs text-[#FFD000] font-bold uppercase tracking-widest mb-1">Official Milestone</div>
                         <h4 className="text-xl font-bold text-white font-['Space_Grotesk']">{cert.title}</h4>
                         <p className="text-gray-400 text-sm mt-1">{cert.description}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
             
             <h3 className="text-xl font-bold font-['Space_Grotesk'] text-[#00CFFF] mb-4 flex items-center gap-2"><Award className="w-6 h-6" /> Badges</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {(() => {
                const badges = [];
                if (user.glow_score >= 100) badges.push({ id: 'gs100', name: 'Spark', desc: 'Reached 100 XP', icon: '⚡' });
                if (user.glow_score >= 500) badges.push({ id: 'gs500', name: 'Flame', desc: 'Reached 500 XP', icon: '🔥' });
                if (myDrops.length >= 1) badges.push({ id: 'creator', name: 'Creator', desc: 'Posted a Drop (+5 XP)', icon: '📝' });
                if (myFollowing.length >= 5) badges.push({ id: 'social', name: 'Social Butterfly', desc: 'Followed 5+ people (+5 XP ea)', icon: '🦋' });
                if (myMemberships.length >= 1) badges.push({ id: 'community', name: 'Community Member', desc: 'Joined a Group (+20 XP)', icon: '🤝' });
                if (myDrops.some(d => {
                  if (!d.created_date) return false;
                  const h = new Date(d.created_date).getHours();
                  return h >= 4 && h <= 7;
                })) badges.push({ id: 'early', name: 'Early Riser', desc: 'Posted a drop between 4 AM and 7 AM', icon: '🌅' });
                if (mySupports.length >= 50) badges.push({ id: 'warrior', name: 'Prayer Warrior', desc: 'Supported 50+ prayer requests', icon: '🛡️' });
                if (user.role === 'GlowGroup Leader') badges.push({ id: 'pillar', name: 'Community Pillar', desc: 'Active community leader', icon: '🏛️' });
                
                return badges.length > 0 ? badges.map(b => (
                  <div key={b.id} className="bg-[#121826]/80 p-6 rounded-2xl border border-[#00CFFF]/20 text-center flex flex-col items-center shadow-[0_0_15px_rgba(0,207,255,0.1)]">
                    <div className="text-5xl mb-4 drop-shadow-md">{b.icon}</div>
                    <div className="font-bold text-[#00CFFF] text-lg">{b.name}</div>
                    <div className="text-sm text-gray-400 mt-2 leading-relaxed">{b.desc}</div>
                  </div>
                )) : <div className="col-span-full text-center text-gray-500 py-10 bg-[#121826]/50 rounded-2xl border border-white/5">Keep glowing to earn badges! Complete challenges and support prayers.</div>;
             })()}
             </div>
           </div>
        )}
      </div>
    </div>
  );
}