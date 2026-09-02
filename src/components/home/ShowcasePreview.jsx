import { Heart, MessageCircle, Zap, Users, Trophy, Target } from "lucide-react";
import { SAMPLE_AVATARS } from "./homeAssets";

const font = "Space Grotesk, sans-serif";
const body = "Inter, sans-serif";
const row = { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" };

function Avatar({ i, size = 34 }) {
  return <img src={SAMPLE_AVATARS[i % SAMPLE_AVATARS.length]} alt="" loading="lazy" width={size} height={size} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
}

function FeedPreview() {
  const posts = [
    { name: "Grace M.", verse: "Matthew 5:14 — You are the light of the world.", likes: 128, comments: 24 },
    { name: "Daniel K.", verse: "Isaiah 60:1 — Arise, shine, for your light has come.", likes: 96, comments: 11 },
    { name: "Ruth W.", verse: "Testimony — I shared my faith at campus today. Two friends asked to join our GlowGroup.", likes: 214, comments: 37 },
  ];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {posts.map((p, i) => (
        <div key={p.name} style={{ ...row, alignItems: "flex-start" }}>
          <Avatar i={i} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: font, fontWeight: 700, fontSize: 13, color: "#FFF" }}>{p.name} <span style={{ color: "#6B7A90", fontWeight: 400, fontFamily: body }}>· Glow Drop</span></div>
            <div style={{ fontFamily: body, fontSize: 13, color: "#C8D0E0", marginTop: 4, lineHeight: 1.5 }}>{p.verse}</div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: body, fontSize: 12, color: "#8A9BB0" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Heart size={13} color="#FF6B8A" fill="#FF6B8A" /> {p.likes}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><MessageCircle size={13} /> {p.comments}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#00CFFF" }}><Zap size={13} /> +10 XP</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupsPreview() {
  const groups = [["Kampala Light Hub", 312, "#00CFFF"], ["Kigali Glow Circle", 188, "#8A5CFF"], ["Dar Youth Flame", 241, "#FFD000"]];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
      {groups.map(([name, n, c], i) => (
        <div key={name} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ height: 64, background: `linear-gradient(135deg, ${c}55, #0B0F1A)` }} />
          <div style={{ padding: "12px 14px" }}>
            <div style={{ fontFamily: font, fontWeight: 700, fontSize: 13, color: "#FFF" }}>{name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <Avatar i={i} size={20} /><Avatar i={i + 1} size={20} />
              <span style={{ fontFamily: body, fontSize: 11, color: "#8A9BB0" }}><Users size={11} style={{ display: "inline", marginRight: 3 }} />{n}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChallengesPreview() {
  const items = [["7-Day Glow Drop Streak", 71, "#FFD000"], ["Invite 3 Friends to LightMode", 33, "#00CFFF"], ["Share a Real Light Talk", 100, "#8A5CFF"]];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map(([name, pct, c]) => (
        <div key={name} style={{ ...row, flexDirection: "column", alignItems: "stretch", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 13, color: "#FFF", display: "inline-flex", alignItems: "center", gap: 8 }}><Target size={14} color={c} /> {name}</span>
            <span style={{ fontFamily: body, fontSize: 12, color: c, fontWeight: 600 }}>{pct === 100 ? "Complete" : `${pct}%`}</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.06)" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: c, boxShadow: `0 0 12px ${c}80` }} /></div>
        </div>
      ))}
    </div>
  );
}

function LeaderboardPreview() {
  const ranks = [["Faith N.", "Kenya", 4820], ["Joseph T.", "Uganda", 4410], ["Miriam A.", "Tanzania", 3985], ["Elias R.", "Rwanda", 3720]];
  const medal = ["#FFD000", "#C7CEDB", "#C77A2B", "#6B7A90"];
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {ranks.map(([name, country, xp], i) => (
        <div key={name} style={row}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, fontWeight: 800, fontSize: 12, color: medal[i], border: `1px solid ${medal[i]}60`, background: `${medal[i]}14` }}>{i + 1}</div>
          <Avatar i={i} size={30} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font, fontWeight: 700, fontSize: 13, color: "#FFF" }}>{name}</div>
            <div style={{ fontFamily: body, fontSize: 11, color: "#8A9BB0" }}>{country}</div>
          </div>
          <span style={{ fontFamily: font, fontWeight: 800, fontSize: 13, color: "#00CFFF", display: "inline-flex", alignItems: "center", gap: 5 }}><Trophy size={13} /> {xp.toLocaleString()} XP</span>
        </div>
      ))}
    </div>
  );
}

export default function ShowcasePreview({ tab }) {
  if (tab === "groups") return <GroupsPreview />;
  if (tab === "challenges") return <ChallengesPreview />;
  if (tab === "leaderboard") return <LeaderboardPreview />;
  return <FeedPreview />;
}