import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const TAB_PAGES = {
  Feed: ["Feed", "GlowFeed", "Post"],
  Discover: ["Discover"],
  Messages: ["Messages"],
  Profile: ["Profile"],
};

const tabKeyForPage = (pageName) => Object.keys(TAB_PAGES).find(key => TAB_PAGES[key].includes(pageName));
const storageKey = key => `mobile_tab_route_${key}`;

export default function useMobileTabNavigation(currentPageName) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = tabKeyForPage(currentPageName);
  const currentUrl = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (activeTab) sessionStorage.setItem(storageKey(activeTab), currentUrl);
  }, [activeTab, currentUrl]);

  const targetFor = useCallback((key) => {
    return sessionStorage.getItem(storageKey(key)) || `/${key}`;
  }, []);

  const switchTab = useCallback((key) => {
    if (key === activeTab) return;
    if (activeTab) sessionStorage.setItem(storageKey(activeTab), currentUrl);
    sessionStorage.setItem("tab_switch", "true");
    navigate(targetFor(key));
  }, [activeTab, currentUrl, navigate, targetFor]);

  return { activeTab, switchTab, targetFor };
}