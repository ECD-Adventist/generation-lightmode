import { motion, useScroll, useSpring } from "framer-motion";

/** Thin gradient line at the very top that fills as the page is scrolled. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 1001, transformOrigin: "0% 50%", scaleX,
        background: "linear-gradient(90deg, #FFD000 0%, #00CFFF 55%, #8A5CFF 100%)",
        boxShadow: "0 0 12px rgba(0,207,255,0.6)", pointerEvents: "none",
      }}
    />
  );
}