import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BRAND_COLORS = {
  bg: "#0B0F1A",
  cyan: "#00CFFF",
  gold: "#FFD000",
  violet: "#8A5CFF",
};

function ShareCard({ user, drops, score }) {
  return (
    <div
      id="share-card"
      style={{
        width: 400,
        minHeight: 520,
        background: `linear-gradient(160deg, ${BRAND_COLORS.bg} 0%, #121826 50%, ${BRAND_COLORS.bg} 100%)`,
        borderRadius: 24,
        padding: "32px 28px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        color: "#fff",
      }}
    >
      {/* Ambient glows */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${BRAND_COLORS.cyan}30, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${BRAND_COLORS.violet}25, transparent 70%)`, pointerEvents: "none" }} />
      
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 40, right: 40, height: 3, background: `linear-gradient(90deg, ${BRAND_COLORS.cyan}, ${BRAND_COLORS.violet}, ${BRAND_COLORS.gold})`, borderRadius: "0 0 4px 4px" }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
          alt="LightMode"
          style={{ height: 36 }}
        />
      </div>

      {/* User info */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${BRAND_COLORS.cyan}`, overflow: "hidden", flexShrink: 0, background: "#121826" }}>
          <img
            src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>{user.full_name}</div>
          <div style={{ fontSize: 12, color: BRAND_COLORS.cyan, fontWeight: 600 }}>LightMode Missionary</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Glow Score", value: score, color: BRAND_COLORS.gold, icon: "⚡" },
          { label: "Glow Drops", value: drops, color: BRAND_COLORS.cyan, icon: "💧" },
        ].map(s => (
          <div key={s.label} style={{ background: `${s.color}10`, border: `1px solid ${s.color}35`, borderRadius: 16, padding: "18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#8A9BB0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quote */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px", marginBottom: 24, textAlign: "center" }}>
        <p style={{ fontSize: 13, fontStyle: "italic", color: "#D0D8E8", lineHeight: 1.6, margin: 0 }}>
          "You are the light of the world."
        </p>
        <p style={{ fontSize: 11, color: BRAND_COLORS.gold, marginTop: 6, fontWeight: 700 }}>— Matthew 5:14</p>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-block", background: `linear-gradient(135deg, ${BRAND_COLORS.gold}, #FFA500)`, borderRadius: 999, padding: "10px 24px", fontSize: 12, fontWeight: 800, color: BRAND_COLORS.bg, letterSpacing: "0.04em" }}>
          Join the movement → lightmode.ecd.adventist.org
        </div>
      </div>

      {/* Bottom tagline */}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <span style={{ fontSize: 10, color: "#5A6478", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Faith. Always On. ⚡</span>
      </div>
    </div>
  );
}

export default function ShareProgressModal({ isOpen, onClose, user }) {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const score = user?.glow_score || 0;
  const drops = 0; // Will be passed from parent or fetched

  const getShareText = () => {
    return `⚡ My LightMode Progress!\n\n🔥 Glow Score: ${score}\n✨ I'm on fire for God!\n\n"You are the light of the world." — Matthew 5:14\n\nJoin the movement: lightmode.ecd.adventist.org\n\n#GenerationLightMode #FaithAlwaysOn #GlowDrop`;
  };

  const handleDownloadImage = async () => {
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const element = document.getElementById("share-card");
      if (!element) throw new Error("Card not found");
      const canvas = await html2canvas(element, { backgroundColor: null, scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `lightmode-progress-${user.full_name?.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image downloaded! Share it on Instagram or any platform.");
    } catch (e) {
      toast.error("Could not generate image. Try sharing as text instead.");
    } finally {
      setGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleNativeShare = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({ text, title: "My LightMode Progress" });
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Progress text copied to clipboard!");
      } catch { /* ignore */ }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0B0F1A] border-white/10 text-white max-w-[460px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk'] text-xl flex items-center gap-2">
            <Share2 size={20} className="text-[#00CFFF]" /> Share Your Progress
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-4" ref={cardRef}>
          <ShareCard user={user} drops={drops} score={score} />
        </div>

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleDownloadImage}
            disabled={generating}
            className="w-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-[#0B0F1A] font-bold h-12 hover:opacity-90"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download size={16} className="mr-2" />}
            {generating ? "Generating..." : "Download Image for Instagram"}
          </Button>

          <Button
            onClick={handleShareWhatsApp}
            className="w-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] font-bold h-12 hover:bg-[#25D366]/30"
          >
            <MessageCircle size={16} className="mr-2" /> Share to WhatsApp
          </Button>

          <Button
            onClick={handleNativeShare}
            variant="outline"
            className="w-full border-white/10 text-gray-300 font-bold h-12 hover:bg-white/5"
          >
            <Share2 size={16} className="mr-2" /> Share / Copy Text
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-2">
          Download the branded image to share on Instagram Stories, or use WhatsApp for instant sharing.
        </p>
      </DialogContent>
    </Dialog>
  );
}