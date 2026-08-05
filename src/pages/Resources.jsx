import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ResourcesHero from "../components/resources/ResourcesHero";
import ResourcesTabs from "../components/resources/ResourcesTabs";
import MediaShowcase from "../components/resources/MediaShowcase";
import DownloadsShowcase from "../components/resources/DownloadsShowcase";
import { downloads, mediaItems } from "../components/resources/resourcesData";
import CodesShowcase from "../components/resources/CodesShowcase";
import MobileResources from "../components/resources/MobileResources";
import ContentHubPromo from "../components/resources/ContentHubPromo";
import { useIsMobile } from "@/hooks/use-mobile";

const KEEPING_IT_100_CATEGORIES = [
  "Sexuality & Purity", "Self-Control", "Sanctity of Life", "Gambling & Stewardship", 
  "Education & Career", "Entrepreneurship", "Marriage & Courtship", "Peer Pressure", 
  "Spiritual Warfare", "Friendship", "Alcohol", "Entertainment", "Social Media", 
  "Modesty", "Music & Media", "Integrity", "Speech & Gossip"
];

const CODES_OF_TRUTH_CATEGORIES = [
  "Identity", "Faith", "Purpose", "Action", "Truth"
];

export default function Resources() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("media");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab") || "media";
    if (["media", "downloads", "keeping-it-100", "codes-of-truth", "content-hub"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const nextUrl = `${location.pathname}${tab === "media" ? "" : `?tab=${tab}`}`;
    window.history.replaceState({}, "", nextUrl);
  };

  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      const catMatch = activeCategory === "all" || item.category === activeCategory;
      const typeMatch = activeType === "all" || item.type === activeType;
      return catMatch && typeMatch;
    });
  }, [activeCategory, activeType]);

  if (isMobile) {
    return <MobileResources activeTab={activeTab} onTabChange={handleTabChange} />;
  }

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
      ) : activeTab === "downloads" ? (
        <DownloadsShowcase sections={downloads} />
      ) : activeTab === "content-hub" ? (
        <ContentHubPromo />
      ) : activeTab === "keeping-it-100" ? (
        <CodesShowcase 
          sourceDocument="keeping_it_100" 
          title="Keeping It 100" 
          description="Short truth slogans to share on social media daily. Stand out, don't blend in."
          categories={KEEPING_IT_100_CATEGORIES}
        />
      ) : (
        <CodesShowcase 
          sourceDocument="codes_of_truth" 
          title="Key Codes of Truth" 
          description="Fundamental truths to guide your daily walk. Share the light."
          categories={CODES_OF_TRUTH_CATEGORIES}
        />
      )}
    </div>
  );
}