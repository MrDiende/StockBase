import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "inventory-app-shopee-sync-v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return { lastSyncedAt: null };
}

// Simulates syncing stock with Shopee. `sync()` shows a short spinner and then
// records the current time; an optional callback runs when it finishes.
export function useShopeeSync() {
  const [lastSyncedAt, setLastSyncedAt] = useState(() => loadState().lastSyncedAt);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastSyncedAt }));
  }, [lastSyncedAt]);

  const sync = useCallback(
    (onComplete) => {
      if (syncing) return;
      setSyncing(true);
      const delay = 1200 + Math.random() * 900;
      window.setTimeout(() => {
        setLastSyncedAt(new Date().toISOString());
        setSyncing(false);
        onComplete?.();
      }, delay);
    },
    [syncing],
  );

  return { lastSyncedAt, syncing, sync };
}
