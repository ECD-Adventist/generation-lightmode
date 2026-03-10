import { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Sparkles, Users, Globe2, Radio, Shield, Smartphone } from "lucide-react";
import { useAppLanguage } from "../components/i18n/useAppLanguage";

const values = [
  {
    icon: Shield,
    title: "Visibility",
    desc: "We do not dim our witness. We switch it on through testimony, courage, and visible faith.",
    color: "#00CFFF",
  },
  {
    icon: Sparkles,
    title: "Authenticity",
    desc: "We keep faith honest, human, and real — no performance, no pretending, no hiding.",
    color: "#8A5CFF",
  },
  {
    icon: Users,
    title: "Community",
    desc: "We grow through GlowGroups, shared prayer, accountability, and discipleship together.",
    color: "#FFD000",
  },
  {
    icon: Smartphone,
    title: "Digital Mission",
    desc: "We use screens, stories, media, and culture to make the light of Christ impossible to ignore.",
    color: "#1DA1FF",
  },
];

const impactStats = [
  { value: "1M+", labelKey: "missionaries", color: "#00CFFF" },
  { value: "10M+", labelKey: "peersReached", color: "#FFD000" },
  { value: "12", labelKey: "nations", color: "#8A5CFF" },
];

const partners = [
  { name: "Communication", role: "Message Strategy & PR", color: "#00CFFF" },
  { name: "Media", role: "Creative Content & Branding", color: "#8A5CFF" },
  { name: "IT", role: "Digital Infrastructure", color: "#FFD000" },
  { name: "Youth & Evangelism", role: "Mobilization & Reaping", color: "#1DA1FF" },
];

