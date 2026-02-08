import { ShoppingCart, RefreshCw, LogOut, Share2 } from 'lucide-react';

export function Header({ isConnected, isSyncing, lastSync, onSync, onDisconnect, onShare }) {
  return (
    <header className="bg-primary text-white px-4 py-3 shadow-lg sticky top-0 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={24} />
          <h1 className="text-lg font-bold tracking-tight">Boodschappen</h1>
        </div>

        {isConnected && (
          <div className="flex items-center gap-1">
            <button
              onClick={onShare}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Deel met huisgenoten"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={onSync}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              disabled={isSyncing}
              title={lastSync ? `Laatst: ${lastSync.toLocaleTimeString('nl-NL')}` : 'Synchroniseren'}
            >
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onDisconnect}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Dropbox ontkoppelen"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
