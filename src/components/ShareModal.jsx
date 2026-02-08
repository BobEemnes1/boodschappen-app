import { useState } from 'react';
import { X, Copy, Check, Link } from 'lucide-react';
import { generateShareUrl } from '../lib/dropbox';

export function ShareModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = generateShareUrl();

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text flex items-center gap-2">
            <Link size={20} className="text-primary" />
            Deel met huisgenoten
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-border/50 transition-colors"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        <p className="text-sm text-text-muted mb-4">
          Deel deze link met je huisgenoten zodat zij ook items kunnen toevoegen en afvinken.
        </p>

        <div className="bg-bg border border-border rounded-xl p-3 mb-4">
          <p className="text-xs text-text-muted break-all font-mono">
            {shareUrl || 'Niet beschikbaar'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            {copied ? (
              <>
                <Check size={18} />
                Gekopieerd!
              </>
            ) : (
              <>
                <Copy size={18} />
                Kopieer link
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-text-muted mt-4 text-center">
          Let op: iedereen met deze link kan de lijst bewerken.
        </p>
      </div>
    </div>
  );
}
