import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

/**
 * Horizontal slide-in page transition for sub-screens.
 * Primary tab pages (Feed, GlowGroups, Profile, Dashboard) skip the animation
 * so tab switches feel instant — matching native app behavior.
 */
const INSTANT_ROUTES = new Set(["/", "/Feed", "/GlowGroups", "/Profile", "/Dashboard"]);

export default function PageTransition({ children }) {
  const location = useLocation();
  const isInstant = INSTANT_ROUTES.has(location.pathname);

  if (isInstant) return <>{children}</>;

  return (
    <motion.div
      key={location.pathname}
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -24, opacity: 0 }}
      transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
      style={{ minHeight: "100%" }}
    >
      {children}
    </motion.div>
  );
}