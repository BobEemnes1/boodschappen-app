import { useState } from 'react';
import { ShoppingCart, KeyRound } from 'lucide-react';
import { updatePassword } from '../lib/auth';

export function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updatePassword(password);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-4">
            <ShoppingCart size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text">Nieuw wachtwoord</h2>
          <p className="text-text-muted mt-2">Kies een nieuw wachtwoord voor je account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Nieuw wachtwoord</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimaal 6 tekens"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-text placeholder:text-text-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Bevestig wachtwoord</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Herhaal je wachtwoord"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-text placeholder:text-text-muted"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50"
          >
            <KeyRound size={18} />
            {loading ? 'Bezig...' : 'Wachtwoord opslaan'}
          </button>
        </form>
      </div>
    </div>
  );
}
