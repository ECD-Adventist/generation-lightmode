import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ResourcesHero from "../components/resources/ResourcesHero";
import ResourcesTabs from "../components/resources/ResourcesTabs";
import MediaShowcase from "../components/resources/MediaShowcase";
import DownloadsShowcase from "../components/resources/DownloadsShowcase";
import { downloads, mediaItems } from "../components/resources/resourcesData";

export default function Resources() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("media");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setActiveTab(urlParams.get("tab") === "downloads" ? "downloads" : "media");
  }, [location.search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const nextUrl = `${location.pathname}${tab === "downloads" ? "?tab=downloads" : ""}`;
    window.history.replaceState({}, "", nextUrl);
  };

  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      const catMatch = activeCategory === "all" || item.category === activeCategory;
      const typeMatch = activeType === "all" || item.type === activeType;
      return catMatch && typeMatch;
    });
  }, [activeCategory, activeType]);

  return (
    <div style={{ background: "#0B0F1A" }}>
      <ResourcesHero activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="section-divider" />
      <ResourcesTabs activeTab={activeTab} onTabChange={handleTabChange} />
      {activeTab === "media" ? (
        <MediaShowcase
          items={filteredItems}
          activeType={activeType}
          activeCategory={activeCategory}
          onTypeChange={setActiveType}
          onCategoryChange={setActiveCategory}
        />
      ) : (
        <DownloadsShowcase sections={downloads} />
      )}
    </div>
  );
}