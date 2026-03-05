import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Globe, Zap, Users } from "lucide-react";

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
  return (
    <div style={{ background: "#0B0F1A" }}>
      {/* HERO */}
      <section id="faith-into-light" style={{ padding: "100px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,207,255,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 50, padding: "8px 20px", marginBottom: 32 }}>
            <span className="glow-dot"></span>
            <span style={{ color: "#00CFFF", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Our Story</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(36px, 6vw, 72px)", marginBottom: 24, lineHeight: 1.1 }}>
            Faith Turned Into <span className="glm-gradient-text">Light</span>
          </h1>
          <p className="glm-body" style={{ fontSize: 19, maxWidth: 680, margin: "0 auto 40px" }}>
            Generation LightMode was born from a simple belief — that the world changes when young believers stop hiding their faith and start living it out loud. <span style={{ color: "#FFD000", fontStyle: "normal", fontWeight: 700 }}>Faith. Always On.</span>
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "#8A5CFF", fontSize: 16, letterSpacing: "0.05em" }}>
            "Let your light shine before others." — Matthew 5:16
          </p>
        </div>
      </section>

      <div className="section-divider" />

      {/* MISSION */}
      <section style={{ padding: "100px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 60, alignItems: "center" }}>
          <div>
            <h2 className="glm-headline" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 24 }}>
              Our <span className="glm-gold-text">Mission</span>
            </h2>
            <p className="glm-body" style={{ fontSize: 17, marginBottom: 20 }}>
              To mobilize 1,000,000 Adventist young people in the 12 nations of the ECD to shine boldly in LightMode, each reaching at least 10 youth without the Adventist faith. Together, this will impact 10,000,000 young people.
            </p>
            <p className="glm-body" style={{ fontSize: 17, marginBottom: 32 }}>
              We create digital campaigns, faith challenges, accountability communities, and a global platform where young people discover that their faith is the most powerful force in their generation.
            </p>
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <div className="glm-headline" style={{ fontSize: 36, color: "#00CFFF" }}>1M+</div>
                <div className="glm-body" style={{ fontSize: 14 }}>Missionaries</div>
              </div>
              <div>
                <div className="glm-headline" style={{ fontSize: 36, color: "#FFD000" }}>10M+</div>
                <div className="glm-body" style={{ fontSize: 14 }}>Peers Reached</div>
              </div>
              <div>
                <div className="glm-headline" style={{ fontSize: 36, color: "#8A5CFF" }}>12</div>
                <div className="glm-body" style={{ fontSize: 14 }}>ECD Nations</div>
              </div>
            </div>
          </div>
          <div style={{ background: "#0B0F1A", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 20, padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔆</div>
            <h3 className="glm-headline" style={{ fontSize: 24, color: "#00CFFF", marginBottom: 16 }}>The Vision</h3>
            <p className="glm-body" style={{ fontSize: 16, marginBottom: 20 }}>
              A world where the next generation is known not for their silence — but for their light.
            </p>
            <p className="glm-body" style={{ fontSize: 16 }}>
              Where faith communities thrive online. Where challenges go viral for God. Where youth lead from the front, not the shadows.
            </p>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* VALUES */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 16 }}>Our Core Values</h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 56 }}>What we believe, how we operate, and why we exist.</p>
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
            Partners in <span className="glm-gold-text">Mission</span>
          </h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 56 }}>Collaboration across departments to drive the digital vision.</p>
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
          Be Part Of The <span className="glm-gradient-text">Story</span>
        </h2>
        <p className="glm-body" style={{ fontSize: 17, maxWidth: 520, margin: "0 auto 40px" }}>
          The movement is alive and growing. Join thousands of young believers who are switching on every day.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/app/dashboard" className="glm-btn-primary" style={{ fontSize: 17 }}>Join Now ⚡</a>
          <Link to={createPageUrl("Challenges")} className="glm-btn-secondary" style={{ fontSize: 17 }}>See Challenges →</Link>
        </div>
      </section>
    </div>
  );
}