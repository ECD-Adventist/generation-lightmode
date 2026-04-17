import React, { useEffect } from "react";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";
import { useAppLanguage } from "../components/i18n/useAppLanguage";
import AboutHero from "../components/about/AboutHero";
import AboutMission from "../components/about/AboutMission";
import AboutVision from "../components/about/AboutVision";
import AboutValues from "../components/about/AboutValues";
import AboutPartners from "../components/about/AboutPartners";
import AboutTeam from "../components/about/AboutTeam";
import AboutStory from "../components/about/AboutStory";
import AboutCTA from "../components/about/AboutCTA";

export default function About() {
  const { t, isRTL, language } = useAppLanguage("about");
  const { data: snapshot } = usePublicCommunitySnapshot();

  const liveImpactStats = [
    { value: snapshot?.totalUsers || 0, label: "Public Members", color: "#00CFFF" },
    { value: snapshot?.totalDrops || 0, label: "Glow Drops", color: "#FFD000" },
    { value: snapshot?.totalCountries || 0, label: "Countries", color: "#8A5CFF" },
  ];

  const joinNowText = {
    en: "Join Now ⚡", sw: "Jiunge Sasa ⚡", fr: "Rejoindre ⚡",
    ln: "Kota sik'oyo ⚡", rw: "Jyamo nonaha ⚡", ar: "انضم الآن ⚡",
    am: "አሁን ተቀላቀል ⚡", rn: "Injira ubu ⚡", pt: "Participe ⚡",
    so: "Ku biir hadda ⚡", ti: "ሕጂ ተጸምብር ⚡", nus: "Bɔth thin ⚡", lg: "Wegatteko Kati ⚡",
  }[language] || "Join Now ⚡";

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ background: "#0B0F1A" }}>
      <AboutHero t={t} joinNowText={joinNowText} />

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.3), transparent)" }} />

      <AboutMission t={t} liveImpactStats={liveImpactStats} />

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.3), transparent)" }} />

      <AboutStory />

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.3), transparent)" }} />

      <AboutVision t={t} />

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.3), transparent)" }} />

      <AboutValues t={t} />

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.3), transparent)" }} />

      <AboutPartners t={t} />

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(138,92,255,0.3), transparent)" }} />

      <AboutTeam />

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.3), transparent)" }} />

      <AboutCTA t={t} joinNowText={joinNowText} />
    </div>
  );
}