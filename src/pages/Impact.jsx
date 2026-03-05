import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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
  const statsRef = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.2 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const total = useCountUp(1000000, 2500, started);
  const groups = useCountUp(500, 2000, started);
  const nationsCount = useCountUp(12, 1500, started);
  const challenges = useCountUp(50000, 2200, started);

  return (
    <div style={{ background: "#0B0F1A" }}>
      {/* HERO */}
      <section style={{ padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,207,255,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 50, padding: "8px 20px", marginBottom: 24 }}>
            <span className="glow-dot"></span>
            <span style={{ color: "#00CFFF", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Division Impact</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 20 }}>
            The Light Is <span className="glm-gradient-text">Spreading</span>
          </h1>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 620, margin: "0 auto" }}>
            Real numbers. Real lives. A movement growing across the 12 nations of the East-Central Africa Division — one switched-on soul at a time. <strong style={{ color: "#FFD000" }}>Faith. Always On.</strong>
          </p>
        </div>
      </section>

      <div className="section-divider" />

      {/* ANIMATED STATS */}
      <section ref={statsRef} style={{ padding: "80px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
          {[
            { value: total, suffix: "+", label: "Youth Mobilized", color: "#00CFFF" },
            { value: groups, suffix: "+", label: "GlowGroups Active", color: "#8A5CFF" },
            { value: nationsCount, suffix: "", label: "Nations Reached", color: "#FFD000" },
            { value: challenges, suffix: "+", label: "Challenges Done", color: "#1DA1FF" },
          ].map(stat => (
            <div key={stat.label} className="glm-card" style={{ textAlign: "center" }}>
              <div className="glm-headline" style={{ fontSize: 52, color: stat.color, lineHeight: 1 }}>
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div className="glm-body" style={{ fontSize: 15, marginTop: 8 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* GLOW MAP & NATIONS */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 16 }}>East-Central Africa Light Map</h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 56 }}>Visualizing the spread of faith across the division. Every marker is a switched-on community.</p>
          
          <style>{`
            .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 8px; }
            .leaflet-popup-tip { background: #121826; border: 1px solid rgba(0,207,255,0.4); }
          `}</style>
          
          <div style={{ 
            height: "550px", width: "100%", borderRadius: "24px", overflow: "hidden", 
            marginBottom: "64px", position: "relative", zIndex: 10,
            background: "#080C14",
            boxShadow: "0 0 40px rgba(0,207,255,0.15), inset 0 0 40px rgba(0,207,255,0.1)",
            border: "1px solid rgba(0,207,255,0.3)"
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(circle at center, transparent 40%, #0B0F1A 100%)",
              pointerEvents: "none", zIndex: 400
            }} />
            
            <MapContainer 
              center={[-1.286389, 34.817223]} 
              zoom={5.5} 
              scrollWheelZoom={false}
              zoomControl={false}
              style={{ height: "100%", width: "100%", background: "#0B0F1A" }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; CartoDB'
              />
              {mapLocations.flatMap((loc, i) => [
                <CircleMarker
                  key={`outer-${i}`}
                  center={loc.coordinates}
                  radius={Math.max(12, loc.members / 2500)}
                  pathOptions={{ color: "transparent", fillColor: loc.color, fillOpacity: 0.15 }}
                />,
                <CircleMarker
                  key={`inner-${i}`}
                  center={loc.coordinates}
                  radius={Math.max(4, loc.members / 8000)}
                  pathOptions={{ color: loc.color, fillColor: "#FFF", fillOpacity: 0.9, weight: 2 }}
                >
                  <Popup>
                    <div style={{ background: "rgba(18,24,38,0.95)", backdropFilter: "blur(10px)", padding: "16px", borderRadius: "12px", border: `1px solid ${loc.color}60`, color: "#FFF", minWidth: "180px", boxShadow: `0 8px 32px ${loc.color}20` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: loc.color, boxShadow: `0 0 10px ${loc.color}` }} />
                        <h4 className="glm-headline" style={{ fontSize: "16px", color: loc.color, margin: 0 }}>{loc.name}</h4>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px", marginBottom: "8px" }}>
                        <span className="glm-body" style={{ fontSize: "13px" }}>Members</span>
                        <strong style={{color:"#FFF", fontFamily: "Space Grotesk, sans-serif"}}>{loc.members.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="glm-body" style={{ fontSize: "13px" }}>GlowGroups</span>
                        <strong style={{color:"#FFF", fontFamily: "Space Grotesk, sans-serif"}}>{loc.groups}</strong>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ])}
            </MapContainer>
            
            {/* Map Legend Overlay */}
            <div style={{
              position: "absolute", bottom: "24px", right: "24px", zIndex: 500,
              background: "rgba(11,15,26,0.85)", backdropFilter: "blur(12px)",
              padding: "16px", borderRadius: "16px", border: "1px solid rgba(0,207,255,0.2)",
              display: "flex", flexDirection: "column", gap: "12px"
            }}>
              <h4 className="glm-headline" style={{ fontSize: "13px", color: "#C8D0E0", letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>Activity Level</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 10px #00CFFF" }} />
                <span className="glm-body" style={{ fontSize: "13px" }}>High Growth</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#FFD000", boxShadow: "0 0 10px #FFD000" }} />
                <span className="glm-body" style={{ fontSize: "13px" }}>Accelerating</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#8A5CFF", boxShadow: "0 0 10px #8A5CFF" }} />
                <span className="glm-body" style={{ fontSize: "13px" }}>Emerging</span>
              </div>
            </div>
          </div>

          <h3 className="glm-headline" style={{ fontSize: "28px", color: "#FFF", marginBottom: "32px" }}>Division Nations</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {nations.map(nation => (
              <div key={nation.name} className="glm-card" style={{ padding: 20, textAlign: "left", border: `1px solid ${nation.color}20` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{nation.flag}</div>
                <h3 className="glm-headline" style={{ fontSize: 16, color: "#FFFFFF", marginBottom: 6 }}>{nation.name}</h3>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="glm-body" style={{ fontSize: 12 }}>{nation.members.toLocaleString()}</span>
                  <span style={{ color: nation.color, fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>members</span>
                </div>
                <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${nation.color}, transparent)`, width: `${Math.min(100, (nation.members / 185000) * 100)}%` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* TESTIMONIES */}
      <section style={{ padding: "100px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 16 }}>
            Real <span className="glm-gold-text">Testimonies</span>
          </h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 56 }}>These are just a few of thousands of lights that have been switched on.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {testimonies.map(t => (
              <div key={t.name} className="glm-card" style={{ textAlign: "left", position: "relative" }}>
                <div style={{ fontSize: 40, color: t.color, marginBottom: 16, opacity: 0.6 }}>"</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "#E0E8F0", fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>{t.quote}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="glm-headline" style={{ fontSize: 16, color: "#FFFFFF" }}>{t.name}</div>
                    <div className="glm-body" style={{ fontSize: 13 }}>{t.location}</div>
                  </div>
                  <span style={{ background: `${t.color}15`, color: t.color, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 50, fontFamily: "Inter, sans-serif", border: `1px solid ${t.color}30` }}>{t.rank}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* CTA */}
      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <h2 className="glm-headline" style={{ fontSize: "clamp(28px, 4vw, 52px)", marginBottom: 24 }}>
          Add Your Light To <span className="glm-gradient-text">The Map</span>
        </h2>
        <p className="glm-body" style={{ fontSize: 17, maxWidth: 520, margin: "0 auto 40px" }}>
          Your country needs you. Your generation is waiting. Switch on and be counted.
        </p>
        <a href="/app/dashboard" className="glm-btn-primary animate-pulse-glow" style={{ fontSize: 18, padding: "16px 44px" }}>
          Join The Movement ⚡
        </a>
      </section>
    </div>
  );
}