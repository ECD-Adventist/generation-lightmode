import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Zap, Target } from "lucide-react";
import { createPageUrl } from "@/utils";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";

export default function LiveChallengesPage() {
  const [filter, setFilter] = useState("active");
  const { data: snapshot } = usePublicCommunitySnapshot();
  const challenges = snapshot.challenges || [];

  const filteredChallenges = useMemo(() => {
    if (filter === "all") return challenges;
    if (filter === "active") return challenges.filter((challenge) => challenge.active);
    return challenges.filter((challenge) => !challenge.active);
  }, [challenges, filter]);

  return (
    <div className="bg-background min-h-screen font-['Inter'] text-foreground">
      <section className="pt-12 px-6 pb-16 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-5 py-2 mb-6">
            <Target size={14} className="text-amber-600 dark:text-amber-400" />
            <span className="text-amber-600 dark:text-amber-400 text-sm font-semibold">Live Challenges</span>
          </div>
          <h1 className="font-['Space_Grotesk'] font-extrabold text-[clamp(32px,5vw,64px)] mb-5 text-foreground">
            Real <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Challenges</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-muted-foreground">
            These challenges come directly from the app's live challenge records.
          </p>
          <div className="flex gap-10 justify-center flex-wrap">
            {[
              { label: "Active", value: snapshot.totalChallenges || 0, color: "text-blue-600 dark:text-blue-400" },
              { label: "All Challenges", value: challenges.length, color: "text-amber-600 dark:text-amber-400" },
              { label: "Participants", value: challenges.reduce((sum, challenge) => sum + (challenge.participantsCount || 0), 0), color: "text-blue-600 dark:text-blue-400" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`font-['Space_Grotesk'] font-extrabold text-3xl ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-border w-full" />

      <section className="py-8 px-6 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto flex gap-2.5 flex-wrap justify-center">
          {[
            { id: "active", label: "Active" },
            { id: "all", label: "All" },
            { id: "completed", label: "Completed" },
          ].map((item) => (
            <button key={item.id} onClick={() => setFilter(item.id)} className={`px-6 py-2.5 rounded-full border text-sm font-semibold transition ${filter === item.id ? "bg-blue-600 text-white border-blue-600" : "bg-transparent text-muted-foreground border-border hover:bg-muted"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="pt-16 px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {filteredChallenges.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-7 text-center">
              <p className="text-muted-foreground">No live challenges match this filter yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges.map((challenge) => (
                <div key={challenge.id} className={`bg-card border rounded-2xl p-7 transition-all shadow-sm hover:shadow-md ${challenge.active ? "border-blue-500/30" : "border-border"}`}>
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${challenge.active ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                      {challenge.active ? "Active" : "Completed"}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">+{challenge.points_reward} XP</span>
                  </div>
                  <h3 className="font-['Space_Grotesk'] font-extrabold text-2xl text-card-foreground mb-2">{challenge.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{challenge.description || "No description yet."}</p>
                  <div className="flex gap-4 flex-wrap mb-5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users size={14} />
                      <span className="text-sm">{challenge.participantsCount || 0} participants</span>
                    </div>
                    {(challenge.start_date || challenge.end_date) && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar size={14} />
                        <span className="text-sm">{challenge.start_date || "Open"} {challenge.end_date ? `→ ${challenge.end_date}` : ""}</span>
                      </div>
                    )}
                  </div>
                  <Link to={createPageUrl("Dashboard") + "?tab=challenges"} className="block text-center text-[15px] bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-['Space_Grotesk'] font-extrabold py-3.5 rounded-full shadow-sm hover:shadow-md transition">
                    Open in dashboard
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}