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

  // The session list is polled every 8s above; no table-wide subscription.

  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><span style={{ color: "#1FB8FF" }}>Loading live...</span></div>;

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.9)", borderColor: "#E2E8F0" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 48, width: "auto" }} />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
              { to: "GlobalReach", icon: <Globe className="w-4 h-4" />, label: "Reach" },
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

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#0B1B3D" }}>Live Broadcasts</h1>
            <p className="mt-2" style={{ color: "#6B7FA0" }}>Go live for testimonies, prayer, and faith conversations.</p>
          </div>
          {!isBroadcasting && !selectedSession && (
            <button onClick={() => setIsBroadcasting(true)} className="px-5 py-3 rounded-2xl font-semibold transition" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}>Start live broadcast</button>
          )}
        </div>

        {isBroadcasting ? (
          <LiveBroadcastStudio user={user} onClose={() => setIsBroadcasting(false)} />
        ) : selectedSession ? (
          <LiveViewer session={selectedSession} user={user} onBack={() => setSelectedSession(null)} />
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl p-10 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#8A97B5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>No one is live right now. Start the first broadcast.</div>
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