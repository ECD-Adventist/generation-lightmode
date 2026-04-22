import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import LiveImpactPage from "@/components/impact/LiveImpactPage";
import MobileImpact from "@/components/impact/MobileImpact";
import { useIsMobile } from "@/hooks/use-mobile";

function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const mapLocations = [
  { name: "Nairobi, Kenya", coordinates: [-1.286389, 36.817223], members: 85000, groups: 120, color: "#00CFFF" },
  { name: "Kampala, Uganda", coordinates: [0.347596, 32.582520], members: 62000, groups: 85, color: "#FFD000" },
  { name: "Dar es Salaam, Tanzania", coordinates: [-6.792354, 39.208328], members: 58000, groups: 72, color: "#8A5CFF" },
  { name: "Kigali, Rwanda", coordinates: [-1.944073, 30.061886], members: 45000, groups: 55, color: "#00CFFF" },
  { name: "Bujumbura, Burundi", coordinates: [-3.382200, 29.364400], members: 32000, groups: 40, color: "#FFD000" },
  { name: "Addis Ababa, Ethiopia", coordinates: [9.005401, 38.763611], members: 42000, groups: 60, color: "#8A5CFF" },
  { name: "Juba, South Sudan", coordinates: [4.851656, 31.582470], members: 18000, groups: 22, color: "#00CFFF" },
  { name: "Kinshasa, DRC", coordinates: [-4.441931, 15.266293], members: 68000, groups: 95, color: "#FFD000" },
  { name: "Mombasa, Kenya", coordinates: [-4.043477, 39.668205], members: 22000, groups: 30, color: "#8A5CFF" },
  { name: "Entebbe, Uganda", coordinates: [0.051184, 32.463708], members: 15000, groups: 18, color: "#00CFFF" },
];

const nations = [
  { name: "Kenya", flag: "🇰🇪", members: 185000, groups: 250, color: "#00CFFF" },
  { name: "Tanzania", flag: "🇹🇿", members: 142000, groups: 180, color: "#FFD000" },
  { name: "Uganda", flag: "🇺🇬", members: 98000, groups: 120, color: "#8A5CFF" },
  { name: "DR Congo", flag: "🇨🇩", members: 87000, groups: 110, color: "#00CFFF" },
  { name: "Rwanda", flag: "🇷🇼", members: 76000, groups: 90, color: "#1DA1FF" },
  { name: "Burundi", flag: "🇧🇮", members: 65000, groups: 75, color: "#8A5CFF" },
  { name: "Ethiopia", flag: "🇪🇹", members: 54000, groups: 65, color: "#FFD000" },
  { name: "South Sudan", flag: "🇸🇸", members: 48000, groups: 50, color: "#00CFFF" },
  { name: "Somalia", flag: "🇸🇴", members: 43000, groups: 40, color: "#8A5CFF" },
  { name: "Djibouti", flag: "🇩🇯", members: 36000, groups: 35, color: "#1DA1FF" },
  { name: "Eritrea", flag: "🇪🇷", members: 32000, groups: 25, color: "#FFD000" },
  { name: "Sudan", flag: "🇸🇩", members: 28000, groups: 20, color: "#1DA1FF" },
];

const testimonies = [
  { name: "Chidinma A.", location: "Lagos, Nigeria", quote: "LightMode gave me the courage to share my faith on campus. Now I lead a GlowGroup of 30 students!", rank: "Trendsetter", color: "#8A5CFF" },
  { name: "Jordan M.", location: "Dallas, USA", quote: "The 7 Days of Light challenge literally transformed my social media. My faith is now visible and I've never felt more alive.", rank: "Light Warrior", color: "#1DA1FF" },
  { name: "Aisha K.", location: "Nairobi, Kenya", quote: "I thought faith was private. LightMode showed me that my light was meant to be seen. I now lead 40+ young believers.", rank: "Glow Champion", color: "#FFD000" },
];

export default function Impact() {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileImpact />;
  return <LiveImpactPage />;
}