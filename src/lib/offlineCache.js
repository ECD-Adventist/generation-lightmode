/**
 * Offline caching system using IndexedDB for Glow Drops and feed data.
 * Caches feed content locally and syncs when back online.
 */

const DB_NAME = "lightmode_offline";
const DB_VERSION = 2;
const STORE_DROPS = "glowDrops";
const STORE_QUEUE = "syncQueue";
const STORE_META = "meta";

function isIndexedDBAvailable() {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_DROPS)) {
        db.createObjectStore(STORE_DROPS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: "queueId", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(db, storeName, mode = "readonly") {
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Cache an array of Glow Drops into IndexedDB */
export async function cacheDrops(drops) {
  if (!isIndexedDBAvailable()) return;
  const db = await openDB();
  const store = tx(db, STORE_DROPS, "readwrite");
  for (const drop of drops) {
    store.put(drop);
  }
  // Save timestamp
  const meta = tx(db, STORE_META, "readwrite");
  meta.put({ key: "lastCachedAt", value: new Date().toISOString() });
  db.close();
}

/** Get all cached Glow Drops from IndexedDB */
export async function getCachedDrops() {
  if (!isIndexedDBAvailable()) return [];
  const db = await openDB();
  const store = tx(db, STORE_DROPS);
  const result = await promisifyRequest(store.getAll());
  db.close();
  return result || [];
}

/** Get last cache timestamp */
export async function getLastCachedAt() {
  if (!isIndexedDBAvailable()) return null;
  const db = await openDB();
  const store = tx(db, STORE_META);
  const result = await promisifyRequest(store.get("lastCachedAt"));
  db.close();
  return result?.value || null;
}

export async function queueOfflineAction(type, payload) {
  if (!isIndexedDBAvailable()) return;
  const db = await openDB();
  const store = tx(db, STORE_QUEUE, "readwrite");
  await promisifyRequest(store.add({ type, payload, queuedAt: new Date().toISOString() }));
  db.close();
}

/** Queue a Glow Drop for creation when back online */
export async function queueDropForSync(dropData) {
  await queueOfflineAction("createDrop", dropData);
}

/** Get all queued actions waiting for sync */
export async function getQueuedActions() {
  if (!isIndexedDBAvailable()) return [];
  const db = await openDB();
  const store = tx(db, STORE_QUEUE);
  const result = await promisifyRequest(store.getAll());
  db.close();
  return result || [];
}

/** Backward-compatible helper */
export async function getQueuedDrops() {
  return getQueuedActions();
}

/** Clear a specific queued action after successful sync */
export async function removeQueuedAction(queueId) {
  if (!isIndexedDBAvailable()) return;
  const db = await openDB();
  const store = tx(db, STORE_QUEUE, "readwrite");
  await promisifyRequest(store.delete(queueId));
  db.close();
}

/** Backward-compatible helper */
export async function removeQueuedDrop(queueId) {
  await removeQueuedAction(queueId);
}

/** Clear all cached drops (e.g., on logout) */
export async function clearCache() {
  if (!isIndexedDBAvailable()) return;
  const db = await openDB();
  tx(db, STORE_DROPS, "readwrite").clear();
  tx(db, STORE_QUEUE, "readwrite").clear();
  tx(db, STORE_META, "readwrite").clear();
  db.close();
}