import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cacheDrops, getCachedDrops, getQueuedActions, removeQueuedAction, getLastCachedAt } from "@/lib/offlineCache";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Hook that:
 * 1. Caches fetched Glow Drops into IndexedDB for offline reading
 * 2. On reconnect, syncs any queued (offline-created) drops
 * 3. Provides cached drops when offline
 */
export default function useOfflineSync(liveDrops, isOnline) {
  const queryClient = useQueryClient();
  const [cachedDrops, setCachedDrops] = useState([]);
  const [lastCached, setLastCached] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [loadingCached, setLoadingCached] = useState(true);
  const syncingRef = useRef(false);
  const lastCachedIdsRef = useRef("");

  // Cache live drops when they arrive and we're online.
  // Uses a ref to avoid re-caching the same drops on every render.
  useEffect(() => {
    if (liveDrops && liveDrops.length > 0 && isOnline) {
      const ids = liveDrops.map(d => d.id).sort().join("|");
      if (ids === lastCachedIdsRef.current) return;
      lastCachedIdsRef.current = ids;
      cacheDrops(liveDrops).catch(() => {});
      getLastCachedAt().then(setLastCached).catch(() => {});
    }
  }, [liveDrops, isOnline]);

  // Load cached drops on mount (for offline fallback)
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getCachedDrops().catch(() => []),
      getLastCachedAt().catch(() => null),
    ]).then(([drops, ts]) => {
      if (cancelled) return;
      setCachedDrops(drops);
      if (ts) setLastCached(ts);
      setLoadingCached(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Sync queued actions — stable reference, uses ref to guard against double-calls
  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const queued = await getQueuedActions();
      if (queued.length === 0) return;

      let syncedCount = 0;
      for (const item of queued) {
        try {
          if (item.type === "likeDrop") {
            await base44.functions.invoke("handleLikeDrop", item.payload);
          } else {
            const { queueId, queuedAt, type, payload, ...legacyDropData } = item;
            const dropData = payload || legacyDropData;
            const { media_file: mediaFile, ...postData } = dropData;
            if (mediaFile) {
              const upload = await base44.integrations.Core.UploadFile({ file: mediaFile });
              postData.media_url = upload.file_url;
            }
            await base44.functions.invoke("createGlowDrop", postData);
          }
          await removeQueuedAction(item.queueId);
          syncedCount++;
        } catch (err) {
          console.error("Failed to sync queued action:", err);
        }
      }

      if (syncedCount > 0) {
        await queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
        queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
        queryClient.invalidateQueries({ queryKey: ["userLikes"] });
        queryClient.invalidateQueries({ queryKey: ["feedViewerState"] });
        toast.success(`Synced ${syncedCount} offline action${syncedCount > 1 ? "s" : ""}!`);
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [queryClient]);

  // Sync once when coming back online
  useEffect(() => {
    if (isOnline) {
      syncQueue();
    }
  }, [isOnline, syncQueue]);

  return {
    drops: isOnline ? (liveDrops || cachedDrops) : cachedDrops,
    lastCached,
    syncing,
    syncQueue,
    loadingCached,
  };
}