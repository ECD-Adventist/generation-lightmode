import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Zap, Bell, User, Globe } from "lucide-react";
import PrayerRequestCard from "@/components/prayer/PrayerRequestCard";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePrayerWall from "@/components/prayer/MobilePrayerWall";
import { getDisplayName } from "@/lib/displayName";

export default function PrayerWall() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Other");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  // Fetch window grows with the visible count so "Load More" keeps pulling
  // older requests from the server instead of capping at a fixed 100.
  const fetchLimit = visibleCount + 10;
  const { data: requests = [] } = useQuery({
    queryKey: ["prayerRequests", fetchLimit],
    queryFn: () => base44.entities.PrayerRequest.list("-created_date", fetchLimit),
    enabled: !!user,
    placeholderData: (prev) => prev,
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
      await base44.functions.invoke("submitPrayerRequest", {
        content,
        category,
        is_anonymous: isAnonymous,
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
      await base44.functions.invoke("createPrayerSupport", { request_id: requestId });
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

  const getName = (email) => getDisplayName(allUsers.find((entry) => entry.email === email) || { email });

  const visibleRequests = requests.slice(0, visibleCount);
  const hasMoreRequests = visibleCount < requests.length || requests.length >= fetchLimit;

  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><span style={{ color: "#1FB8FF" }}>Loading prayer wall...</span></div>;

  if (isMobile) {
    return (
      <MobilePrayerWall
        user={user} content={content} setContent={setContent}
        category={category} setCategory={setCategory}
        isAnonymous={isAnonymous} setIsAnonymous={setIsAnonymous}
        postMutation={postMutation}
        requests={visibleRequests} supports={supports} comments={comments}
        prayMutation={prayMutation} commentMutation={commentMutation}
        getName={getName}
        hasMore={hasMoreRequests}
        onLoadMore={() => setVisibleCount(c => c + 10)}
      />
    );
  }

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* Top Nav Bar */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.9)", borderColor: "#E2E8F0" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 48, width: "auto" }} />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
              { to: "Notifications", icon: <Bell className="w-4 h-4" />, label: "Alerts" },
              { to: "Profile", icon: <User className="w-4 h-4" />, label: "Profile" },
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

      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#0B1B3D" }}>Prayer Wall</h1>
            <p className="mt-2" style={{ color: "#6B7FA0" }}>Share requests, pray for others, and leave encouragement.</p>
          </div>

        <div className="rounded-3xl p-5 space-y-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share your prayer request..."
            className="w-full min-h-[120px] rounded-2xl px-4 py-3 focus:outline-none"
            style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
          />
          <div className="grid sm:grid-cols-[180px_1fr] gap-3">
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-2xl px-4 focus:outline-none" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}>
              <option>Health</option>
              <option>Family</option>
              <option>Finance</option>
              <option>Guidance</option>
              <option>Other</option>
            </select>
            <label className="flex items-center gap-2 text-sm px-2" style={{ color: "#4A5878" }}>
              <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
              Post anonymously
            </label>
          </div>
          <button onClick={() => postMutation.mutate()} disabled={!content.trim() || postMutation.isPending} className="px-5 py-3 rounded-2xl font-semibold disabled:opacity-50 transition" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}>Post prayer request</button>
        </div>

        <div className="space-y-4">
          {visibleRequests.map((request) => {
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
                currentUser={user}
              />
            );
          })}
          {hasMoreRequests && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisibleCount(c => c + 10)}
                className="px-6 py-3 rounded-2xl font-semibold transition"
                style={{ background: "#FFFFFF", border: "1px solid #D6E4FF", color: "#0B3FD9", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.06)" }}
              >
                Load More ({requests.length - visibleCount} left)
              </button>
            </div>
          )}
        </div>
        </div>
        </div>
        </div>
        );
        }