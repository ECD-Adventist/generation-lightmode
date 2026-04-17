import { useEffect, useRef, useState, useCallback } from "react";
import { cacheDrops, getCachedDrops, getQueuedDrops, removeQueuedDrop, getLastCachedAt } from "@/lib/offlineCache";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Hook that:
 * 1. Caches fetched Glow Drops into IndexedDB for offline reading
 * 2. On reconnect, syncs any queued (offline-created) drops
 * 3. Provides cached drops when offline
 */
export default function useOfflineSync(liveDrops, isOnline) {
  const [cachedDrops, setCachedDrops] = useState([]);
  const [lastCached, setLastCached] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  // Cache live drops when they arrive and we're online
  useEffect(() => {
    if (liveDrops && liveDrops.length > 0 && isOnline) {
      cacheDrops(liveDrops).catch(() => {});
      getLastCachedAt().then(setLastCached).catch(() => {});
    }
  }, [liveDrops, isOnline]);

  // Load cached drops on mount (for offline fallback)
  useEffect(() => {
    getCachedDrops().then(setCachedDrops).catch(() => {});
    getLastCachedAt().then(setLastCached).catch(() => {});
  }, []);

  // Sync queued drops — stable reference, uses ref to guard against double-calls
  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const queued = await getQueuedDrops();
      if (queued.length === 0) return;

      let syncedCount = 0;
      for (const item of queued) {
        const { queueId, queuedAt, ...dropData } = item;
        try {
          await base44.entities.GlowDrop.create(dropData);
          await removeQueuedDrop(queueId);
          syncedCount++;
        } catch (err) {
          console.error("Failed to sync queued drop:", err);
        }
      }

      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} offline drop${syncedCount > 1 ? "s" : ""}!`);
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []); // stable — no deps that change

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
  };
}