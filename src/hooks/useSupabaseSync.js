import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { loadList, addItem, updateItem, deleteItem, getHouseholdId } from '../lib/groceries';

export function useSupabaseSync(isAuthenticated) {
  const [items, setItems] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [householdId, setHouseholdId] = useState(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const fetchItems = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await loadList();
      setItems(data);
      setLastSync(new Date());
    } catch (err) {
      setSyncError('Laden mislukt: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initieel laden + huishoudId ophalen + realtime subscription
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchItems();
    getHouseholdId().then(setHouseholdId).catch(() => {});

    const channel = supabase
      .channel('groceries-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groceries' },
        () => fetchItems()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isAuthenticated, fetchItems]);

  const handleAdd = useCallback(async (text) => {
    try {
      const item = await addItem(text);
      setItems((prev) => [item, ...prev]);
    } catch (err) {
      setSyncError('Toevoegen mislukt: ' + err.message);
    }
  }, []);

  const handleToggle = useCallback(async (id) => {
    const current = itemsRef.current.find((i) => i.id === id);
    if (!current) return;
    const newChecked = !current.checked;

    // Optimistisch bijwerken
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: newChecked } : item))
    );
    try {
      await updateItem(id, { checked: newChecked });
    } catch (err) {
      setSyncError('Bijwerken mislukt: ' + err.message);
      fetchItems(); // herstel bij fout
    }
  }, [fetchItems]);

  const handleDelete = useCallback(async (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteItem(id);
    } catch (err) {
      setSyncError('Verwijderen mislukt: ' + err.message);
      fetchItems(); // herstel bij fout
    }
  }, [fetchItems]);

  return {
    items,
    isSyncing,
    syncError,
    lastSync,
    householdId,
    handleAdd,
    handleToggle,
    handleDelete,
    syncNow: fetchItems,
  };
}
