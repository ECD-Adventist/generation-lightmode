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
  const hasSynced = useRef(false);

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

  // Sync queued drops when coming back online
  const syncQueue = useCallback(async () => {
    if (syncing || hasSynced.current) return;
    setSyncing(true);
    hasSynced.current = true;

    const queued = await getQueuedDrops();
    if (queued.length === 0) {
      setSyncing(false);
      return;
    }

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
    setSyncing(false);
  }, [syncing]);

  // Watch for online status change
  useEffect(() => {
    if (isOnline) {
      hasSynced.current = false;
      syncQueue();
    }
  }, [isOnline, syncQueue]);

  return {
    /** Use liveDrops when online, cachedDrops when offline */
    drops: isOnline ? (liveDrops || cachedDrops) : cachedDrops,
    lastCached,
    syncing,
    syncQueue,
  };
}