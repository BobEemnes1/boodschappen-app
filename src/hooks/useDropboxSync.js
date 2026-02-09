import { useState, useEffect, useCallback, useRef } from 'react';
import { loadList, saveList, getStoredToken, clearStoredToken } from '../lib/dropbox';
import { mergeItems } from '../lib/merge';

const POLL_INTERVAL = 30000; // 30 seconds

export function useDropboxSync(onTokenExpired) {
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

  const isConnected = !!getStoredToken();

  const handleError = useCallback((err, context) => {
    console.error(`${context}:`, err);

    // Token verlopen - log uit
    if (err.code === 'TOKEN_EXPIRED') {
      clearStoredToken();
      setSyncError('Sessie verlopen. Log opnieuw in met Dropbox.');
      if (onTokenExpired) onTokenExpired();
      return;
    }

    // Netwerk fout
    if (!navigator.onLine) {
      setSyncError('Geen internetverbinding');
      return;
    }

    setSyncError(`${context} - probeer opnieuw`);
  }, [onTokenExpired]);

  const syncFromCloud = useCallback(async () => {
    if (!isConnected) return;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const cloudData = await loadList();
      const cloudItems = cloudData.items || [];
      const merged = mergeItems(itemsRef.current, cloudItems);
      setItems(merged);
      setLastSync(new Date());
    } catch (err) {
      handleError(err, 'Synchronisatie mislukt');
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, handleError]);

  const syncToCloud = useCallback(async (newItems) => {
    if (!isConnected) return;
    try {
      await saveList({
        items: newItems,
        lastModified: new Date().toISOString(),
      });
      setLastSync(new Date());
      setSyncError(null);
    } catch (err) {
      handleError(err, 'Opslaan mislukt');
    }
  }, [isConnected, handleError]);

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
    if (isConnected) {
      syncFromCloud();
    }
  }, [isConnected, syncFromCloud]);

  // Polling
  useEffect(() => {
    if (!isConnected) return;

    pollRef.current = setInterval(() => {
      syncFromCloud();
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [isConnected, syncFromCloud]);

  return {
    items,
    setItems: updateItems,
    isSyncing,
    lastSync,
    syncError,
    syncNow: syncFromCloud,
  };
}
