import React, { useState, useLayoutEffect, useRef } from "react";

/**
 * ReadMoreText
 * Clamps text to `lines` and shows "Read more / Show less" toggle
 * only when the text actually overflows.
 *
 * Props:
 *  - text: string
 *  - lines: number (default 3)
 *  - className: string (applied to the text container)
 *  - toggleColor: string (hex/css color for the toggle button)
 */
export default function ReadMoreText({ text, lines = 3, className = "", toggleColor = "#0B3FD9" }) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Temporarily remove clamp to measure true scrollHeight
    const prevDisplay = el.style.webkitLineClamp;
    el.style.webkitLineClamp = "unset";
    el.style.display = "block";
    const full = el.scrollHeight;
    el.style.webkitLineClamp = prevDisplay;
    el.style.display = "";
    // Compute clamped height via line-height * lines
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || "20");
    const clampedHeight = lineHeight * lines;
    setIsOverflowing(full - clampedHeight > 2);
  }, [text, lines]);

  const clampStyle = expanded
    ? {}
    : {
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };

  if (!text) return null;

  return (
    <div>
      <p ref={ref} className={className} style={clampStyle}>
        {text}
      </p>
      {isOverflowing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="text-xs font-bold mt-1 hover:underline transition"
          style={{ color: toggleColor }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}