import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";

/** Promo block on the Resources page linking to the Content Hub. */
export default function ContentHubPromo() {
  return (
    <section style={{ padding: "32px 24px 64px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="rounded-3xl p-8 text-center" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.08), rgba(138,92,255,0.08))", border: "1px solid rgba(0,207,255,0.25)" }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-[26px]" style={{ background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.35)", boxShadow: "0 0 20px rgba(0,207,255,0.25)" }}>🎬</div>
          <h3 className="glm-headline text-2xl text-white mb-2">All Things New</h3>
          <p className="glm-body text-sm max-w-md mx-auto mb-3">
            Videos, posters & animations in your language — fresh content unlocks on a schedule. Download instantly and share across your platforms.
          </p>
          <p className="text-[11px] mb-5 flex items-center justify-center gap-1.5" style={{ color: "#FFD000" }}>
            <CalendarDays size={12} /> New drops unlock automatically at their scheduled day & time
          </p>
          <Link to="/ContentHub" className="glm-btn-primary" style={{ fontSize: 14, padding: "12px 28px" }}>
            Open All Things New <ArrowRight size={15} style={{ marginLeft: 6 }} />
          </Link>
        </div>
      </div>
    </section>
  );
}