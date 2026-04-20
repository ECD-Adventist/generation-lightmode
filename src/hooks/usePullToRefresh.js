import { useEffect, useRef, useState } from "react";

/**
 * Pull-to-refresh hook for scrollable containers.
 * Activates only when the container is scrolled to the top and the user pulls down.
 *
 * Usage:
 *   const containerRef = useRef(null);
 *   const { isPulling, pullDistance, isRefreshing } = usePullToRefresh(containerRef, async () => {
 *     await refetch();
 *   });
 *
 * Attach containerRef to the scrollable element and render an indicator based on pullDistance.
 */
export default function usePullToRefresh(containerRef, onRefresh, { threshold = 70, maxPull = 120 } = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (el.scrollTop > 0 || isRefreshing) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPullDistance(0);
        return;
      }
      // Resistance curve — the further you pull, the harder it gets
      const resisted = Math.min(maxPull, dy * 0.5);
      setPullDistance(resisted);
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh?.();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [containerRef, onRefresh, threshold, maxPull, pullDistance, isRefreshing]);

  return { pullDistance, isRefreshing, isPulling: pullDistance > 0, threshold };
}