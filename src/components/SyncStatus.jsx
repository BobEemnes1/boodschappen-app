import { AlertCircle, Cloud } from 'lucide-react';

export function SyncStatus({ syncError, lastSync }) {
  if (syncError) {
    return (
      <div className="mx-4 mb-2">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
          <AlertCircle size={16} />
          {syncError}
        </div>
      </div>
    );
  }

  if (lastSync) {
    return (
      <div className="mx-4 mb-2">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-1.5 py-1 text-xs text-text-muted">
          <Cloud size={12} />
          Gesynchroniseerd om {lastSync.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  }

  return null;
}
