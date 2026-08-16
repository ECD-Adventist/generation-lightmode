import React from "react";
import { Link } from "react-router-dom";
import { Award, Building2, Camera, HeartHandshake, LayoutGrid, Map, Settings, Sparkles, Target } from "lucide-react";
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
  { label: "Claim Institution", page: "ClaimInstitutionDashboard", icon: Building2 },
];

export default function DashboardMoreLinks() {
  return (
    <section aria-labelledby="dashboard-more-title" className="mb-8 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
        <h2 id="dashboard-more-title" className="font-heading text-base font-bold text-card-foreground sm:text-lg">More</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {links.map(({ label, page, icon: Icon }) => (
          <Link
            key={page}
            to={createPageUrl(page)}
            className="flex min-h-[72px] min-w-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-2 py-3 text-center transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="h-5 w-5 shrink-0 text-primary" />
            <span className="w-full text-pretty break-words text-[11px] font-semibold leading-tight text-foreground sm:text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}