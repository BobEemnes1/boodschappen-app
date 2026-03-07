import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ConnectScreen } from './components/ConnectScreen';
import { AddItemBar } from './components/AddItemBar';
import { ShoppingList } from './components/ShoppingList';
import { ShareModal } from './components/ShareModal';
import { SyncStatus } from './components/SyncStatus';
import { SponsorBar } from './components/SponsorBar';
import { supabase } from './lib/supabase';
import { signOut, createProfile } from './lib/auth';
import { clearHouseholdCache } from './lib/groceries';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import './App.css';

function App() {
  const [session, setSession] = useState(undefined); // undefined = nog aan het laden
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      // Na e-mailbevestiging: profiel alsnog aanmaken
      if (event === 'SIGNED_IN') {
        const pending = localStorage.getItem('pending_profile');
        if (pending) {
          localStorage.removeItem('pending_profile');
          try {
            const { householdName, joinCode } = JSON.parse(pending);
            await createProfile(householdName, joinCode);
          } catch {
            // Profiel bestaat al of er is een andere fout — doorgaan
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const { items, isSyncing, syncError, lastSync, householdId, handleAdd, handleToggle, handleDelete, syncNow } =
    useSupabaseSync(!!session);

  const handleDisconnect = async () => {
    clearHouseholdCache();
    await signOut();
  };

  // Sessie laden
  if (session === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <ConnectScreen />;
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Header
        isConnected={!!session}
        isSyncing={isSyncing}
        lastSync={lastSync}
        onSync={syncNow}
        onDisconnect={handleDisconnect}
        onShare={() => setShowShare(true)}
      />

      <AddItemBar onAdd={handleAdd} />

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

      {showShare && (
        <ShareModal householdId={householdId} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

export default App;
