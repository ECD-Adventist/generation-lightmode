import { useEffect, useRef, useState } from "react";

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

const nations = [
  { name: "Nigeria", flag: "🇳🇬", members: 185000, groups: 94, color: "#00CFFF" },
  { name: "United States", flag: "🇺🇸", members: 142000, groups: 78, color: "#FFD000" },
  { name: "Kenya", flag: "🇰🇪", members: 98000, groups: 52, color: "#8A5CFF" },
  { name: "Philippines", flag: "🇵🇭", members: 87000, groups: 43, color: "#00CFFF" },
  { name: "United Kingdom", flag: "🇬🇧", members: 76000, groups: 38, color: "#1DA1FF" },
  { name: "Brazil", flag: "🇧🇷", members: 65000, groups: 31, color: "#8A5CFF" },
  { name: "Ghana", flag: "🇬🇭", members: 54000, groups: 27, color: "#FFD000" },
  { name: "South Africa", flag: "🇿🇦", members: 48000, groups: 24, color: "#00CFFF" },
  { name: "India", flag: "🇮🇳", members: 43000, groups: 22, color: "#8A5CFF" },
  { name: "Australia", flag: "🇦🇺", members: 36000, groups: 18, color: "#1DA1FF" },
  { name: "Canada", flag: "🇨🇦", members: 32000, groups: 15, color: "#FFD000" },
  { name: "Germany", flag: "🇩🇪", members: 28000, groups: 13, color: "#00CFFF" },
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
  const nations = useCountUp(12, 1500, started);
  const challenges = useCountUp(50000, 2200, started);

  return (
    <div style={{ background: "#0B0F1A" }}>
      {/* HERO */}
      <section style={{ padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,207,255,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 50, padding: "8px 20px", marginBottom: 24 }}>
            <span className="glow-dot"></span>
            <span style={{ color: "#00CFFF", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Global Impact</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 20 }}>
            The Light Is <span className="glm-gradient-text">Everywhere</span>
          </h1>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 620, margin: "0 auto" }}>
            Real numbers. Real lives. A movement growing across the East-Central Africa Division — one switched-on soul at a time. <strong style={{ color: "#FFD000" }}>Faith. Always On.</strong>
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
            { value: nations, suffix: "", label: "Nations Reached", color: "#FFD000" },
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

      {/* NATIONS */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 16 }}>12 Nations. One Light.</h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 56 }}>Every flag represents thousands of young believers choosing to glow.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { name: "Nigeria", flag: "🇳🇬", members: 185000, color: "#00CFFF" },
              { name: "United States", flag: "🇺🇸", members: 142000, color: "#FFD000" },
              { name: "Kenya", flag: "🇰🇪", members: 98000, color: "#8A5CFF" },
              { name: "Philippines", flag: "🇵🇭", members: 87000, color: "#00CFFF" },
              { name: "United Kingdom", flag: "🇬🇧", members: 76000, color: "#1DA1FF" },
              { name: "Brazil", flag: "🇧🇷", members: 65000, color: "#8A5CFF" },
              { name: "Ghana", flag: "🇬🇭", members: 54000, color: "#FFD000" },
              { name: "South Africa", flag: "🇿🇦", members: 48000, color: "#00CFFF" },
              { name: "India", flag: "🇮🇳", members: 43000, color: "#8A5CFF" },
              { name: "Australia", flag: "🇦🇺", members: 36000, color: "#1DA1FF" },
              { name: "Canada", flag: "🇨🇦", members: 32000, color: "#FFD000" },
              { name: "Germany", flag: "🇩🇪", members: 28000, color: "#00CFFF" },
            ].map(nation => (
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