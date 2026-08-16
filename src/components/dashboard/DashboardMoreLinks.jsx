import React from "react";
import { Link } from "react-router-dom";
import { Award, Building2, Camera, Globe2, HeartHandshake, Map, Settings, Sparkles, Target } from "lucide-react";
import { createPageUrl } from "@/utils";

const links = [
  { label: "Milestones", page: "Milestones", icon: Award },
  { label: "Global Reach", page: "GlobalReach", icon: Map },
  { label: "Challenges", page: "Challenges", icon: Target },
  { label: "Light Reflections", page: "LightReflections", icon: Sparkles },
  { label: "Faith Quiz", page: "FaithQuiz", icon: Award },
  { label: "Prayer Wall", page: "PrayerWall", icon: HeartHandshake },
  { label: "Territory Moments", page: "TerritoryPhotos", icon: Camera },
  { label: "Settings", page: "Settings", icon: Settings },
  { label: "Claim Institution Dashboard", page: "ClaimInstitutionDashboard", icon: Building2 },
];

export default function DashboardMoreLinks() {
  return (
    <section aria-labelledby="dashboard-more-title" className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Globe2 className="h-5 w-5 text-primary" />
        <h2 id="dashboard-more-title" className="font-heading text-lg font-bold text-card-foreground">More</h2>
      </div>
      <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 lg:grid-cols-3">
        {links.map(({ label, page, icon: Icon }) => (
          <Link key={page} to={createPageUrl(page)} className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Icon className="h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0 break-words">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}