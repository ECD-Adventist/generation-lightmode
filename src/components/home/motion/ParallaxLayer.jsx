import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * Moves its content vertically by ±range px as it travels through the viewport.
 * Positive range = drifts down slower than the page (feels further away); negative = floats ahead.
 */
export default function ParallaxLayer({ children, range = 80, scaleRange, style, className }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-range, range]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleRange && !reduce ? scaleRange : [1, 1]);
  return (
    <motion.div ref={ref} className={className} style={{ ...style, y, scale }}>
      {children}
    </motion.div>
  );
}