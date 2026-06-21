import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import GuestPreviewWall from "@/components/pledge/GuestPreviewWall";

/**
 * Full-screen "Join the Movement" gate for protected pages.
 *
 * Renders nothing while auth resolves, the GuestPreviewWall for guests, and
 * its children once authenticated. Use to block guests from protected pages
 * (Messages, Dashboard, Profile, Notifications, Prayer Wall submission, etc.)
 * WITHOUT a silent redirect.
 *
 * Usage:
 *   <GuestGate destination="Dashboard">
 *     ...protected page content...
 *   </GuestGate>
 */
export default function GuestGate({ children, destination = "Feed" }) {
  const [status, setStatus] = useState("checking"); // checking | guest | authed

  useEffect(() => {
    let cancelled = false;
    base44.auth.isAuthenticated().then((authed) => {
      if (cancelled) return;
      setStatus(authed ? "authed" : "guest");
    });
    return () => { cancelled = true; };
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
      </div>
    );
  }

  if (status === "guest") {
    return <GuestPreviewWall destination={destination} />;
  }

  return children;
}