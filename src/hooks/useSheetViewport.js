import { useLayoutEffect, useState } from "react";

export default function useSheetViewport(enabled) {
  const [viewport, setViewport] = useState(null);
  useLayoutEffect(() => {
    if (!enabled || !window.visualViewport) return;
    const visual = window.visualViewport;
    const update = () => setViewport({
      top: visual.offsetTop,
      left: visual.offsetLeft,
      width: visual.width,
      height: visual.height,
    });
    update();
    visual.addEventListener("resize", update);
    visual.addEventListener("scroll", update);
    return () => {
      visual.removeEventListener("resize", update);
      visual.removeEventListener("scroll", update);
    };
  }, [enabled]);
  return enabled ? viewport : null;
}