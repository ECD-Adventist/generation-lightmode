import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Globe, Users, Star, ChevronDown, Play } from "lucide-react";

function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, icon: Icon, color, started }) {
  const num = useCountUp(value, 2200, started);
  return (
    <div className="glm-card" style={{ textAlign: "center", flex: "1 1 180px" }}>
      <div style={{ fontSize: 36, marginBottom: 8, filter: `drop-shadow(0 0 12px ${color})` }}>{Icon && <Icon size={36} color={color} style={{ margin: "0 auto" }} />}</div>
      <div className="glm-headline" style={{ fontSize: 42, color }}>
        {num.toLocaleString()}{suffix}
      </div>
      <div className="glm-body" style={{ fontSize: 14, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function Home() {
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: "#0B0F1A" }}>
      {/* HERO */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background video */}
        <video
          autoPlay muted loop playsInline
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.6, pointerEvents: "none",
          }}
        >
          {/* Dark abandoned house/room video */}
          <source src="https://videos.pexels.com/video-files/6981410/6981410-uhd_2560_1440_25fps.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(11,15,26,0.65) 0%, rgba(11,15,26,0.45) 50%, rgba(11,15,26,0.95) 100%)",
          pointerEvents: "none",
        }} />

        {/* Glow orbs on top of video */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,207,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Tagline badge */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.4)",
          borderRadius: 50, padding: "8px 20px", marginBottom: 32,
          backdropFilter: "blur(8px)",
        }}>
          <span className="glow-dot"></span>
          <span style={{ color: "#00CFFF", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
            The Movement Has Begun
          </span>
        </div>

        {/* Logo — GIGANTIC */}
        <div style={{ position: "relative", zIndex: 2, marginBottom: 40 }}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_692b64307296ee339e64b660/c20e0f05a_GENERATIONLIGHTMODE-LOGO.png"
            alt="Generation LightMode"
            style={{ height: "clamp(400px, 60vw, 800px)", width: "auto", filter: "drop-shadow(0 0 80px rgba(0,207,255,1)) drop-shadow(0 0 160px rgba(255,208,0,0.6))" }}
          />
        </div>

        <h1 className="glm-headline" style={{ position: "relative", zIndex: 2, fontSize: "clamp(30px, 5.5vw, 68px)", lineHeight: 1.1, marginBottom: 24, maxWidth: 900 }}>
          Your Faith Is The{" "}
          <span className="glm-gradient-text">Switch</span>
          <br />The World Is Waiting For
        </h1>

        <p className="glm-body" style={{ position: "relative", zIndex: 2, fontSize: "clamp(16px, 2vw, 20px)", maxWidth: 680, marginBottom: 24, color: "#E0E8F0" }}>
          Join 1M+ young believers turning hidden faith into visible light — across the nations of the East-Central Africa Division.
        </p>

        {/* Slogan */}
        <p style={{ position: "relative", zIndex: 2, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: "#FFD000", fontSize: 18, marginBottom: 16, letterSpacing: "0.08em", textShadow: "0 0 20px rgba(255,208,0,0.5)" }}>
          ⚡ Faith. Always On.
        </p>

        {/* Bible verse */}
        <p style={{ position: "relative", zIndex: 2, fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "#8A5CFF", fontSize: 15, marginBottom: 48, letterSpacing: "0.05em" }}>
          "You are the light of the world." — Matthew 5:14
        </p>

        <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/app/dashboard" className="glm-btn-primary" style={{ fontSize: 18, padding: "16px 40px" }}>
            Switch On ⚡
          </a>
          <Link to={createPageUrl("About")} className="glm-btn-secondary" style={{ fontSize: 18, padding: "16px 40px" }}>
            Our Story
          </Link>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", animation: "float 2s ease-in-out infinite", zIndex: 2 }}>
          <ChevronDown size={28} color="rgba(0,207,255,0.5)" />
        </div>
      </section>

      <div className="section-divider" />

      {/* STATS */}
      <section ref={statsRef} style={{ padding: "80px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
              The Light Is Spreading
            </h2>
            <p className="glm-body" style={{ marginTop: 12, fontSize: 17 }}>Real impact. Real people. Real faith.</p>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            <StatCard value={1000000} suffix="+" label="Youth Mobilized" icon={Users} color="#00CFFF" started={statsVisible} />
            <StatCard value={12} suffix="" label="ECD Nations" icon={Globe} color="#FFD000" started={statsVisible} />
            <StatCard value={50000} suffix="+" label="Challenges Completed" icon={Zap} color="#8A5CFF" started={statsVisible} />
            <StatCard value={500} suffix="+" label="GlowGroups Active" icon={Star} color="#00CFFF" started={statsVisible} />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* WHAT IS LIGHTMODE */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 50, padding: "6px 16px", marginBottom: 24 }}>
              <Zap size={14} color="#FFD000" />
              <span style={{ color: "#FFD000", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>THE MOVEMENT</span>
            </div>
            <h2 className="glm-headline" style={{ fontSize: "clamp(28px, 4vw, 52px)", lineHeight: 1.15, marginBottom: 24 }}>
              What Is{" "}
              <span className="glm-gold-text">LightMode?</span>
            </h2>
            <p className="glm-body" style={{ fontSize: 17, marginBottom: 20 }}>
              Generation LightMode is a global faith-based digital movement — mobilizing the next generation to live their faith openly, boldly, and publicly.
            </p>
            <p className="glm-body" style={{ fontSize: 17, marginBottom: 32 }}>
              We believe faith is not meant to be hidden. It's meant to illuminate. Every challenge completed, every testimony shared, every group formed — is a light switched on.
            </p>
            <Link to={createPageUrl("About")} className="glm-btn-secondary">
              Learn More →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { icon: "⚡", title: "Daily Challenges", desc: "Faith-activating missions" },
              { icon: "👥", title: "GlowGroups", desc: "Community accountability" },
              { icon: "🌍", title: "East-Central Africa", desc: "ECD nations, one glow" },
              { icon: "🏆", title: "Rank System", desc: "Grow from Starter to Champion" },
            ].map(item => (
              <div key={item.title} className="glm-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
                <h3 className="glm-headline" style={{ fontSize: 16, color: "#FFFFFF", marginBottom: 6 }}>{item.title}</h3>
                <p className="glm-body" style={{ fontSize: 13 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* RANKS */}
      <section style={{ padding: "100px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 16 }}>
            Your Glow Rank
          </h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 56, maxWidth: 600, margin: "0 auto 56px" }}>
            Every step of faith levels you up. Where are you on the journey?
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { rank: "Glow Starter", color: "#00CFFF", icon: "💡", desc: "Begin your journey" },
              { rank: "Light Warrior", color: "#1DA1FF", icon: "⚔️", desc: "Fight for the light" },
              { rank: "Trendsetter", color: "#8A5CFF", icon: "🌟", desc: "Inspire the world" },
              { rank: "Glow Champion", color: "#FFD000", icon: "🏆", desc: "Lead the movement" },
            ].map(item => (
              <div key={item.rank} className="glm-card" style={{ flex: "1 1 200px", maxWidth: 240, border: `1px solid ${item.color}40`, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{item.icon}</div>
                <h3 className="glm-headline" style={{ fontSize: 18, color: item.color, marginBottom: 8 }}>{item.rank}</h3>
                <p className="glm-body" style={{ fontSize: 14 }}>{item.desc}</p>
                <div style={{ marginTop: 16, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${item.color}, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* CTA */}
      <section id="join" style={{ padding: "120px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(138,92,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🔆</div>
          <h2 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 24 }}>
            Are You Ready To{" "}
            <span className="glm-gradient-text">Switch On?</span>
          </h2>
          <p className="glm-body" style={{ fontSize: 18, maxWidth: 560, margin: "0 auto 48px" }}>
            The world needs your light. Don't keep it hidden. Join Generation LightMode today and be part of the greatest faith movement of your generation.
          </p>
          <a href="/app/dashboard" className="glm-btn-primary animate-pulse-glow" style={{ fontSize: 20, padding: "18px 52px" }}>
            Join The Movement ⚡
          </a>
          <p style={{ color: "#C8D0E0", fontSize: 14, marginTop: 20, fontFamily: "Inter, sans-serif" }}>
            Free to join · No credit card required · Start today
          </p>
        </div>
      </section>
    </div>
  );
}