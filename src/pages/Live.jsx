import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import LiveSessionCard from "@/components/live/LiveSessionCard";
import LiveBroadcastStudio from "@/components/live/LiveBroadcastStudio";
import LiveViewer from "@/components/live/LiveViewer";
import { Link } from "react-router-dom";
import { Home, Zap, Globe, Bell, User } from "lucide-react";

export default function Live() {
  const [user, setUser] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: sessions = [] } = useQuery({
    queryKey: ["liveSessions"],
    queryFn: () => base44.entities.LiveSession.filter({ is_active: true }, "-created_date"),
    enabled: !!user,
    refetchInterval: 8000,
  });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = base44.entities.LiveSession.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["liveSessions"] });
    });
    return unsubscribe;
  }, [user, queryClient]);

  if (!user) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">Loading live...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
              alt="LightMode"
              style={{ height: 56, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Globe className="w-4 h-4" /><span className="hidden sm:inline">Reach</span>
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

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Live Broadcasts</h1>
            <p className="text-gray-400 mt-2">Go live for testimonies, prayer, and faith conversations.</p>
          </div>
          {!isBroadcasting && !selectedSession && (
            <button onClick={() => setIsBroadcasting(true)} className="px-5 py-3 rounded-2xl bg-[#00CFFF] text-black font-semibold hover:bg-white transition">Start live broadcast</button>
          )}
        </div>

        {isBroadcasting ? (
          <LiveBroadcastStudio user={user} onClose={() => setIsBroadcasting(false)} />
        ) : selectedSession ? (
          <LiveViewer session={selectedSession} user={user} onBack={() => setSelectedSession(null)} />
        ) : sessions.length === 0 ? (
          <div className="bg-[#121826] border border-white/10 rounded-3xl p-10 text-center text-gray-400">No one is live right now. Start the first broadcast.</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <LiveSessionCard key={session.id} session={session} onJoin={() => setSelectedSession(session)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}