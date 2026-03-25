import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Globe, Users, Zap, MapPin, Target } from "lucide-react";
import { createPageUrl } from "@/utils";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";
import { countryCoordinates } from "@/lib/countryCoordinates";

export default function LiveImpactPage() {
  const { data: snapshot } = usePublicCommunitySnapshot();
  const countryStats = snapshot.countryStats || [];
  const topGroups = snapshot.topGroups || [];
  const recentDrops = snapshot.recentDrops || [];

  return (
    <div style={{ background: "#0B0F1A" }}>
      <section style={{ padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,207,255,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 50, padding: "8px 20px", marginBottom: 24 }}>
            <span className="glow-dot"></span>
            <span style={{ color: "#00CFFF", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Live Community Snapshot</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 20 }}>
            Real Impact Across <span className="glm-gradient-text">The Movement</span>
          </h1>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 620, margin: "0 auto" }}>
            Live numbers from the app right now — no sample counts, no placeholder leaderboards.
          </p>
        </div>
      </section>

      <div className="section-divider" />

      <section style={{ padding: "80px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
          {[
            { value: snapshot.totalUsers, label: "Public Members", color: "#00CFFF", icon: Users },
            { value: snapshot.totalGroups, label: "GlowGroups", color: "#8A5CFF", icon: Globe },
            { value: snapshot.totalCountries, label: "Countries Represented", color: "#FFD000", icon: MapPin },
            { value: snapshot.totalChallenges, label: "Active Challenges", color: "#1DA1FF", icon: Target },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glm-card" style={{ textAlign: "center" }}>
                <Icon size={24} color={stat.color} style={{ margin: "0 auto 12px" }} />
                <div className="glm-headline" style={{ fontSize: 44, color: stat.color, lineHeight: 1 }}>
                  {stat.value || 0}
                </div>
                <div className="glm-body" style={{ fontSize: 15, marginTop: 8 }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      <section style={{ padding: "90px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 16 }}>Live Country Map</h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 48 }}>Circle size reflects real activity based on members, groups, and drops.</p>
          <div style={{ height: "550px", width: "100%", borderRadius: "24px", overflow: "hidden", marginBottom: "40px", background: "#080C14", boxShadow: "0 0 40px rgba(0,207,255,0.15)", border: "1px solid rgba(0,207,255,0.3)" }}>
            <MapContainer center={[5, 25]} zoom={3} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%", background: "#0B0F1A" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution='&copy; CartoDB' />
              {countryStats.map((country) => {
                const coords = countryCoordinates[country.country] || countryCoordinates.Global;
                const radius = Math.max(8, Math.min(32, country.users * 2 + country.groups * 3 + country.drops));
                return (
                  <CircleMarker
                    key={country.country}
                    center={coords}
                    radius={radius}
                    pathOptions={{ color: "#00CFFF", fillColor: "#00CFFF", fillOpacity: 0.2, weight: 2 }}
                  >
                    <Popup>
                      <div style={{ background: "rgba(18,24,38,0.96)", padding: 16, borderRadius: 12, border: "1px solid rgba(0,207,255,0.4)", color: "#FFF", minWidth: 200 }}>
                        <h4 className="glm-headline" style={{ fontSize: 16, color: "#00CFFF", marginBottom: 12 }}>{country.country}</h4>
                        <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Members</span><strong>{country.users}</strong></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Groups</span><strong>{country.groups}</strong></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Drops</span><strong>{country.drops}</strong></div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {countryStats.slice(0, 6).map((country) => (
              <div key={country.country} className="glm-card" style={{ textAlign: "left", border: "1px solid rgba(0,207,255,0.15)" }}>
                <h3 className="glm-headline" style={{ fontSize: 20, color: "#FFFFFF", marginBottom: 12 }}>{country.country}</h3>
                <div className="glm-body" style={{ display: "grid", gap: 6, fontSize: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Members</span><strong>{country.users}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>GlowGroups</span><strong>{country.groups}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Glow Drops</span><strong>{country.drops}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section style={{ padding: "90px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          <div>
            <h2 className="glm-headline" style={{ fontSize: 32, marginBottom: 18 }}><span className="glm-gold-text">Leading</span> GlowGroups</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {topGroups.length === 0 ? (
                <div className="glm-card"><p className="glm-body">No live group data yet.</p></div>
              ) : topGroups.map((group, index) => (
                <div key={group.id} className="glm-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,208,0,0.18)" }}>
                  <div>
                    <div className="glm-headline" style={{ fontSize: 18, color: "#FFFFFF" }}>#{index + 1} {group.name}</div>
                    <div className="glm-body" style={{ fontSize: 13 }}>{group.country}</div>
                  </div>
                  <div style={{ color: "#FFD000", fontWeight: 800 }}>{group.membersCount} members</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="glm-headline" style={{ fontSize: 32, marginBottom: 18 }}><span className="glm-gradient-text">Recent</span> Glow Drops</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {recentDrops.length === 0 ? (
                <div className="glm-card"><p className="glm-body">No live drops yet.</p></div>
              ) : recentDrops.map((drop) => (
                <div key={drop.id} className="glm-card" style={{ border: "1px solid rgba(0,207,255,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                    <span style={{ color: "#00CFFF", fontSize: 12, fontWeight: 700 }}>{drop.country}</span>
                    <span style={{ color: "#FFD000", fontSize: 12, fontWeight: 700 }}>{drop.likes_count} likes</span>
                  </div>
                  <h3 className="glm-headline" style={{ fontSize: 18, color: "#FFFFFF", marginBottom: 8 }}>{drop.verse || "Glow Drop"}</h3>
                  <p className="glm-body" style={{ fontSize: 14 }}>{drop.reflection || "A new Glow Drop was shared."}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section style={{ padding: "90px 24px", textAlign: "center" }}>
        <h2 className="glm-headline" style={{ fontSize: "clamp(28px, 4vw, 52px)", marginBottom: 20 }}>
          Be Part Of The <span className="glm-gradient-text">Live Story</span>
        </h2>
        <p className="glm-body" style={{ fontSize: 17, maxWidth: 560, margin: "0 auto 32px" }}>
          Every real post, group, and challenge adds to the movement.
        </p>
        <Link to={createPageUrl("Dashboard")} className="glm-btn-primary">
          Join the movement
        </Link>
      </section>
    </div>
  );
}