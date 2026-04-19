import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import ChallengesStats from "./challenges/ChallengesStats";
import ChallengesToolbar from "./challenges/ChallengesToolbar";
import ChallengeCard from "./challenges/ChallengeCard";
import ChallengeFormModal from "./challenges/ChallengeFormModal";
import ChallengeDetailDrawer from "./challenges/ChallengeDetailDrawer";
import ChallengesEmptyState from "./challenges/ChallengesEmptyState";
import ChallengesBulkBar from "./challenges/ChallengesBulkBar";
import ChallengesAnalytics from "./challenges/ChallengesAnalytics";
import { templateToChallenge } from "./ChallengeTemplates.js";
import { getChallengeStatus, computeChallengeStats } from "./challenges/challengeHelpers";

export default function AdminChallengesTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["admin_challenges"],
    queryFn: () => base44.entities.Challenge.list("-created_date", 200),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["admin_challenge_submissions"],
    queryFn: () => base44.entities.ChallengeSubmission.list("-created_date", 1000),
  });

  const stats = useMemo(() => computeChallengeStats(challenges, submissions), [challenges, submissions]);

  const counts = useMemo(() => {
    const c = { all: challenges.length, active: 0, upcoming: 0, ended: 0, draft: 0 };
    challenges.forEach(ch => { c[getChallengeStatus(ch)]++; });
    return c;
  }, [challenges]);

  const territories = useMemo(() => {
    const set = new Set(challenges.map(c => c.territory_scope).filter(Boolean));
    return Array.from(set).sort();
  }, [challenges]);

  const displayed = useMemo(() => {
    let list = challenges.filter(c => {
      if (filter !== "all" && getChallengeStatus(c) !== filter) return false;
      if (territoryFilter !== "all" && c.territory_scope !== territoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [c.title, c.description, c.territory_scope].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const participants = (id) => new Set(submissions.filter(s => s.challenge_id === id).map(s => s.user_email)).size;

    if (sortBy === "ending_soon") {
      list = list.slice().sort((a, b) => new Date(a.end_date || "9999").getTime() - new Date(b.end_date || "9999").getTime());
    } else if (sortBy === "most_participants") {
      list = list.slice().sort((a, b) => participants(b.id) - participants(a.id));
    } else if (sortBy === "highest_reward") {
      list = list.slice().sort((a, b) => (b.points_reward || 0) - (a.points_reward || 0));
    }
    return list;
  }, [challenges, submissions, filter, territoryFilter, search, sortBy]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin_challenges"] });
    queryClient.invalidateQueries({ queryKey: ["admin_challenge_submissions"] });
  };

  const handleCreate = () => { setEditing(null); setPrefill(null); setFormOpen(true); };
  const handleUseTemplate = (tpl) => { setEditing(null); setPrefill(templateToChallenge(tpl)); setFormOpen(true); };
  const handleEdit = (c) => { setEditing(c); setPrefill(null); setFormOpen(true); };

  const handleDuplicate = async (c) => {
    try {
      const copy = { ...c, title: `${c.title} (copy)`, active: false };
      delete copy.id; delete copy.created_date; delete copy.updated_date; delete copy.created_by;
      await base44.entities.Challenge.create(copy);
      toast.success("Challenge duplicated as draft");
      refresh();
    } catch (err) { toast.error(err?.message || "Duplicate failed"); }
  };

  const handleDelete = async (c) => {
    const subCount = submissions.filter(s => s.challenge_id === c.id).length;
    const warning = subCount > 0
      ? `This challenge has ${subCount} submission(s). Delete anyway? This cannot be undone.`
      : `Delete "${c.title}"? This cannot be undone.`;
    if (!window.confirm(warning)) return;
    try {
      await base44.entities.Challenge.delete(c.id);
      toast.success("Deleted");
      if (viewing?.id === c.id) setViewing(null);
      refresh();
    } catch (err) { toast.error(err?.message || "Delete failed"); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const showEmptyState = !isLoading && challenges.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Challenges</h1>
          <p className="mt-1 text-sm md:text-base" style={{ color: t.textSecondary }}>Create and manage daily/weekly missions for your community.</p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm transition hover:opacity-90" style={{ background: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)", color: "#0B1B3D" }}>
          <Plus size={16} /> Create Challenge
        </button>
      </div>

      {!showEmptyState && (
        <>
          <ChallengesStats stats={stats} t={t} />

          <ChallengesAnalytics challenges={challenges} submissions={submissions} t={t} isDark={isDark} />

          <ChallengesToolbar
            filter={filter} setFilter={setFilter}
            search={search} setSearch={setSearch}
            territoryFilter={territoryFilter} setTerritoryFilter={setTerritoryFilter}
            sortBy={sortBy} setSortBy={setSortBy}
            territories={territories}
            counts={counts}
            t={t}
          />

          <ChallengesBulkBar
            selected={selected} setSelected={setSelected}
            challenges={challenges} submissions={submissions}
            onRefresh={refresh} t={t}
          />

          <p className="text-xs" style={{ color: t.textSecondary }}>
            Showing <span className="font-bold" style={{ color: t.textPrimary }}>{displayed.length}</span> of {challenges.length} challenge{challenges.length === 1 ? "" : "s"}
            {isLoading && <span className="ml-2" style={{ color: t.textMuted }}>· loading...</span>}
          </p>
        </>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} /></div>
      ) : showEmptyState ? (
        <ChallengesEmptyState onUseTemplate={handleUseTemplate} onCreate={handleCreate} t={t} />
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed" style={{ background: t.surface, borderColor: t.border, color: t.textMuted }}>
          <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No challenges match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map(c => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              submissions={submissions}
              selected={selected.has(c.id)}
              onToggleSelect={() => toggleSelect(c.id)}
              onView={() => setViewing(c)}
              onEdit={() => handleEdit(c)}
              onDuplicate={() => handleDuplicate(c)}
              onDelete={() => handleDelete(c)}
              t={t} isDark={isDark}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <ChallengeFormModal
          challenge={editing || prefill}
          onClose={() => { setFormOpen(false); setEditing(null); setPrefill(null); }}
          onSaved={refresh}
          t={t}
        />
      )}

      {viewing && (
        <ChallengeDetailDrawer
          challenge={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { handleEdit(viewing); setViewing(null); }}
          t={t} isDark={isDark}
        />
      )}
    </div>
  );
}