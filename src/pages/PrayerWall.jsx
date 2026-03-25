import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Zap, Bell, User, Globe } from "lucide-react";
import PrayerRequestCard from "@/components/prayer/PrayerRequestCard";

export default function PrayerWall() {
  const [user, setUser] = useState(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Other");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: requests = [] } = useQuery({
    queryKey: ["prayerRequests"],
    queryFn: () => base44.entities.PrayerRequest.list("-created_date", 100),
    enabled: !!user,
  });

  const { data: supports = [] } = useQuery({
    queryKey: ["prayerSupports"],
    queryFn: () => base44.entities.PrayerSupport.list("-created_date", 500),
    enabled: !!user,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["prayerComments"],
    queryFn: () => base44.entities.PrayerComment.list("-created_date", 500),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const unsubRequests = base44.entities.PrayerRequest.subscribe(() => queryClient.invalidateQueries({ queryKey: ["prayerRequests"] }));
    const unsubSupports = base44.entities.PrayerSupport.subscribe(() => queryClient.invalidateQueries({ queryKey: ["prayerSupports"] }));
    const unsubComments = base44.entities.PrayerComment.subscribe(() => queryClient.invalidateQueries({ queryKey: ["prayerComments"] }));
    return () => {
      unsubRequests();
      unsubSupports();
      unsubComments();
    };
  }, [user, queryClient]);

  const postMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.PrayerRequest.create({
        user_email: user.email,
        content,
        category,
        is_anonymous: isAnonymous,
        answered: false,
      });
    },
    onSuccess: () => {
      setContent("");
      setCategory("Other");
      setIsAnonymous(false);
      queryClient.invalidateQueries({ queryKey: ["prayerRequests"] });
    },
  });

  const prayMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.PrayerSupport.create({ request_id: requestId, user_email: user.email });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prayerSupports"] }),
  });

  const commentMutation = useMutation({
    mutationFn: async ({ requestId, commentContent, anonymous }) => {
      await base44.entities.PrayerComment.create({
        request_id: requestId,
        user_email: user.email,
        content: commentContent,
        is_anonymous: anonymous,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prayerComments"] }),
  });

  const getName = (email) => allUsers.find((entry) => entry.email === email)?.full_name || email?.split("@")[0] || "Believer";

  if (!user) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">Loading prayer wall...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Top Nav Bar */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
              alt="LightMode"
              style={{ height: 56, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to={createPageUrl("Notifications")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Bell className="w-4 h-4" /><span className="hidden sm:inline">Alerts</span>
            </Link>
            <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
            </Link>
            <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-sm font-medium border border-white/5">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Prayer Wall</h1>
            <p className="text-gray-400 mt-2">Share requests, pray for others, and leave encouragement.</p>
          </div>

        <div className="bg-[#121826] border border-white/10 rounded-3xl p-5 space-y-4">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share your prayer request..."
            className="w-full min-h-[120px] rounded-2xl bg-[#0F1524] border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00CFFF]/40"
          />
          <div className="grid sm:grid-cols-[180px_1fr] gap-3">
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-2xl bg-[#0F1524] border border-white/10 px-4 text-white focus:outline-none">
              <option>Health</option>
              <option>Family</option>
              <option>Finance</option>
              <option>Guidance</option>
              <option>Other</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-400 px-2">
              <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
              Post anonymously
            </label>
          </div>
          <button onClick={() => postMutation.mutate()} disabled={!content.trim() || postMutation.isPending} className="px-5 py-3 rounded-2xl bg-[#00CFFF] text-black font-semibold disabled:opacity-50">Post prayer request</button>
        </div>

        <div className="space-y-4">
          {requests.map((request) => {
            const requestSupports = supports.filter((support) => support.request_id === request.id);
            const requestComments = comments
              .filter((comment) => comment.request_id === request.id)
              .map((comment) => ({ ...comment, authorName: getName(comment.user_email) }));

            return (
              <PrayerRequestCard
                key={request.id}
                request={request}
                requesterName={getName(request.user_email)}
                supportCount={requestSupports.length}
                hasPrayed={requestSupports.some((support) => support.user_email === user.email)}
                comments={requestComments}
                onPray={() => prayMutation.mutate(request.id)}
                onComment={(commentContent, anonymous) => commentMutation.mutate({ requestId: request.id, commentContent, anonymous })}
              />
            );
          })}
        </div>
        </div>
        </div>
        </div>
        );
        }