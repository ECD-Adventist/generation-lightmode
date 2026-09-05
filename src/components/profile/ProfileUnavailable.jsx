import React from "react";
import { Link } from "react-router-dom";
export default function ProfileUnavailable() {
  return <div className="min-h-screen flex items-center justify-center bg-background p-6 text-foreground">
    <div className="max-w-md rounded-2xl border bg-card p-8 text-center">
      <h1 className="text-2xl font-bold">Profile unavailable</h1>
      <p className="mt-3 text-muted-foreground">This profile could not be loaded. Return to Explore and select the person again.</p>
      <Link to="/GlowGroups" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Return to Explore</Link>
    </div>
  </div>;
}