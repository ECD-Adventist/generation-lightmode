import { useEffect, useRef } from "react";

const KEY = "feedScrollTop";

/**
 * Remembers the feed's scroll position so returning from a post
 * puts the user back where they were instead of at the top.
 */
export default function useFeedScrollRestore(scrollRef, ready) {
  const restored = useRef(false);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const onScroll = () => sessionStorage.setItem(KEY, String(node.scrollTop));
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [scrollRef, ready]);

  useEffect(() => {
    if (!ready || restored.current) return;
    const node = scrollRef.current;
    if (!node) return;
    restored.current = true;
    const saved = Number(sessionStorage.getItem(KEY) || 0);
    if (saved > 0) requestAnimationFrame(() => { node.scrollTop = saved; });
  }, [ready, scrollRef]);
}