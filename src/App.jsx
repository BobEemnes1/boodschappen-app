import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ConnectScreen } from './components/ConnectScreen';
import { AddItemBar } from './components/AddItemBar';
import { ShoppingList } from './components/ShoppingList';
import { ShareModal } from './components/ShareModal';
import { SyncStatus } from './components/SyncStatus';
import { SponsorBar } from './components/SponsorBar';
import { useDropboxSync } from './hooks/useDropboxSync';
import {
  getStoredToken,
  handleAuthRedirect,
  handleSharedToken,
  clearStoredToken,
} from './lib/dropbox';
import { createItem } from './lib/merge';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(!!getStoredToken());
  const [showShare, setShowShare] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleTokenExpired = useCallback(() => {
    setIsConnected(false);
  }, []);

  const { items, setItems, isSyncing, lastSync, syncError, syncNow } =
    useDropboxSync(handleTokenExpired);

  // Handle OAuth redirect and shared tokens on mount
  useEffect(() => {
    async function init() {
      // Check for shared token first
      const sharedToken = handleSharedToken();
      if (sharedToken) {
        setIsConnected(true);
        setIsLoading(false);
        return;
      }

      // Check for OAuth redirect
      const token = await handleAuthRedirect();
      if (token) {
        setIsConnected(true);
      } else {
        setIsConnected(!!getStoredToken());
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const handleAddItem = useCallback(
    (text) => {
      const item = createItem(text);
      setItems((prev) => [item, ...prev]);
    },
    [setItems]
  );

  const handleToggle = useCallback(
    (id) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, checked: !item.checked, updatedAt: new Date().toISOString() }
            : item
        )
      );
    },
    [setItems]
  );

  const handleDelete = useCallback(
    (id) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [setItems]
  );

  const handleDisconnect = useCallback(() => {
    clearStoredToken();
    setIsConnected(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isConnected) {
    return <ConnectScreen />;
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Header
        isConnected={isConnected}
        isSyncing={isSyncing}
        lastSync={lastSync}
        onSync={syncNow}
        onDisconnect={handleDisconnect}
        onShare={() => setShowShare(true)}
      />

      <AddItemBar onAdd={handleAddItem} />

      <SyncStatus syncError={syncError} lastSync={lastSync} />

      <main className="flex-1 px-4 pb-4">
        <div className="max-w-lg mx-auto">
          <ShoppingList
            items={items}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        </div>
      </main>

      <SponsorBar />

      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
    </div>
  );
}

export default App;