export default function About() {
  const { t, isRTL, language } = useAppLanguage("about");

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  const joinNowText = {
    en: "Join Now ⚡",
    sw: "Jiunge Sasa ⚡",
    fr: "Rejoindre maintenant ⚡",
    ln: "Kota sik’oyo ⚡",
    rw: "Jyamo nonaha ⚡",
    ar: "انضم الآن ⚡",
    am: "አሁን ተቀላቀል ⚡",
    rn: "Injira ubu ⚡",
    pt: "Participe Agora ⚡",
    so: "Ku biir hadda ⚡",
    ti: "ሕጂ ተጸምብር ⚡",
    nus: "Bɔth thin ⚡",
    lg: "Wegatteko Kati ⚡",
  }[language] || "Join Now ⚡";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ background: "#0B0F1A" }}>
      <section id="faith-light" style={{ padding: "92px 24px 72px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 20%, rgba(0,207,255,0.08), transparent 30%), radial-gradient(circle at 80% 15%, rgba(138,92,255,0.12), transparent 26%)" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 36, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.26)", borderRadius: 999, padding: "8px 16px", marginBottom: 22 }}>
              <span className="glow-dot"></span>
              <span style={{ color: "#00CFFF", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>{t("storyBadge")}</span>
            </div>
            <h1 className="glm-headline" style={{ fontSize: "clamp(38px, 6vw, 78px)", lineHeight: 1.02, marginBottom: 18 }}>
              {t("heroTitleBefore")} <span className="glm-gradient-text">{t("heroTitleHighlight")}</span>
            </h1>
            <p className="glm-body" style={{ fontSize: 18, maxWidth: 650, marginBottom: 22 }}>
              {t("heroText")} <strong style={{ color: "#FFD000" }}>Faith. Always On.</strong>
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "#8A5CFF", fontSize: 15, marginBottom: 30 }}>
              "Let your light shine before others." — Matthew 5:16
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/app/dashboard" className="glm-btn-primary">{joinNowText}</a>
              <Link to={createPageUrl("Challenges")} className="glm-btn-secondary">{t("seeChallenges")}</Link>
            </div>
          </div>

          <div style={{ position: "relative", minHeight: 500 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 30, overflow: "hidden", border: "1px solid rgba(0,207,255,0.2)", boxShadow: "0 0 40px rgba(0,207,255,0.12)" }}>
              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80"
                alt="Young believers together"
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.1), rgba(11,15,26,0.85))" }} />
            </div>
            <div style={{ position: "absolute", left: 24, right: 24, bottom: 24 }}>
              <div className="glm-card" style={{ background: "rgba(8,12,20,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.1)", padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
                  {impactStats.map((stat) => (
                    <div key={stat.labelKey}>
                      <div className="glm-headline" style={{ fontSize: 32, color: stat.color, marginBottom: 6 }}>{stat.value}</div>
                      <div className="glm-body" style={{ fontSize: 13 }}>{t(stat.labelKey)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section id="our-mission" style={{ padding: "88px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28, alignItems: "stretch" }}>
          <div className="glm-card" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.06), rgba(11,15,26,0.98))", border: "1px solid rgba(0,207,255,0.18)", padding: 34 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <Radio size={16} color="#00CFFF" />
              <span style={{ color: "#00CFFF", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{t("missionTitle")}</span>
            </div>
            <h2 className="glm-headline" style={{ fontSize: "clamp(30px, 4vw, 50px)", marginBottom: 18 }}>
              A Digital Movement Built For <span className="glm-gold-text">This Generation</span>
            </h2>
            <p className="glm-body" style={{ fontSize: 17, marginBottom: 18 }}>{t("missionText1")}</p>
            <p className="glm-body" style={{ fontSize: 17 }}>{t("missionText2")}</p>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div className="glm-card" style={{ background: "#0B0F1A", border: "1px solid rgba(255,208,0,0.18)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Globe2 size={18} color="#FFD000" />
                <h3 className="glm-headline" style={{ fontSize: 24, color: "#FFD000" }}>{t("vision")}</h3>
              </div>
              <p className="glm-body" style={{ fontSize: 16, marginBottom: 14 }}>{t("visionText1")}</p>
              <p className="glm-body" style={{ fontSize: 16 }}>{t("visionText2")}</p>
            </div>
            <div className="glm-card" style={{ background: "linear-gradient(135deg, rgba(138,92,255,0.14), rgba(11,15,26,0.98))", border: "1px solid rgba(138,92,255,0.2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
                {impactStats.map((stat) => (
                  <div key={stat.labelKey}>
                    <div className="glm-headline" style={{ fontSize: 30, color: stat.color }}>{stat.value}</div>
                    <div className="glm-body" style={{ fontSize: 12 }}>{t(stat.labelKey)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section style={{ padding: "88px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 46 }}>
            <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(30px, 4vw, 52px)", marginBottom: 14 }}>{t("coreValues")}</h2>
            <p className="glm-body" style={{ fontSize: 17, maxWidth: 700, margin: "0 auto" }}>{t("coreValuesText")}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 22 }}>
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="glm-card" style={{ background: "#101625", border: `1px solid ${item.color}22`, padding: 28 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: `${item.color}14`, border: `1px solid ${item.color}33`, marginBottom: 18 }}>
                    <Icon size={24} color={item.color} />
                  </div>
                  <h3 className="glm-headline" style={{ fontSize: 20, color: "#FFFFFF", marginBottom: 10 }}>{item.title}</h3>
                  <p className="glm-body" style={{ fontSize: 15 }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section style={{ padding: "88px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 42 }}>
            <h2 className="glm-headline" style={{ fontSize: "clamp(30px, 4vw, 52px)", marginBottom: 14 }}>
              {t("partnersTitle").split(" ").slice(0, -1).join(" ")} <span className="glm-gold-text">{t("partnersTitle").split(" ").slice(-1)}</span>
            </h2>
            <p className="glm-body" style={{ fontSize: 17, maxWidth: 720, margin: "0 auto" }}>{t("partnersText")}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {partners.map((partner) => (
              <div key={partner.name} className="glm-card" style={{ textAlign: "left", border: `1px solid ${partner.color}24`, background: "#0B0F1A" }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: `${partner.color}16`, color: partner.color, fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 16 }}>
                  {partner.name === "Youth & Evangelism" ? "Y" : partner.name === "Communication" ? "C" : partner.name === "Media" ? "M" : "IT"}
                </div>
                <h3 className="glm-headline" style={{ fontSize: 18, color: "#FFFFFF", marginBottom: 8 }}>{partner.name}</h3>
                <p className="glm-body" style={{ fontSize: 14, color: partner.color }}>{partner.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section style={{ padding: "100px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, rgba(0,207,255,0.08), transparent 40%)" }} />
        <div style={{ maxWidth: 850, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 className="glm-headline" style={{ fontSize: "clamp(34px, 5vw, 62px)", marginBottom: 18 }}>
            {t("storyTitle").split(" ").slice(0, -1).join(" ")} <span className="glm-gradient-text">{t("storyTitle").split(" ").slice(-1)}</span>
          </h2>
          <p className="glm-body" style={{ fontSize: 18, maxWidth: 620, margin: "0 auto 34px" }}>{t("storyText")}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <a href="/app/dashboard" className="glm-btn-primary">{joinNowText}</a>
            <Link to={createPageUrl("Challenges")} className="glm-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {t("seeChallenges")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}