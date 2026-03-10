import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Globe, Zap, Users } from "lucide-react";
import { useAppLanguage } from "../components/i18n/useAppLanguage";

const values = [
  { icon: "💡", title: "Visibility", desc: "We don't dim our witness. We switch it on. We post, share, testify, and speak up for Christ." },
  { icon: "💯", title: "Authenticity", desc: "We stay real with God, ourselves, and others. No fake faith. No filtered testimonies." },
  { icon: "🤝", title: "Community", desc: "Faith is stronger in fellowship. We disciple each other through GlowGroups and mentorship." },
  { icon: "🎨", title: "Creativity", desc: "We use memes, reels, art, and music to make the gospel beautiful and viral." },
  { icon: "🌱", title: "Discipleship", desc: "We are not satisfied with personal faith. We disciple others to shine too. Every GlowGroup multiplies." },
];

const team = [
  { name: "Communication", role: "Message Strategy & PR", initial: "C", color: "#00CFFF" },
  { name: "Media", role: "Creative Content & Branding", initial: "M", color: "#8A5CFF" },
  { name: "IT", role: "Digital Infrastructure", initial: "IT", color: "#FFD000" },
  { name: "Youth & Evangelism", role: "Mobilization & Reaping", initial: "Y", color: "#00CFFF" },
];

export default function About() {
  const { t, isRTL } = useAppLanguage("about");

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ background: "#0B0F1A" }}>
      {/* HERO */}
      <section id="faith-light" style={{ padding: "100px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,207,255,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 50, padding: "8px 20px", marginBottom: 32 }}>
            <span className="glow-dot"></span>
            <span style={{ color: "#00CFFF", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>{t("storyBadge")}</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(36px, 6vw, 72px)", marginBottom: 24, lineHeight: 1.1 }}>
            {t("heroTitleBefore")} <span className="glm-gradient-text">{t("heroTitleHighlight")}</span>
          </h1>
          <p className="glm-body" style={{ fontSize: 19, maxWidth: 680, margin: "0 auto 40px" }}>
            {t("heroText")} <span style={{ color: "#FFD000", fontStyle: "normal", fontWeight: 700 }}>Faith. Always On.</span>
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "#8A5CFF", fontSize: 16, letterSpacing: "0.05em" }}>
            "Let your light shine before others." — Matthew 5:16
          </p>
        </div>
      </section>

      <div className="section-divider" />

      {/* MISSION */}
      <section id="our-mission" style={{ padding: "100px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 60, alignItems: "center" }}>
          <div>
            <h2 className="glm-headline" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 24 }}>
              {t("missionTitle").split(" ")[0]} <span className="glm-gold-text">{t("missionTitle").split(" ").slice(1).join(" ")}</span>
            </h2>
            <p className="glm-body" style={{ fontSize: 17, marginBottom: 20 }}>
              {t("missionText1")}
            </p>
            <p className="glm-body" style={{ fontSize: 17, marginBottom: 32 }}>
              {t("missionText2")}
            </p>
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <div className="glm-headline" style={{ fontSize: 36, color: "#00CFFF" }}>1M+</div>
                <div className="glm-body" style={{ fontSize: 14 }}>{t("missionaries")}</div>
              </div>
              <div>
                <div className="glm-headline" style={{ fontSize: 36, color: "#FFD000" }}>10M+</div>
                <div className="glm-body" style={{ fontSize: 14 }}>{t("peersReached")}</div>
              </div>
              <div>
                <div className="glm-headline" style={{ fontSize: 36, color: "#8A5CFF" }}>12</div>
                <div className="glm-body" style={{ fontSize: 14 }}>{t("nations")}</div>
              </div>
            </div>
          </div>
          <div style={{ background: "#0B0F1A", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 20, padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔆</div>
            <h3 className="glm-headline" style={{ fontSize: 24, color: "#00CFFF", marginBottom: 16 }}>{t("vision")}</h3>
            <p className="glm-body" style={{ fontSize: 16, marginBottom: 20 }}>
              {t("visionText1")}
            </p>
            <p className="glm-body" style={{ fontSize: 16 }}>
              {t("visionText2")}
            </p>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* VALUES */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 16 }}>{t("coreValues")}</h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 56 }}>{t("coreValuesText")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {values.map(v => (
              <div key={v.title} className="glm-card" style={{ textAlign: "left" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{v.icon}</div>
                <h3 className="glm-headline" style={{ fontSize: 20, color: "#FFFFFF", marginBottom: 10 }}>{v.title}</h3>
                <p className="glm-body" style={{ fontSize: 15 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* THE DEPARTMENTS */}
      <section style={{ padding: "100px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 16 }}>
            {t("partnersTitle").split(" ").slice(0, -1).join(" ")} <span className="glm-gold-text">{t("partnersTitle").split(" ").slice(-1)}</span>
          </h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 56 }}>{t("partnersText")}</p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {team.map(member => (
              <div key={member.name} className="glm-card" style={{ flex: "1 1 200px", maxWidth: 240, textAlign: "center" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${member.color}40, ${member.color}20)`,
                  border: `2px solid ${member.color}60`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: 28, fontWeight: 800, color: member.color,
                  fontFamily: "Space Grotesk, sans-serif",
                  boxShadow: `0 0 20px ${member.color}30`,
                }}>
                  {member.initial}
                </div>
                <h3 className="glm-headline" style={{ fontSize: 17, color: "#FFFFFF", marginBottom: 6 }}>{member.name}</h3>
                <p className="glm-body" style={{ fontSize: 13, color: member.color }}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* CTA */}
      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <h2 className="glm-headline" style={{ fontSize: "clamp(28px, 4vw, 52px)", marginBottom: 24 }}>
          {t("storyTitle").split(" ").slice(0, -1).join(" ")} <span className="glm-gradient-text">{t("storyTitle").split(" ").slice(-1)}</span>
          </h2>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 520, margin: "0 auto 40px" }}>
          {t("storyText")}
          </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/app/dashboard" className="glm-btn-primary" style={{ fontSize: 17 }}>{t("storyBadge") === "Our Story" ? "Join Now ⚡" : t("storyBadge") === "Hadithi Yetu" ? "Jiunge Sasa ⚡" : t("storyBadge") === "قصتنا" ? "انضم الآن ⚡" : t("storyBadge") === "Nossa História" ? "Participe Agora ⚡" : "Wegatteko Kati ⚡"}</a>
          <Link to={createPageUrl("Challenges")} className="glm-btn-secondary" style={{ fontSize: 17 }}>{t("seeChallenges")}</Link>
          <a id="our-mission" style={{ display: "none" }}></a>
        </div>
      </section>
    </div>
  );
}