import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ResourcesHero from "../components/resources/ResourcesHero";
import ResourcesTabs from "../components/resources/ResourcesTabs";
import MediaShowcase from "../components/resources/MediaShowcase";
import DownloadsShowcase from "../components/resources/DownloadsShowcase";
import { downloads, mediaItems } from "../components/resources/resourcesData";
import CodesShowcase from "../components/resources/CodesShowcase";

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
  const [activeTab, setActiveTab] = useState("media");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab") || "media";
    if (["media", "downloads", "keeping-it-100", "codes-of-truth"].includes(tab)) {
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

  return (
    <div style={{ background: "#0B0F1A" }}>
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/f58fb7f4b_LOGO02ALL.png"
              alt="LightMode"
              style={{ height: 56, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Globe className="w-4 h-4" /><span className="hidden sm:inline">Reach</span>
            </Link>
            <Link to={createPageUrl("Notifications")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Bell className="w-4 h-4" /><span className="hidden sm:inline">Alerts</span>
            </Link>
            <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
            </Link>
            <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-sm font-medium border border-white/5">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </div>
        </div>
      </div>

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