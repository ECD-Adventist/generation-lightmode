import { useEffect, useRef, useState } from "react";

// Smooth count-up hook using requestAnimationFrame with easeOutExpo
export default function useCountUp(target, duration = 1400, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    const numericTarget = Number(target) || 0;
    startValueRef.current = value;
    startTimeRef.current = null;

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValueRef.current + (numericTarget - startValueRef.current) * eased;
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setValue(numericTarget);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  const formatted = decimals > 0
    ? value.toFixed(decimals)
    : Math.round(value).toLocaleString();

  return formatted;
}

export function AnimatedNumber({ value, duration = 1400, decimals = 0, suffix = "", className, style }) {
  const display = useCountUp(value, duration, decimals);
  return <span className={className} style={style}>{display}{suffix}</span>;
}