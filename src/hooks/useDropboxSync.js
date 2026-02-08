import { useState, useEffect, useCallback, useRef } from 'react';
import { loadList, saveList, getStoredToken } from '../lib/dropbox';
import { mergeItems } from '../lib/merge';

const POLL_INTERVAL = 30000; // 30 seconds

export function useDropboxSync() {
  const [items, setItems] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const itemsRef = useRef(items);
  const pollRef = useRef(null);

  // Keep ref in sync
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const token = getStoredToken();

  const syncFromCloud = useCallback(async () => {
    if (!token) return;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const cloudData = await loadList(token);
      const cloudItems = cloudData.items || [];
      const merged = mergeItems(itemsRef.current, cloudItems);
      setItems(merged);
      setLastSync(new Date());
    } catch (err) {
      console.error('Sync fout:', err);
      setSyncError('Synchronisatie mislukt');
    } finally {
      setIsSyncing(false);
    }
  }, [token]);

  const syncToCloud = useCallback(async (newItems) => {
    if (!token) return;
    try {
      await saveList(token, {
        items: newItems,
        lastModified: new Date().toISOString(),
      });
      setLastSync(new Date());
      setSyncError(null);
    } catch (err) {
      console.error('Opslaan mislukt:', err);
      setSyncError('Opslaan mislukt');
    }
  }, [token]);

  const updateItems = useCallback((updater) => {
    setItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Save to cloud after state update
      syncToCloud(next);
      return next;
    });
  }, [syncToCloud]);

  // Initial load
  useEffect(() => {
    if (token) {
      syncFromCloud();
    }
  }, [token, syncFromCloud]);

  // Polling
  useEffect(() => {
    if (!token) return;

    pollRef.current = setInterval(() => {
      syncFromCloud();
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [token, syncFromCloud]);

  return {
    items,
    setItems: updateItems,
    isSyncing,
    lastSync,
    syncError,
    syncNow: syncFromCloud,
  };
}
