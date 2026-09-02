import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

function gradientStyle(gradient) {
  return { background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };
}

/**
 * Word-by-word masked text reveal.
 * segments: [{ text, gradient? }] — words stagger continuously across segments.
 */
export default function TextReveal({ segments, as = "h2", style, className, delay = 0, stagger = 0.045 }) {
  const reduce = useReducedMotion();
  const Tag = as;
  let index = 0;
  return (
    <Tag style={style} className={className}>
      {segments.map((seg, s) =>
        (seg.text || "").split(" ").filter(Boolean).map((word, i) => {
          const k = index++;
          return (
            <span key={`${s}-${i}`}>
              <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
                <motion.span
                  initial={reduce ? false : { y: "110%", opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: "-10% 0px" }}
                  transition={{ duration: 0.75, delay: delay + k * stagger, ease: EASE }}
                  style={{ display: "inline-block", ...(seg.gradient ? gradientStyle(seg.gradient) : {}) }}
                >
                  {word}
                </motion.span>
              </span>{" "}
            </span>
          );
        })
      )}
    </Tag>
  );
}