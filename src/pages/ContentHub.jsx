import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, CalendarDays, Sparkles } from "lucide-react";
import MobileSubPageHeader from "@/components/mobile/MobileSubPageHeader";
import ContentCard, { LockedContentCard } from "@/components/content-hub/ContentCard";
import ContentPreviewModal from "@/components/content-hub/ContentPreviewModal";
import { CONTENT_TYPES } from "@/components/content-hub/contentConstants";

const CONTENT_CACHE_KEY = "all-things-new-items";

const readCachedItems = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CONTENT_CACHE_KEY) || "null") || undefined;
  } catch {
    return undefined;
  }
};

export default function ContentHub() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [sharedPreviewId, setSharedPreviewId] = useState(() => new URLSearchParams(window.location.search).get("item"));

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ["digital-content-public"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listDigitalContent", {});
      const loadedItems = res.data?.items || [];
      sessionStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(loadedItems));
      return loadedItems;
    },
    initialData: readCachedItems,
    staleTime: 60_000,
    gcTime: 30 * 60_000,
  });

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://drive.google.com";
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  const sharedPreview = items.find(item => item.id === sharedPreviewId && item.unlocked) || null;

  const closeSharedPreview = () => {
    setSharedPreviewId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("item");
    window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
  };

  const languages = useMemo(() => [...new Set(items.map(i => i.language).filter(Boolean))], [items]);

  const filtered = useMemo(() => items.filter(i =>
    (typeFilter === "all" || i.content_type === typeFilter) &&
    (langFilter === "all" || i.language === langFilter)
  ), [items, typeFilter, langFilter]);

  const unlockedItems = filtered.filter(i => i.unlocked);
  const lockedItems = filtered.filter(i => !i.unlocked).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  const chip = (active, color = "#00CFFF") => ({
    padding: "8px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
    fontFamily: "Inter, sans-serif", transition: "all 0.2s", whiteSpace: "nowrap",
    background: active ? `${color}18` : "rgba(255,255,255,0.03)",
    border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
    color: active ? color : "#C8D0E0",
  });

  return (
    <div className="min-h-screen" style={{ background: "#0B0F1A" }}>
      <MobileSubPageHeader title="All Things New" />
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-12 pb-8 text-center">
        <div className="absolute -top-16 left-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "#00CFFF", opacity: 0.1 }} />
        <div className="absolute -bottom-16 right-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "#8A5CFF", opacity: 0.1 }} />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.25)" }}>
            <Sparkles size={11} style={{ color: "#00CFFF" }} />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "#00CFFF" }}>All Things New</span>
          </div>
          <h1 className="glm-headline text-3xl md:text-5xl text-white mb-3">
            All Things <span className="glm-gradient-text">New</span>
          </h1>
          <p className="glm-body text-sm md:text-base max-w-xl mx-auto">
            Videos, posters & animations in your language — new content unlocks on schedule. Download it, share it, spread the light.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="px-6 pb-6">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-2">
          <button style={chip(typeFilter === "all")} onClick={() => setTypeFilter("all")}>All Types</button>
          {CONTENT_TYPES.map(t => (
            <button key={t.id} style={chip(typeFilter === t.id, t.color)} onClick={() => setTypeFilter(t.id)}>{t.emoji} {t.label}s</button>
          ))}
          {languages.length > 1 && (
            <>
              <span className="w-px self-stretch mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />
              <button style={chip(langFilter === "all", "#FFD000")} onClick={() => setLangFilter("all")}>All Languages</button>
              {languages.map(l => (
                <button key={l} style={chip(langFilter === l, "#FFD000")} onClick={() => setLangFilter(l)}>{l}</button>
              ))}
            </>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00CFFF" }} /></div>
      ) : (
        <>
          {/* Available now */}
          <section className="px-6 pb-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="glm-headline text-lg text-white mb-4 flex items-center gap-2">
                <span className="glow-dot" /> Available Now
              </h2>
              {unlockedItems.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: "#121826", border: "1px dashed rgba(0,207,255,0.2)" }}>
                  <p className="text-white font-bold mb-1">Nothing unlocked yet</p>
                  <p className="text-xs" style={{ color: "#8A9BB0" }}>Check the schedule below — new content is on the way ⚡</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedItems.map(item => <ContentCard key={item.id} item={item} />)}
                </div>
              )}
            </div>
          </section>

          {/* Coming up — locked schedule */}
          {lockedItems.length > 0 && (
            <section className="px-6 pb-16">
              <div className="max-w-6xl mx-auto">
                <h2 className="glm-headline text-lg text-white mb-1 flex items-center gap-2">
                  <CalendarDays size={17} style={{ color: "#FFD000" }} /> Coming Up
                </h2>
                <p className="text-xs mb-4" style={{ color: "#8A9BB0" }}>These drop automatically at their scheduled day & time — come back to unlock them.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {lockedItems.map(item => <LockedContentCard key={item.id} item={item} />)}
                </div>
              </div>
            </section>
          )}
        </>
      )}
      {sharedPreview && <ContentPreviewModal item={sharedPreview} open onClose={closeSharedPreview} />}
    </div>
  );
}