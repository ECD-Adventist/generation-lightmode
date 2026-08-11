import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, CalendarDays } from "lucide-react";
import MobileSubPageHeader from "@/components/mobile/MobileSubPageHeader";
import ContentGroupedList from "@/components/content-hub/ContentGroupedList";
import ContentPreviewModal from "@/components/content-hub/ContentPreviewModal";
import ContentControlRail from "@/components/content-hub/ContentControlRail";

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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sharedPreviewId, setSharedPreviewId] = useState(() => new URLSearchParams(window.location.search).get("item"));
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [viewAll, setViewAll] = useState(false);

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ["digital-content-public"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listDigitalContent", {});
      const loadedItems = res.data?.items || [];
      sessionStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(loadedItems));
      return loadedItems;
    },
    placeholderData: readCachedItems,
    staleTime: 0,
    gcTime: 30 * 60_000,
    refetchOnMount: "always",
  });

  useEffect(() => {
    const hosts = ["https://drive.google.com", "https://media.base44.com"];
    const links = hosts.map((href) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach(link => link.remove());
  }, []);

  const sharedPreview = items.find(item => item.id === sharedPreviewId && item.unlocked) || null;

  const closeSharedPreview = () => {
    setSharedPreviewId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("item");
    window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
  };

  const languages = useMemo(() => [...new Set(items.map(i => i.language).filter(Boolean))], [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(i =>
      (typeFilter === "all" || i.content_type === typeFilter) &&
      (categoryFilter === "all" || i.category === categoryFilter) &&
      (langFilter === "all" || i.language === langFilter) &&
      (!q || `${i.title} ${i.description} ${i.language}`.toLowerCase().includes(q))
    );
  }, [items, typeFilter, categoryFilter, langFilter, search]);

  const dateFiltered = viewAll ? filtered : filtered.filter(i => new Date(i.scheduled_at).toLocaleDateString("en-CA") === selectedDate);
  const unlockedItems = dateFiltered.filter(i => i.unlocked);
  const lockedItems = dateFiltered.filter(i => !i.unlocked).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const horizontal = !viewAll && langFilter === "all";

  return (
    <div className="min-h-screen" style={{ background: "#0B0F1A" }}>
      <MobileSubPageHeader title="All Things New" showMenu />
      <ContentControlRail
        items={items}
        selectedDate={selectedDate}
        onSelectDate={(key) => { setSelectedDate(key); setViewAll(false); }}
        search={search}
        onSearch={setSearch}
        viewAll={viewAll}
        onToggleViewAll={() => setViewAll(value => !value)}
        languages={languages}
        language={langFilter}
        onLanguage={setLangFilter}
        type={typeFilter}
        onType={setTypeFilter}
        category={categoryFilter}
        onCategory={setCategoryFilter}
      />

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
                <ContentGroupedList items={unlockedItems} horizontal={horizontal} />
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
                <p className="text-xs mb-4" style={{ color: "#8A9BB0" }}>These unlock at one global moment; the time shown on each item is automatically converted to your local timezone.</p>
                <ContentGroupedList items={lockedItems} locked horizontal={horizontal} />
              </div>
            </section>
          )}
        </>
      )}
      {sharedPreview && <ContentPreviewModal item={sharedPreview} open onClose={closeSharedPreview} />}
    </div>
  );
}