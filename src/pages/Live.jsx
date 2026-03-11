import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import LiveSessionCard from "@/components/live/LiveSessionCard";
import LiveBroadcastStudio from "@/components/live/LiveBroadcastStudio";
import LiveViewer from "@/components/live/LiveViewer";

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
    <div className="min-h-screen bg-[#0B0F1A] text-white px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
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