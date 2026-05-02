import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings, Grid, Award, Heart, MessageCircle, Camera, Target, CheckCircle, Zap, Home, Users, Bell, Globe, Bookmark, Building2, Sparkles, BarChart3 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import SubmitDropModal from "@/components/feed/SubmitDropModal";
import ProfileConnectionsModal from "@/components/profile/ProfileConnectionsModal";
import ProfileInstitutionsTab from "@/components/institution/ProfileInstitutionsTab";
import ExecutiveProfileHeader from "@/components/institution/ExecutiveProfileHeader";
import { isNotificationEnabled } from "@/lib/notifications";
import EditProfileModal from "@/components/profile/EditProfileModal";
import LeaderAccountSwitcher from "@/components/profile/LeaderAccountSwitcher";
import LeaderProfileHeader from "@/components/profile/LeaderProfileHeader";
import LeaderAccountFormModal from "@/components/admin/leader-accounts/LeaderAccountFormModal";
import PledgeModal from "@/components/pledge/PledgeModal";
import ProfileHighlights, { getGlowRank } from "@/components/profile/ProfileHighlights";
import AchievementBadges from "@/components/profile/AchievementBadges";
import PostViewerModal from "@/components/profile/PostViewerModal";
import StoryAnalyticsDashboard from "@/components/profile/StoryAnalyticsDashboard";
import AppFooter from "@/components/AppFooter";
import { getDisplayName } from "@/lib/displayName";
import MobileProfile from "@/components/profile/MobileProfile";
import CountryFlag from "@/components/common/CountryFlag";
import DropGridTile from "@/components/profile/DropGridTile";

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null); // logged-in user
  const [user, setUser] = useState(null); // profile being viewed
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: "", country: "", bio: "", website_url: "", profile_picture_url: "", cover_picture_url: "", gender: "", date_of_birth: "", phone: "", city: "", address: "", postal_code: "" });
  const [activeProfileTab, setActiveProfileTab] = useState("drops");
  const [connectionsView, setConnectionsView] = useState(null);
  const [pledgeModalOpen, setPledgeModalOpen] = useState(false);
  const [viewPledgeOpen, setViewPledgeOpen] = useState(false);
  const [viewingDropId, setViewingDropId] = useState(null);
  const [activeLeaderEmail, setActiveLeaderEmail] = useState(null);
  const [isEditingLeader, setIsEditingLeader] = useState(false);

  // When switching to/from a leader account, reset the active tab to "drops" so personal-only
  // tabs (Saved, Missions, etc.) don't render empty in leader view.
  useEffect(() => {
    setActiveProfileTab("drops");
  }, [activeLeaderEmail]);
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const viewUserEmail = urlParams.get("user");

  const { data: allUsersForProfile = [] } = useQuery({
    queryKey: ["allUsersForProfile", viewUserEmail || "self"],
    queryFn: async () => {
      // When viewing another user's profile, request them explicitly so they aren't
      // missed due to the default 100-user limit.
      const params = viewUserEmail ? { emails: [viewUserEmail] } : {};
      const res = await base44.functions.invoke("listPublicUsers", params);
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
    },
    enabled: !!currentUser
  });

  const { data: publicLeaderAccounts = [] } = useQuery({
    queryKey: ["publicLeaderAccountsForProfile"],
    queryFn: () => base44.entities.ManagedLeaderAccount.filter({ active: true }),
    enabled: !!viewUserEmail && !!currentUser,
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const me = await base44.auth.me();
          setCurrentUser(me);
          if (viewUserEmail && viewUserEmail !== me.email) {
            // set later from allUsersForProfile
          } else {
            setUser(me);
            setEditData({
              full_name: me.full_name || "",
              country: me.country || "",
              bio: me.bio || "",
              website_url: me.website_url || "",
              profile_picture_url: me.profile_picture_url || "",
              cover_picture_url: me.cover_picture_url || "",
              gender: me.gender || "",
              date_of_birth: me.date_of_birth || "",
              phone: me.phone || "",
              city: me.city || "",
              address: me.address || "",
              postal_code: me.postal_code || ""
            });
          }
        } else if (!viewUserEmail) {
          base44.auth.redirectToLogin(window.location.pathname + window.location.search);
        }
      } catch (err) {
        console.error("Profile auth check failed:", err);
        if (!viewUserEmail) {
          base44.auth.redirectToLogin(window.location.pathname + window.location.search);
        }
      }
    }
    checkAuth();
  }, [viewUserEmail]);

  const allUsersLoaded = useRef(false);

  useEffect(() => {
    if (!viewUserEmail) return;
    if (allUsersForProfile.length > 0) allUsersLoaded.current = true;

    if (currentUser && viewUserEmail === currentUser.email) {
      setUser(currentUser);
      setEditData({
        full_name: currentUser.full_name || "",
        country: currentUser.country || "",
        bio: currentUser.bio || "",
        website_url: currentUser.website_url || "",
        profile_picture_url: currentUser.profile_picture_url || "",
        cover_picture_url: currentUser.cover_picture_url || "",
        gender: currentUser.gender || "",
        date_of_birth: currentUser.date_of_birth || "",
        phone: currentUser.phone || "",
        city: currentUser.city || "",
        address: currentUser.address || "",
        postal_code: currentUser.postal_code || ""
      });
      return;
    }

    const found = allUsersForProfile.find(u => u.email === viewUserEmail);
    if (found) {
      setUser(found);
      return;
    }

    const leader = publicLeaderAccounts.find(a => a.leader_email === viewUserEmail);
    if (leader) {
      setUser({
        email: leader.leader_email,
        full_name: leader.leader_name,
        profile_picture_url: leader.leader_profile_picture_url,
        cover_picture_url: leader.leader_cover_picture_url,
        bio: leader.leader_bio,
        country: leader.leader_country,
        glow_score: 0,
        is_managed_leader: true,
      });
      return;
    }

    // If the public users list has loaded but the target wasn't found,
    // create a minimal fallback profile so the page doesn't spin forever.
    if (allUsersLoaded.current) {
      setUser({
        email: viewUserEmail,
        full_name: viewUserEmail.split('@')[0] || "User",
        glow_score: 0,
      });
    }
  }, [viewUserEmail, currentUser, allUsersForProfile, publicLeaderAccounts]);

  const isOwnProfile = currentUser && (!viewUserEmail || viewUserEmail === currentUser.email);
  const baseProfileEmail = viewUserEmail || currentUser?.email;

  // Leader accounts this logged-in user is authorized to manage (or all, if admin/super_admin).
  const { data: managedLeaderAccounts = [] } = useQuery({
    queryKey: ["managedLeaderAccountsForUser", currentUser?.email, currentUser?.role],
    queryFn: async () => {
      const all = await base44.entities.ManagedLeaderAccount.filter({ active: true });
      if (currentUser?.role === "admin" || currentUser?.role === "super_admin") return all;
      return all.filter(a => Array.isArray(a.manager_emails) && a.manager_emails.includes(currentUser.email));
    },
    enabled: !!currentUser && isOwnProfile,
  });

  // When an active leader is selected, the displayed profile becomes that leader.
  const activeLeaderAccount = activeLeaderEmail
    ? managedLeaderAccounts.find(a => a.leader_email === activeLeaderEmail)
    : null;
  const profileEmail = activeLeaderEmail || baseProfileEmail;
  const isViewingLeader = !!activeLeaderAccount;

  const { data: myDrops = [] } = useQuery({
    queryKey: ["myGlowDropsProfile", profileEmail],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: profileEmail }, '-created_date'),
    enabled: !!profileEmail
  });

  const { data: mySupports = [] } = useQuery({
    queryKey: ["mySupports", profileEmail],
    queryFn: () => base44.entities.PrayerSupport.filter({ user_email: profileEmail }),
    enabled: !!profileEmail
  });

  const { data: myFollowing = [] } = useQuery({
    queryKey: ["myFollowing", profileEmail],
    queryFn: () => base44.entities.Follow.filter({ follower_email: profileEmail }),
    enabled: !!profileEmail
  });

  const { data: myFollowers = [] } = useQuery({
    queryKey: ["myFollowers", profileEmail],
    queryFn: () => base44.entities.Follow.filter({ following_email: profileEmail }),
    enabled: !!profileEmail
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myMemberships", profileEmail],
    queryFn: () => base44.entities.GlowGroupMember.filter({ user_email: profileEmail }),
    enabled: !!profileEmail
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["myCerts", profileEmail],
    queryFn: () => base44.entities.Certificate.filter({ user_email: profileEmail }),
    enabled: !!profileEmail
  });

  const { data: savedRecords = [] } = useQuery({
    queryKey: ["mySavedDropsProfile", profileEmail],
    queryFn: () => base44.entities.SavedDrop.filter({ user_email: profileEmail }),
    enabled: Boolean(profileEmail && isOwnProfile)
  });

  const { data: allDrops = [] } = useQuery({
    queryKey: ["profileAllGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list('-created_date', 500),
  });

  const savedDrops = useMemo(() => {
    const ids = new Set(savedRecords.map(r => r.drop_id));
    return allDrops.filter(d => ids.has(d.id));
  }, [savedRecords, allDrops]);

  const { data: challengeSubmissions = [] } = useQuery({
    queryKey: ["myChallengeSubmissions", profileEmail],
    queryFn: () => base44.entities.ChallengeSubmission.filter({ user_email: profileEmail }, '-created_date'),
    enabled: !!profileEmail
  });

  const { data: userInstitutionApps = [] } = useQuery({
    queryKey: ["profileInstitutionApps", profileEmail],
    queryFn: () => base44.entities.InstitutionApplication.filter({ user_email: profileEmail, status: "approved" }),
    enabled: !!profileEmail,
  });

  const { data: profileUserLikes = [] } = useQuery({
    queryKey: ["profileUserLikes", currentUser?.email],
    queryFn: () => base44.entities.GlowDropLike.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser,
  });

  const { data: profileSavedDrops = [] } = useQuery({
    queryKey: ["profileSavedDrops", currentUser?.email],
    queryFn: () => base44.entities.SavedDrop.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser,
  });

  const profileLikeMutation = useMutation({
    mutationFn: async ({ id, authorEmail, authorName }) => {
      if (!currentUser) { toast.error("Please log in to like"); return; }
      const response = await base44.functions.invoke('handleLikeDrop', {
        drop_id: id, author_email: authorEmail, author_name: authorName, action: 'toggle'
      });
      toast.success(response.data.action === 'unlike' ? "❤️ Unliked!" : "❤️ Liked!");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile", profileEmail] });
      queryClient.invalidateQueries({ queryKey: ["profileUserLikes", currentUser?.email] });
    }
  });

  const handleDropShare = async (drop) => {
    const postUrl = `${window.location.origin}/Post?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`;
    const shareText = `✨ Generation LightMode\n\n"${drop.verse || ''}"\n\n${drop.reflection || ''}\n\nJoin the movement!\n${postUrl}`;
    if (navigator.share) {
      try { await navigator.share({ text: shareText }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Link copied to clipboard!");
    }
  };

  const { data: currentUserFollowing = [] } = useQuery({
    queryKey: ["currentUserFollowing", currentUser?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: currentUser?.email }),
    enabled: !!currentUser
  });

  const isFollowingThisUser = currentUserFollowing.some(f => f.following_email === profileEmail);

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const existingFollow = currentUserFollowing.find(f => f.following_email === targetEmail);
      if (existingFollow) {
        await base44.entities.Follow.delete(existingFollow.id);
        return { targetEmail, action: "unfollow" };
      }
      await base44.entities.Follow.create({ follower_email: currentUser.email, following_email: targetEmail });
      const targetUser = allUsersForProfile.find(u => u.email === targetEmail);
      if (isNotificationEnabled(targetUser, "follows")) {
        await base44.entities.Notification.create({
          user_email: targetEmail,
          type: "follow",
          message: `${currentUser.full_name || "Someone"} started following you.`,
          link: createPageUrl("Profile") + `?user=${encodeURIComponent(currentUser.email)}`
        });
      }
      return { targetEmail, action: "follow" };
    },
    onSuccess: ({ targetEmail, action }) => {
      queryClient.invalidateQueries({ queryKey: ["currentUserFollowing", currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ["myFollowing", currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ["myFollowers", targetEmail] });
      toast.success(action === "unfollow" ? "Unfollowed" : "Following! ⚡");
    }
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ["allChallenges"],
    queryFn: () => base44.entities.Challenge.list(),
    enabled: !!user
  });

  const hasCheckedCerts = useRef(false);

  useEffect(() => {
    async function checkCertificates() {
      if (!user || !isOwnProfile || hasCheckedCerts.current) return;
      hasCheckedCerts.current = true;
      try {
        const myCerts = await base44.entities.Certificate.filter({ user_email: user.email });
        const newCerts = [];
        const email = user.email;

        if (!myCerts.find(c => c.title === '30 Days Consistent Posting')) {
          const drops = await base44.entities.GlowDrop.filter({ user_email: email });
          const uniqueDays = new Set(drops.map(d => d.created_date?.split('T')[0])).size;
          if (uniqueDays >= 30) newCerts.push({ user_email: email, title: '30 Days Consistent Posting', description: 'Posted Glow Drops on 30 distinct days.', icon: '🏅' });
        }
        if (!myCerts.find(c => c.title === 'Community Leader')) {
          const groups = await base44.entities.GlowGroup.filter({ leader_email: email });
          if (groups.length > 0) newCerts.push({ user_email: email, title: 'Community Leader', description: 'Led a GlowGroup for the first time.', icon: '👑' });
        }
        if (!myCerts.find(c => c.title === '7-Day Glow Streak') && (user.faith_streak_count || 0) >= 7) {
          newCerts.push({ user_email: email, title: '7-Day Glow Streak', description: 'Maintained a 7-day consecutive posting streak.', icon: '🔥' });
        }
        if (!myCerts.find(c => c.title === 'Community Influencer')) {
          const drops = await base44.entities.GlowDrop.filter({ user_email: email });
          const totalLikes = drops.reduce((sum, d) => sum + (d.likes_count || 0), 0);
          if (totalLikes >= 50) newCerts.push({ user_email: email, title: 'Community Influencer', description: 'Your posts received 50+ total likes — you inspire others!', icon: '⭐' });
        }
        if (!myCerts.find(c => c.title === 'Prayer Warrior')) {
          const supports = await base44.entities.PrayerSupport.filter({ user_email: email });
          if (supports.length >= 50) newCerts.push({ user_email: email, title: 'Prayer Warrior', description: 'Stood in prayer for 50+ requests. Mighty intercessor!', icon: '🛡️' });
        }
        if (!myCerts.find(c => c.title === 'Monthly Evangelist')) {
          const drops = await base44.entities.GlowDrop.filter({ user_email: email });
          const monthCounts = {};
          drops.forEach(d => { if (d.created_date) { const k = d.created_date.substring(0, 7); monthCounts[k] = (monthCounts[k] || 0) + 1; } });
          if (Math.max(0, ...Object.values(monthCounts)) >= 20) {
            newCerts.push({ user_email: email, title: 'Monthly Evangelist', description: 'Posted 20+ Glow Drops in a single month!', icon: '📅' });
          }
        }
        if (newCerts.length > 0) {
          await base44.entities.Certificate.bulkCreate(newCerts);
          queryClient.invalidateQueries({ queryKey: ["myCerts"] });
          toast.success(`You earned ${newCerts.length} new Glow Certificate(s)!`);
        }
      } catch (err) {
        hasCheckedCerts.current = false;
      }
    }
    checkCertificates();
  }, [user?.email, isOwnProfile, queryClient]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropData, setCropData] = useState(null);

  const profileCompletion = useMemo(() => {
    const fields = [user?.full_name, user?.bio, user?.country, user?.website_url, user?.profile_picture_url, user?.cover_picture_url];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [user]);

  const nextLevelXp = 50 - ((user?.glow_score || 0) % 50);
  const glowRank = getGlowRank(user?.glow_score || 0);

  const recentActivity = useMemo(() => ([
    { icon: "✨", label: "Glow Drops", value: `${myDrops.length} shared so far` },
    { icon: "🎯", label: "Challenges", value: `${challengeSubmissions.length} completed missions` },
    { icon: "👥", label: "Groups", value: `${myMemberships.length} group memberships` },
    { icon: "🏆", label: "Achievements", value: `${certificates.length} certificates unlocked` },
  ]), [myDrops.length, challengeSubmissions.length, myMemberships.length, certificates.length]);

  const handleShareProfile = async () => {
    const shareUrl = window.location.href;
    const displayName = getDisplayName(user);
    const shareText = `${displayName} • ${glowRank.name} • ${user.glow_score || 0} Glow Points`;
    if (navigator.share) {
      await navigator.share({ title: `${displayName} | LightMode`, text: shareText, url: shareUrl });
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Profile link copied");
  };

  const handleImageSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropData({ file, type, aspectRatio: type === 'profile' ? 1 : 3 });
    e.target.value = null;
  };

  const handleCropComplete = async (croppedFile) => {
    const type = cropData.type;
    setCropData(null);
    setUploadingImage(true);
    const toastId = toast.loading(`Uploading ${type} photo...`);
    try {
      const res = await base44.integrations.Core.UploadFile({ file: croppedFile });

      // When viewing as leader, update the leader account's photo, not the manager's user record.
      if (isViewingLeader && activeLeaderAccount) {
        const leaderUpdates = type === "profile"
          ? { leader_profile_picture_url: res.file_url }
          : { leader_cover_picture_url: res.file_url };
        await base44.entities.ManagedLeaderAccount.update(activeLeaderAccount.id, leaderUpdates);
        await queryClient.invalidateQueries({ queryKey: ["managedLeaderAccountsForUser", currentUser?.email, currentUser?.role] });
        toast.success(`Leader ${type} photo updated!`, { id: toastId });
      } else {
        const updates = {};
        if (type === "profile") updates.profile_picture_url = res.file_url;
        else updates.cover_picture_url = res.file_url;
        await base44.auth.updateMe(updates);
        const updated = await base44.auth.me();
        setUser(updated);
        setCurrentUser(updated);
        setEditData(prev => ({ ...prev, ...updates }));
        toast.success(`${type === 'profile' ? 'Profile' : 'Cover'} photo updated!`, { id: toastId });
      }
    } catch (err) {
      toast.error(`Failed to upload ${type} photo`, { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
          <p className="text-sm" style={{ color: "#6B7FA0" }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  // When viewing a leader account, override the displayed user identity (name, photo, bio, etc.)
  const displayUser = isViewingLeader ? {
    ...user,
    email: activeLeaderAccount.leader_email,
    full_name: activeLeaderAccount.leader_name,
    profile_picture_url: activeLeaderAccount.leader_profile_picture_url,
    cover_picture_url: activeLeaderAccount.leader_cover_picture_url,
    bio: activeLeaderAccount.leader_bio,
    country: activeLeaderAccount.leader_country,
    website_url: undefined,
    glow_score: 0,
    pledge_signed: false,
  } : user;
  // While viewing a leader, owner-only edit affordances should be disabled.
  const canEditProfile = isOwnProfile && !isViewingLeader;
  // But managers DO have full authority to edit the leader's identity & photos.
  const canEditLeader = isViewingLeader && isOwnProfile;
  const canEditAny = canEditProfile || canEditLeader;

  // The displayed profile is a leader account if either:
  //   - the manager has explicitly switched into leader view, or
  //   - we're viewing someone else's profile and that profile resolves to a managed leader.
  const isLeaderProfile = isViewingLeader || !!displayUser?.is_managed_leader;
  const leaderTitle = isViewingLeader
    ? activeLeaderAccount?.leader_title
    : (publicLeaderAccounts.find(a => a.leader_email === displayUser?.email)?.leader_title);

  // MOBILE-ONLY branded shell — reuses same tab content by rendering a trimmed version (v2)
  const mobileTabContent = (() => {
    if (activeProfileTab === "drops") {
      if (myDrops.length === 0) {
        return (
          <div className="py-16 text-center rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
            <Grid className="w-8 h-8 mx-auto mb-2" style={{ color: "#1FB8FF" }} />
            <p className="text-sm font-bold" style={{ color: "#0B1B3D" }}>{isLeaderProfile ? "No Leader Posts Yet" : "No Drops Yet"}</p>
            {isOwnProfile && !isLeaderProfile && (
              <button onClick={() => setIsDropModalOpen(true)} className="mt-3 px-5 py-2 rounded-full text-xs font-black" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
                Share your first Drop
              </button>
            )}
          </div>
        );
      }
      return (
        <div className="grid grid-cols-3 gap-2">
          {myDrops.map(drop => (
            <DropGridTile
              key={drop.id}
              drop={drop}
              onClick={() => setViewingDropId(drop.id)}
              authorName={getDisplayName(displayUser)}
              authorTitle={leaderTitle}
              isLeader={isLeaderProfile}
            />
          ))}
        </div>
      );
    }
    if (activeProfileTab === "saved" && isOwnProfile) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {savedDrops.length === 0 ? (
            <div className="col-span-2 py-16 text-center rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
              <Bookmark className="w-8 h-8 mx-auto mb-2" style={{ color: "#8A97B5" }} />
              <p className="text-sm font-bold" style={{ color: "#0B1B3D" }}>No saved drops yet</p>
            </div>
          ) : savedDrops.map(drop => (
            <button key={drop.id} onClick={() => setViewingDropId(drop.id)} className="aspect-[4/5] relative rounded-2xl overflow-hidden active:scale-95 transition"
              style={{ background: drop.media_url ? "#FFFFFF" : "linear-gradient(135deg, #EEF3FF, #DDE7FB)", border: "1px solid #E6ECF5" }}
            >
              {drop.media_url ? <img src={drop.media_url} className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center p-3 text-center">
                  <span className="text-xs font-black font-['Space_Grotesk'] line-clamp-5" style={{ color: "#0B3FD9" }}>{drop.verse}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      );
    }
    if (activeProfileTab === "missions") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: myDrops.length, label: "Drops", color: "#0B3FD9" },
              { value: challengeSubmissions.length, label: "Missions", color: "#CC7A00" },
              { value: myMemberships.length, label: "Groups", color: "#1FB8FF" },
              { value: user.glow_score || 0, label: "Total XP", color: "#0B1B3D" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] font-black uppercase tracking-wider mt-0.5" style={{ color: "#6B7FA0" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (activeProfileTab === "badges") {
      return <AchievementBadges user={user} myDrops={myDrops} myFollowing={myFollowing} myFollowers={myFollowers} myMemberships={myMemberships} mySupports={mySupports} challengeSubmissions={challengeSubmissions} certificates={certificates} />;
    }
    if (activeProfileTab === "institutions") {
      return <ProfileInstitutionsTab profileEmail={profileEmail} isOwnProfile={isOwnProfile} />;
    }
    return null;
  })();

  return (
    <>
    {/* MOBILE branded layout */}
    <div className="md:hidden">
      {isOwnProfile && managedLeaderAccounts.length > 0 && (
        <div className="px-4 pt-4">
          <LeaderAccountSwitcher
            currentUser={currentUser}
            managedAccounts={managedLeaderAccounts}
            activeLeaderEmail={activeLeaderEmail}
            onSwitch={setActiveLeaderEmail}
          />
        </div>
      )}
      <MobileProfile
        user={displayUser}
        currentUser={currentUser}
        isOwnProfile={canEditAny}
        profileEmail={profileEmail}
        myDrops={myDrops}
        myFollowers={myFollowers}
        myFollowing={isLeaderProfile ? [] : myFollowing}
        myMemberships={isLeaderProfile ? [] : myMemberships}
        certificates={isLeaderProfile ? [] : certificates}
        isLeader={isLeaderProfile}
        leaderTitle={leaderTitle}
        onEditProfile={() => setIsEditing(true)}
        onEditLeader={() => setIsEditingLeader(true)}
        onShareProfile={handleShareProfile}
        onFollowToggle={() => followMutation.mutate(profileEmail)}
        isFollowingThisUser={isFollowingThisUser}
        onProfileImageSelect={(e) => handleImageSelect(e, "profile")}
        onCoverImageSelect={(e) => handleImageSelect(e, "cover")}
        uploadingImage={uploadingImage}
        onSetConnectionsView={setConnectionsView}
        activeTab={activeProfileTab === "story_analytics" ? "drops" : activeProfileTab}
        onTabChange={setActiveProfileTab}
        userInstitutionApps={isLeaderProfile ? [] : userInstitutionApps}
      >
        {mobileTabContent}
      </MobileProfile>

      {/* Modals shared across mobile */}
      {cropData && (
        <ImageCropperModal file={cropData.file} aspectRatio={cropData.aspectRatio} onCancel={() => setCropData(null)} onCrop={handleCropComplete} />
      )}
      <SubmitDropModal isOpen={isDropModalOpen} onClose={() => setIsDropModalOpen(false)} user={user} />
      <PledgeModal isOpen={pledgeModalOpen} onClose={() => setPledgeModalOpen(false)} onSigned={async () => {
        setPledgeModalOpen(false);
        const updated = await base44.auth.me();
        setUser(updated); setCurrentUser(updated);
      }} />
      <PledgeModal isOpen={viewPledgeOpen} onClose={() => setViewPledgeOpen(false)} readOnly signedAt={user?.pledge_signed_at} />
      <ProfileConnectionsModal
        title={connectionsView}
        items={connectionsView === "Followers" ? myFollowers.map((item) => ({ email: item.follower_email })) : myFollowing.map((item) => ({ email: item.following_email }))}
        allUsers={allUsersForProfile}
        currentUserEmail={currentUser?.email}
        currentUserFollowing={currentUserFollowing}
        onClose={() => setConnectionsView(null)}
        onToggleFollow={(email) => followMutation.mutate(email)}
      />
      {isEditing && isOwnProfile && (
        <EditProfileModal isOpen={isEditing} onClose={() => setIsEditing(false)} user={user}
          onSaved={(updated) => { setUser(prev => ({ ...prev, ...updated })); setCurrentUser(prev => ({ ...prev, ...updated })); }}
        />
      )}
      {isEditingLeader && activeLeaderAccount && (
        <LeaderAccountFormModal
          account={activeLeaderAccount}
          onClose={() => setIsEditingLeader(false)}
          onSaved={() => {
            setIsEditingLeader(false);
            queryClient.invalidateQueries({ queryKey: ["managedLeaderAccountsForUser", currentUser?.email, currentUser?.role] });
          }}
        />
      )}
      <PostViewerModal
        isOpen={!!viewingDropId}
        onClose={() => setViewingDropId(null)}
        drops={activeProfileTab === "saved" ? savedDrops : myDrops}
        initialDropId={viewingDropId}
        user={displayUser}
        currentUser={currentUser}
        allUsers={allUsersForProfile}
        likeMutation={profileLikeMutation}
        handleShare={handleDropShare}
        userLikes={profileUserLikes}
        savedDropRecords={profileSavedDrops}
      />
    </div>

    {/* DESKTOP original layout */}
    <div className="hidden md:block min-h-screen pb-20 relative overflow-hidden font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <style>{`
        @keyframes float-light {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.35; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F0F4FA; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #1E5AFF, #5AC8FF); border-radius: 3px; }
      `}</style>

      {/* Soft accent lights */}
      <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] rounded-full blur-[120px] z-0 opacity-30 pointer-events-none animate-[float-light_8s_ease-in-out_infinite]" style={{ background: "#5AC8FF" }}></div>
      <div className="absolute top-[50%] left-[70%] w-[400px] h-[400px] rounded-full blur-[140px] z-0 opacity-20 pointer-events-none animate-[float-light_12s_ease-in-out_infinite_2s]" style={{ background: "#FFD000" }}></div>

      {/* Top Nav Bar */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.9)", borderColor: "#E2E8F0" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 48, width: "auto" }} />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "GlowGroups", icon: <Users className="w-4 h-4" />, label: "Groups" },
              { to: "Notifications", icon: <Bell className="w-4 h-4" />, label: "Alerts" },
              { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
              { to: "Messages", icon: <MessageCircle className="w-4 h-4" />, label: "Messages" },
            ].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-sm font-semibold" style={{ color: "#4A5878" }}
                onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}
              >
                {item.icon}<span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {cropData && (
        <ImageCropperModal file={cropData.file} aspectRatio={cropData.aspectRatio} onCancel={() => setCropData(null)} onCrop={handleCropComplete} />
      )}
      <SubmitDropModal isOpen={isDropModalOpen} onClose={() => setIsDropModalOpen(false)} user={user} />
      <PledgeModal isOpen={pledgeModalOpen} onClose={() => setPledgeModalOpen(false)} onSigned={async () => {
        setPledgeModalOpen(false);
        const updated = await base44.auth.me();
        setUser(updated); setCurrentUser(updated);
      }} />
      <PledgeModal isOpen={viewPledgeOpen} onClose={() => setViewPledgeOpen(false)} readOnly signedAt={user?.pledge_signed_at} />
      <ProfileConnectionsModal
        title={connectionsView}
        items={connectionsView === "Followers" ? myFollowers.map((item) => ({ email: item.follower_email })) : myFollowing.map((item) => ({ email: item.following_email }))}
        allUsers={allUsersForProfile}
        currentUserEmail={currentUser?.email}
        currentUserFollowing={currentUserFollowing}
        onClose={() => setConnectionsView(null)}
        onToggleFollow={(email) => followMutation.mutate(email)}
      />
      {isEditingLeader && activeLeaderAccount && (
        <LeaderAccountFormModal
          account={activeLeaderAccount}
          onClose={() => setIsEditingLeader(false)}
          onSaved={() => {
            setIsEditingLeader(false);
            queryClient.invalidateQueries({ queryKey: ["managedLeaderAccountsForUser", currentUser?.email, currentUser?.role] });
          }}
        />
      )}

      <div className="max-w-4xl mx-auto relative z-10 pt-6 sm:pt-8">
        {isOwnProfile && managedLeaderAccounts.length > 0 && (
          <div className="px-4 mb-5">
            <LeaderAccountSwitcher
              currentUser={currentUser}
              managedAccounts={managedLeaderAccounts}
              activeLeaderEmail={activeLeaderEmail}
              onSwitch={setActiveLeaderEmail}
            />
            {isViewingLeader && (
              <div className="mt-3 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm" style={{ background: "#FFF8E6", border: "1px solid #FFE4A0", color: "#8B6914" }}>
                <span>👁️</span>
                <span><strong>Viewing as {activeLeaderAccount.leader_name}.</strong> You can manage this leader's posts below — delete from the post menu (···).</span>
              </div>
            )}
          </div>
        )}
        {isLeaderProfile ? (
          <LeaderProfileHeader
            leaderUser={displayUser}
            leaderTitle={leaderTitle}
            postsCount={myDrops.length}
            followersCount={myFollowers.length}
            followingCount={isViewingLeader ? undefined : myFollowing.length}
            isOwnProfile={isOwnProfile}
            canEditLeader={canEditLeader}
            canFollow={!isOwnProfile && !!currentUser}
            isFollowingThisUser={isFollowingThisUser}
            profileEmail={profileEmail}
            onEditLeader={() => setIsEditingLeader(true)}
            onFollowToggle={() => followMutation.mutate(profileEmail)}
            onShareProfile={handleShareProfile}
            onProfileImageSelect={e => handleImageSelect(e, "profile")}
            onCoverImageSelect={e => handleImageSelect(e, "cover")}
            uploadingImage={uploadingImage}
          />
        ) : userInstitutionApps.length > 0 ? (
          <>
            <ExecutiveProfileHeader
              user={user} isOwnProfile={isOwnProfile} profileEmail={profileEmail}
              myDrops={myDrops} myFollowers={myFollowers} myFollowing={myFollowing}
              onSetConnectionsView={setConnectionsView} onEditProfile={() => setIsEditing(true)}
              onFollowToggle={() => followMutation.mutate(profileEmail)} isFollowingThisUser={isFollowingThisUser}
              currentUser={currentUser} onProfileImageSelect={e => handleImageSelect(e, "profile")}
              onCoverImageSelect={e => handleImageSelect(e, "cover")} uploadingImage={uploadingImage}
              institutionApps={userInstitutionApps}
            />
            <div className="h-8" />
          </>
        ) : (
          <div className="px-4">
            {/* Cover Photo — with rotating border light & sweeping shimmer */}
            <style>{`
              @keyframes profile-sweep-light {
                0% { transform: translateX(-150%) skewX(-20deg); }
                100% { transform: translateX(300%) skewX(-20deg); }
              }
              @keyframes profile-spin-border {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
              }
            `}</style>
            <div
              className={`w-full h-48 sm:h-64 rounded-[1.75rem] mb-1 relative group p-[2px] overflow-hidden ${canEditAny ? 'cursor-pointer' : ''}`}
              style={{ boxShadow: "0 8px 28px rgba(11, 63, 217, 0.12)" }}
              onClick={() => canEditAny && coverInputRef.current?.click()}
            >
              {/* Rotating Edge Light — cyan→royal-blue→gold */}
              <div style={{
                position: "absolute", top: "50%", left: "50%", width: "200%", height: "200%",
                background: "conic-gradient(from 0deg, transparent 60%, #1FB8FF 78%, #0B3FD9 90%, #FFD000 100%)",
                animation: "profile-spin-border 4s linear infinite",
                zIndex: 0
              }} />

              {/* Inner cover content */}
              <div
                className="w-full h-full rounded-[1.6rem] overflow-hidden relative z-10"
                style={{ background: displayUser.cover_picture_url ? "transparent" : "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)", ...(displayUser.cover_picture_url ? { backgroundImage: `url(${displayUser.cover_picture_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}) }}
              >
                {/* Sweeping Light */}
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: 0, width: "30%",
                  background: "linear-gradient(90deg, transparent, rgba(31,184,255,0.15), rgba(255,255,255,0.4), rgba(31,184,255,0.15), transparent)",
                  animation: "profile-sweep-light 4s infinite ease-in-out",
                  zIndex: 1, pointerEvents: "none",
                }} />

                {canEditAny && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20" style={{ background: "rgba(11, 27, 61, 0.45)" }}>
                    <div className="flex items-center gap-2 font-bold px-4 py-2 rounded-lg backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.95)", color: "#0B3FD9" }}>
                      <Camera className="w-5 h-5" /> Change Cover
                    </div>
                  </div>
                )}
                {!displayUser.cover_picture_url && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#8A97B5" }}>
                    <div className="text-center">
                      <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <div className="text-sm font-semibold">No Cover Photo</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "cover")} disabled={uploadingImage} />

            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 mb-6 pb-6 relative z-10 px-4 border-b -mt-14 md:-mt-14" style={{ borderColor: "#E6ECF5" }}>
              <div
                className={`w-32 h-32 rounded-full p-1 flex-shrink-0 overflow-hidden group relative ${canEditAny ? 'cursor-pointer' : ''}`}
                style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)", boxShadow: "0 8px 28px rgba(11, 63, 217, 0.25)" }}
                onClick={() => canEditAny && profileInputRef.current?.click()}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden" style={{ background: "#FFFFFF", border: "4px solid #FFFFFF" }}>
                  <img src={displayUser.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="Profile" className="w-full h-full object-cover" />
                  {canEditAny && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10" style={{ background: "rgba(11, 27, 61, 0.5)" }}>
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
                    </div>
                  )}
                </div>
              </div>
              <input type="file" ref={profileInputRef} accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "profile")} disabled={uploadingImage} />

              <div className="flex-1 text-center md:text-left mt-2 md:mt-16">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 justify-center md:justify-start">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <h1 className="text-3xl font-bold font-['Space_Grotesk'] flex items-center gap-2 justify-center md:justify-start" style={{ color: "#0B1B3D" }}>
                      {getDisplayName(displayUser)}
                      <CountryFlag country={displayUser.country} size="md" />
                    </h1>
                    {isViewingLeader ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full w-fit mx-auto md:mx-0" style={{ background: "#FFF8E6", border: "1px solid #FFE4A0", boxShadow: "0 2px 6px rgba(255, 159, 26, 0.12)" }}>
                        <Sparkles className="w-4 h-4" style={{ color: "#CC7A00" }} />
                        <span className="text-sm font-bold" style={{ color: "#CC7A00" }}>{activeLeaderAccount.leader_title || "Leader Account"}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full w-fit mx-auto md:mx-0" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.06)" }}>
                        <Sparkles className="w-4 h-4" style={{ color: glowRank.color }} />
                        <span className="text-sm font-bold" style={{ color: "#0B1B3D" }}>{glowRank.name}</span>
                      </div>
                    )}
                  </div>
                  {canEditProfile && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="px-5 py-2 rounded-full text-sm font-bold transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B3FD9", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.06)" }}>
                      Edit Profile
                    </button>
                  )}
                  {canEditLeader && (
                    <button onClick={() => setIsEditingLeader(true)} className="px-5 py-2 rounded-full text-sm font-bold transition flex items-center gap-1.5" style={{ background: "linear-gradient(135deg, #FFD000 0%, #FF9F1A 100%)", border: "none", color: "#0B1B3D", boxShadow: "0 4px 14px rgba(255, 159, 26, 0.35)" }}>
                      ✏️ Edit Leader Profile
                    </button>
                  )}
                  {!isOwnProfile && currentUser && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => followMutation.mutate(profileEmail)}
                        className="px-6 py-2 rounded-full text-sm font-bold transition"
                        style={isFollowingThisUser
                          ? { background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }
                          : { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", border: "none", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}
                      >
                        {isFollowingThisUser ? "Following" : "Follow"}
                      </button>
                      <Link to={createPageUrl("Messages") + `?user=${encodeURIComponent(profileEmail)}`} className="px-6 py-2 rounded-full text-sm font-bold transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
                        Message
                      </Link>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-6 justify-center md:justify-start mb-5">
                  <div className="text-center md:text-left">
                    <span className="font-bold text-2xl" style={{ color: "#0B1B3D" }}>{myDrops.length}</span>
                    <span className="text-sm block md:inline ml-1" style={{ color: "#6B7FA0" }}>posts</span>
                  </div>
                  <button type="button" onClick={() => setConnectionsView("Followers")} className="text-center md:text-left transition hover:opacity-80">
                    <span className="font-bold text-2xl" style={{ color: "#0B1B3D" }}>{myFollowers.length}</span>
                    <span className="text-sm block md:inline ml-1" style={{ color: "#6B7FA0" }}>followers</span>
                  </button>
                  <button type="button" onClick={() => setConnectionsView("Following")} className="text-center md:text-left transition hover:opacity-80">
                    <span className="font-bold text-2xl" style={{ color: "#0B1B3D" }}>{myFollowing.length}</span>
                    <span className="text-sm block md:inline ml-1" style={{ color: "#6B7FA0" }}>following</span>
                  </button>
                </div>

                <div className="text-sm max-w-md mx-auto md:mx-0 space-y-3" style={{ color: "#3A4A6B" }}>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5" style={{ background: "#EEF3FF", border: "1px solid #D6E4FF", color: "#0B3FD9" }}>
                      <CountryFlag country={displayUser.country} size="xs" /> {displayUser.country || "Global Citizen"}
                    </span>
                    {!isViewingLeader && myMemberships.length > 0 && <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(31, 184, 255, 0.12)", border: "1px solid #B8E5FF", color: "#0B3FD9" }}>{myMemberships.length} GlowGroup{myMemberships.length > 1 ? "s" : ""}</span>}
                    {!isViewingLeader && userInstitutionApps.length > 0 && <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(255, 208, 0, 0.12)", border: "1px solid #FFE4A0", color: "#CC7A00" }}>Institution linked</span>}
                  </div>
                  <p className="leading-relaxed whitespace-pre-line">
                    {displayUser.bio || (isViewingLeader ? "Leader account managed by your team." : "Digital Missionary ⚡ Spreading light through faith in the online world.")}
                  </p>
                  {!isViewingLeader && user.website_url && (
                    <a href={user.website_url.startsWith("http") ? user.website_url : `https://${user.website_url}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-xs hover:underline break-all" style={{ color: "#0B3FD9" }}>
                      🔗 {user.website_url.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {!isViewingLeader && (
                    <div className="flex items-center gap-2 text-[10px] mt-1 justify-center md:justify-start" style={{ color: "#8A97B5" }}>
                      <span>Joined {user.created_date ? new Date(user.created_date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "recently"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Highlights Section — personal gamification, hidden for leader profiles */}
            {!isLeaderProfile && (
              <div className="px-4 mb-6">
                <ProfileHighlights user={user} profileCompletion={profileCompletion} nextLevelXp={nextLevelXp} recentActivity={recentActivity} onShare={handleShareProfile} />
              </div>
            )}
          </div>
        )}

        {/* LIGHTMODE PLEDGE STATUS */}
        {canEditProfile && (
          <div className="mx-4 mb-6">
            {user.pledge_signed ? (
              <div className="rounded-[1.5rem] p-5 flex items-center gap-4 flex-wrap" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0", boxShadow: "0 4px 16px rgba(255, 159, 26, 0.12)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "#FFFFFF", border: "1px solid #FFD000", boxShadow: "0 2px 8px rgba(255, 208, 0, 0.2)" }}>✋</div>
                <div className="flex-1 min-w-[180px]">
                  <div className="text-xs font-bold uppercase tracking-widest font-['Space_Grotesk']" style={{ color: "#CC7A00" }}>LightMode Pledge</div>
                  <div className="font-bold font-['Space_Grotesk'] mt-0.5" style={{ color: "#0B1B3D" }}>Pledge Signed ⚡</div>
                  {user.pledge_signed_at && (
                    <div className="text-[11px] mt-0.5" style={{ color: "#8B6914" }}>Signed {new Date(user.pledge_signed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                  )}
                </div>
                <button onClick={() => setViewPledgeOpen(true)} className="px-4 py-2 rounded-full font-bold text-xs font-['Space_Grotesk'] uppercase tracking-wider transition flex items-center gap-1.5" style={{ background: "#FFFFFF", border: "1px solid #FFD000", color: "#CC7A00" }}>
                  📜 View Pledge
                </button>
              </div>
            ) : (
              <div className="rounded-[1.5rem] p-5 flex items-center gap-4 flex-wrap" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFEECC 100%)", border: "1px solid #FFE4A0" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "#FFFFFF", border: "1px solid #FFD000" }}>✋</div>
                <div className="flex-1 min-w-[180px]">
                  <div className="text-xs font-bold uppercase tracking-widest font-['Space_Grotesk']" style={{ color: "#CC7A00" }}>Pledge Required</div>
                  <div className="font-bold font-['Space_Grotesk'] mt-0.5" style={{ color: "#0B1B3D" }}>Sign the LightMode Pledge</div>
                  <div className="text-[12px] mt-1" style={{ color: "#6B7FA0" }}>Commit to always-on faith and unlock the full movement.</div>
                </div>
                <button onClick={() => setPledgeModalOpen(true)} className="px-5 py-2.5 rounded-full font-black text-sm font-['Space_Grotesk'] hover:scale-105 transition" style={{ background: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)", color: "#0B1B3D", boxShadow: "0 4px 14px rgba(255, 159, 26, 0.35)" }}>
                  ⚡ Sign Pledge
                </button>
              </div>
            )}
          </div>
        )}

        {isEditing && isOwnProfile && (
          <EditProfileModal
            isOpen={isEditing}
            onClose={() => setIsEditing(false)}
            user={user}
            onSaved={(updated) => {
              setUser(prev => ({ ...prev, ...updated }));
              setCurrentUser(prev => ({ ...prev, ...updated }));
              if (editData.city || editData.country) {
                base44.functions.invoke("notifyTerritoryAdmins", {
                  event_type: "location_updated",
                  user_email: updated.email,
                  user_country: updated.country,
                  user_city: updated.city,
                }).catch(() => {});
              }
            }}
          />
        )}

        {/* Tabs */}
        <div className="flex border-t border-b mb-2 overflow-x-auto hide-scrollbar mx-4" style={{ borderColor: "#E6ECF5" }}>
          {(isLeaderProfile ? [
            { key: "drops", icon: <Grid className="w-4 h-4" />, label: "LEADER POSTS" },
          ] : [
            { key: "drops", icon: <Grid className="w-4 h-4" />, label: "DROPS" },
            ...(isOwnProfile ? [{ key: "story_analytics", icon: <BarChart3 className="w-4 h-4" />, label: "STORIES" }] : []),
            { key: "saved", icon: <Bookmark className="w-4 h-4" />, label: "SAVED" },
            { key: "missions", icon: <Target className="w-4 h-4" />, label: "MISSIONS" },
            { key: "badges", icon: <Award className="w-4 h-4" />, label: "ACHIEVEMENTS" },
            { key: "institutions", icon: <Building2 className="w-4 h-4" />, label: "INSTITUTIONS" },
          ]).map(tab => {
            const isActive = activeProfileTab === tab.key;
            const isInstitutions = tab.key === "institutions" && userInstitutionApps.length > 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveProfileTab(tab.key)}
                className="flex-1 py-4 flex items-center justify-center gap-2 border-t-[3px] border-b-[3px] -mb-[3px] -mt-[3px] font-bold tracking-widest text-xs cursor-pointer transition whitespace-nowrap"
                style={isActive
                  ? { borderTopColor: "transparent", borderBottomColor: isInstitutions ? "#FFD000" : "#0B3FD9", color: isInstitutions ? "#CC7A00" : "#0B3FD9" }
                  : { borderTopColor: "transparent", borderBottomColor: "transparent", color: "#6B7FA0" }}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>

        {/* DROPS TAB — feed-style post cards in a 3-column grid */}
        {activeProfileTab === "drops" && (
          <div className="px-4">
            {myDrops.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center rounded-[1.5rem]" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "#EEF3FF", border: "2px solid #D6E4FF" }}>
                  <Grid className="w-10 h-10" style={{ color: "#1FB8FF" }} />
                </div>
                <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-2" style={{ color: "#0B1B3D" }}>{isLeaderProfile ? "No Leader Posts Yet" : "No Drops Yet"}</h2>
                <p className="mb-6 text-center max-w-md" style={{ color: "#6B7FA0" }}>When verses and reflections are shared, they'll appear here as full posts.</p>
                {isOwnProfile && !isLeaderProfile && (
                  <button onClick={() => setIsDropModalOpen(true)} className="px-6 py-3 font-bold rounded-full transition" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}>
                    Share your first Drop
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {myDrops.map(drop => (
                  <DropGridTile key={drop.id} drop={drop} onClick={() => setViewingDropId(drop.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAVED TAB */}
        {activeProfileTab === "saved" && isOwnProfile && (
          <div className="py-6 px-4">
            {savedDrops.length === 0 ? (
              <div className="text-center py-20 rounded-[1.5rem]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.04)" }}>
                <Bookmark className="w-10 h-10 mx-auto mb-3" style={{ color: "#8A97B5" }} />
                <p className="font-bold text-lg" style={{ color: "#0B1B3D" }}>No saved drops yet.</p>
                <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Bookmark posts you love and they'll appear here.</p>
                <Link to={createPageUrl("Feed")} className="inline-block mt-4 font-bold hover:underline" style={{ color: "#0B3FD9" }}>Explore Feed</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                {savedDrops.map(drop => (
                  <button
                    key={drop.id}
                    onClick={() => setViewingDropId(drop.id)}
                    className="aspect-[4/5] relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-3 text-center rounded-[1.25rem] transition-all hover:-translate-y-0.5"
                    style={{ background: drop.media_url ? "#FFFFFF" : "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}
                  >
                    {drop.media_url ? (
                      <>
                        <img src={drop.media_url} alt={drop.verse || "Glow Drop"} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10" />
                      </>
                    ) : (
                      <div className="relative z-10 w-full h-full flex items-center justify-center px-3">
                        <span className="font-bold font-['Space_Grotesk'] text-sm sm:text-lg md:text-xl break-words line-clamp-5 leading-tight" style={{ color: "#0B3FD9" }}>
                          {drop.verse}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]" style={{ background: "rgba(11, 27, 61, 0.55)" }}>
                      <div className="flex items-center gap-2 font-bold text-lg text-white">
                        <Heart className="w-5 h-5 fill-white" /> {drop.likes_count || 0}
                      </div>
                      <div className="text-sm text-white/90 font-medium">View post</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MISSIONS TAB */}
        {activeProfileTab === "missions" && (
          <div className="py-6 space-y-6 px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: myDrops.length, label: "Drops Shared", color: "#0B3FD9" },
                { value: challengeSubmissions.length, label: "Challenges Done", color: "#CC7A00" },
                { value: myMemberships.length, label: "Groups Joined", color: "#1FB8FF" },
                { value: user.glow_score || 0, label: "Total XP", color: "#0B1B3D", icon: <Zap className="w-3 h-3" style={{ color: "#FFD000" }} /> },
              ].map((s, i) => (
                <div key={i} className="rounded-[1.25rem] p-4 text-center transition-all hover:-translate-y-0.5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
                  <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-1 uppercase tracking-wider flex items-center justify-center gap-1" style={{ color: "#6B7FA0" }}>{s.icon}{s.label}</div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#0B3FD9" }}><Grid className="w-4 h-4" /> Glow Drop Contributions</h3>
              {myDrops.length === 0 ? (
                <div className="text-center py-10 rounded-[1.25rem]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#6B7FA0" }}>No drops submitted yet.</div>
              ) : (
                <div className="space-y-2">
                  {myDrops.map(drop => (
                    <div key={drop.id} className="rounded-xl px-5 py-4 flex items-center justify-between gap-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: drop.status === 'approved' ? '#22C55E' : drop.status === 'rejected' ? '#EF4444' : '#FFD000' }} />
                        <p className="text-sm truncate" style={{ color: "#0B1B3D" }}>{drop.verse || "(No verse)"}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#CC7A00" }}><Heart className="w-3 h-3" />{drop.likes_count || 0}</span>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide" style={
                          drop.status === 'approved' ? { background: "rgba(34, 197, 94, 0.1)", color: "#16A34A" }
                          : drop.status === 'rejected' ? { background: "rgba(239, 68, 68, 0.1)", color: "#DC2626" }
                          : { background: "rgba(255, 208, 0, 0.12)", color: "#CC7A00" }
                        }>
                          {drop.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#CC7A00" }}><Target className="w-4 h-4" /> Challenge Submissions</h3>
              {challengeSubmissions.length === 0 ? (
                <div className="text-center py-10 rounded-[1.25rem]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#6B7FA0" }}>No challenges submitted yet. Head to Challenges to earn XP!</div>
              ) : (
                <div className="space-y-2">
                  {challengeSubmissions.map(sub => {
                    const challenge = allChallenges.find(c => c.id === sub.challenge_id);
                    return (
                      <div key={sub.id} className="rounded-xl px-5 py-4 flex items-center justify-between gap-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#22C55E" }} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "#0B1B3D" }}>{challenge?.title || "Challenge"}</p>
                            <p className="text-xs truncate" style={{ color: "#8A97B5" }}>{sub.submission_url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 font-black text-sm flex-shrink-0" style={{ color: "#CC7A00" }}>
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

        {activeProfileTab === "story_analytics" && isOwnProfile && (
          <div className="px-4">
            <StoryAnalyticsDashboard profileEmail={profileEmail} allUsers={allUsersForProfile} />
          </div>
        )}

        {activeProfileTab === "institutions" && (
          <div className="px-4"><ProfileInstitutionsTab profileEmail={profileEmail} isOwnProfile={isOwnProfile} /></div>
        )}

        {activeProfileTab === "badges" && (
          <AchievementBadges user={user} myDrops={myDrops} myFollowing={myFollowing} myFollowers={myFollowers} myMemberships={myMemberships} mySupports={mySupports} challengeSubmissions={challengeSubmissions} certificates={certificates} />
        )}
      </div>

      {/* Instagram-style Post Viewer Modal */}
      <PostViewerModal
        isOpen={!!viewingDropId}
        onClose={() => setViewingDropId(null)}
        drops={activeProfileTab === "saved" ? savedDrops : myDrops}
        initialDropId={viewingDropId}
        user={displayUser}
        currentUser={currentUser}
        allUsers={allUsersForProfile}
        likeMutation={profileLikeMutation}
        handleShare={handleDropShare}
        userLikes={profileUserLikes}
        savedDropRecords={profileSavedDrops}
      />
      <AppFooter />
    </div>
    </>
  );
}