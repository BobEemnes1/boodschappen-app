import { useState } from 'react';
import { CloudOff, ShoppingCart, ArrowRight, HelpCircle } from 'lucide-react';
import { startAuth, setClientId, getStoredClientId, getRedirectUri_ForDisplay } from '../lib/dropbox';

export function ConnectScreen() {
  const [appKey, setAppKey] = useState(getStoredClientId());
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    if (!appKey.trim()) {
      setError('Voer je Dropbox App Key in');
      return;
    }
    setClientId(appKey.trim());
    try {
      await startAuth();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-4">
            <ShoppingCart size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text">Boodschappen App</h2>
          <p className="text-text-muted mt-2">
            Verbind met Dropbox om je boodschappenlijst te synchroniseren
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Dropbox App Key
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="ml-1 text-text-muted hover:text-primary inline-flex"
              >
                <HelpCircle size={14} />
              </button>
            </label>
            <input
              type="text"
              value={appKey}
              onChange={(e) => { setAppKey(e.target.value); setError(null); }}
              placeholder="Bijv. abc123def456"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-text placeholder:text-text-muted"
            />
          </div>

          {showHelp && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-text-muted space-y-2">
              <p className="font-medium text-text">Hoe maak je een Dropbox App?</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ga naar <strong>dropbox.com/developers/apps</strong></li>
                <li>Klik "Create app"</li>
                <li>Kies "Scoped access" → "App folder"</li>
                <li>Geef de app een naam (bijv. "BoodschappenApp")</li>
                <li>Onder <strong>Settings</strong> → "OAuth 2" → "Redirect URIs": voeg EXACT deze URL toe:</li>
              </ol>
              <div className="bg-surface border border-border rounded-lg p-2 font-mono text-xs break-all select-all">
                {getRedirectUri_ForDisplay()}
              </div>
              <ol className="list-decimal list-inside space-y-1" start={6}>
                <li>Ga naar <strong>Permissions</strong> tab: vink <strong>files.content.write</strong> en <strong>files.content.read</strong> aan, klik Submit</li>
                <li>Terug naar Settings: kopieer de "App key" en plak hierboven</li>
              </ol>
            </div>
          )}

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-sm"
          >
            <CloudOff size={18} />
            Verbind met Dropbox
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
