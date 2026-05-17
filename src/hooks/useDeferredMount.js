import { useEffect, useState } from "react";

/**
 * Returns `true` after the next idle frame (or after `delay` ms as a fallback).
 * Use to defer non-critical queries / heavy renders until after the first paint,
 * so the visible content appears faster on slow mobile devices.
 */
export default function useDeferredMount(delay = 600) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const done = () => { if (!cancelled) setReady(true); };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(done, { timeout: delay });
      return () => { cancelled = true; window.cancelIdleCallback?.(id); };
    }
    const t = setTimeout(done, delay);
    return () => { cancelled = true; clearTimeout(t); };
  }, [delay]);

  return ready;
}