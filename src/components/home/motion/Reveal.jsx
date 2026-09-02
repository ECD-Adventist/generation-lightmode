import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/** Fade + rise + unblur when the element scrolls into view. */
export default function Reveal({ children, delay = 0, y = 36, duration = 0.9, once = true, style, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-12% 0px -12% 0px" }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}