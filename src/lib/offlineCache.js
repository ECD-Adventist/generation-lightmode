/**
 * Offline caching system using IndexedDB for Glow Drops and feed data.
 * Caches feed content locally and syncs when back online.
 */

const DB_NAME = "lightmode_offline";
const DB_VERSION = 1;
const STORE_DROPS = "glowDrops";
const STORE_QUEUE = "syncQueue";
const STORE_META = "meta";

function openDB() {
  return new Promise((resolve, reject) => {
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
  const db = await openDB();
  const store = tx(db, STORE_DROPS);
  const result = await promisifyRequest(store.getAll());
  db.close();
  return result || [];
}

/** Get last cache timestamp */
export async function getLastCachedAt() {
  const db = await openDB();
  const store = tx(db, STORE_META);
  const result = await promisifyRequest(store.get("lastCachedAt"));
  db.close();
  return result?.value || null;
}

/** Queue a Glow Drop for creation when back online */
export async function queueDropForSync(dropData) {
  const db = await openDB();
  const store = tx(db, STORE_QUEUE, "readwrite");
  await promisifyRequest(store.add({ ...dropData, queuedAt: new Date().toISOString() }));
  db.close();
}

/** Get all queued drops waiting for sync */
export async function getQueuedDrops() {
  const db = await openDB();
  const store = tx(db, STORE_QUEUE);
  const result = await promisifyRequest(store.getAll());
  db.close();
  return result || [];
}

/** Clear a specific queued drop after successful sync */
export async function removeQueuedDrop(queueId) {
  const db = await openDB();
  const store = tx(db, STORE_QUEUE, "readwrite");
  await promisifyRequest(store.delete(queueId));
  db.close();
}

/** Clear all cached drops (e.g., on logout) */
export async function clearCache() {
  const db = await openDB();
  tx(db, STORE_DROPS, "readwrite").clear();
  tx(db, STORE_QUEUE, "readwrite").clear();
  tx(db, STORE_META, "readwrite").clear();
  db.close();
}