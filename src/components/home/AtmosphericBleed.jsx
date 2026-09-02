/**
 * Photographic element that bleeds into the dark canvas between sections.
 * The image is masked top and bottom so it dissolves into #0B0F1A on both edges.
 */
export default function AtmosphericBleed({ src, height = 420, opacity = 0.9, tint = "rgba(0,207,255,0.06)" }) {
  const mask = "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)";
  return (
    <div aria-hidden="true" style={{ position: "relative", height, overflow: "hidden", background: "#0B0F1A", pointerEvents: "none" }}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center",
          opacity, WebkitMaskImage: mask, maskImage: mask,
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, ${tint}, transparent 60%)`, mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #0B0F1A 0%, transparent 25%, transparent 75%, #0B0F1A 100%)" }} />
    </div>
  );
}