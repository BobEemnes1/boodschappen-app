/**
 * Merge local items with remote items based on timestamps.
 * Each item has: { id, text, checked, createdAt, updatedAt }
 */
export function mergeItems(localItems, remoteItems) {
  const merged = new Map();

  // Add all remote items
  for (const item of remoteItems) {
    merged.set(item.id, { ...item });
  }

  // Merge local items - local wins if updatedAt is newer
  for (const item of localItems) {
    const existing = merged.get(item.id);
    if (!existing) {
      // New local item, add it
      merged.set(item.id, { ...item });
    } else {
      // Compare timestamps - most recent wins
      const localTime = new Date(item.updatedAt).getTime();
      const remoteTime = new Date(existing.updatedAt).getTime();
      if (localTime >= remoteTime) {
        merged.set(item.id, { ...item });
      }
    }
  }

  return Array.from(merged.values());
}

export function createItem(text) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    checked: false,
    createdAt: now,
    updatedAt: now,
  };
}
