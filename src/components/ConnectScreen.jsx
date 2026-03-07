import { useState, useEffect } from 'react';
import { ShoppingCart, LogIn, UserPlus } from 'lucide-react';
import { signIn, signUp, createProfile } from '../lib/auth';

export function ConnectScreen() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinMode, setJoinMode] = useState(false); // false = nieuw huishouden, true = bestaand
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  // Detecteer ?join=<household_id> in de URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (code) {
      setTab('register');
      setJoinMode(true);
      setJoinCode(code);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      // App.jsx reageert automatisch via onAuthStateChange
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, session } = await signUp(email, password);
      if (!user) {
        setInfo('Er is iets misgegaan. Probeer opnieuw.');
        return;
      }

      const profileData = {
        householdName: !joinMode ? householdName : null,
        joinCode: joinMode ? joinCode : null,
      };

      if (session) {
        // Directe sessie (e-mailbevestiging uitgeschakeld) — profiel meteen aanmaken
        await createProfile(profileData.householdName, profileData.joinCode);
      } else {
        // E-mailbevestiging vereist — sla data op voor na bevestiging
        localStorage.setItem('pending_profile', JSON.stringify(profileData));
        setInfo(
          'Controleer je e-mail en klik op de bevestigingslink. Log daarna in om je account te voltooien.'
        );
        setTab('login');
      }
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
          <h2 className="text-2xl font-bold text-text">Boodschappen App</h2>
          <p className="text-text-muted mt-2">Log in of maak een account aan</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-surface border border-border rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Inloggen
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'register'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Registreren
          </button>
        </div>

        {info && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 text-sm text-text">
            {info}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">E-mailadres</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@voorbeeld.nl"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-text placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Wachtwoord</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-text placeholder:text-text-muted"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50"
            >
              <LogIn size={18} />
              {loading ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">E-mailadres</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@voorbeeld.nl"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-text placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Wachtwoord</label>
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

            {/* Nieuw huishouden of bestaand */}
            <div className="flex bg-surface border border-border rounded-xl p-1">
              <button
                type="button"
                onClick={() => setJoinMode(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !joinMode ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                Nieuw huishouden
              </button>
              <button
                type="button"
                onClick={() => setJoinMode(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  joinMode ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                Bestaand huishouden
              </button>
            </div>

            {!joinMode ? (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Naam huishouden</label>
                <input
                  type="text"
                  required
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="Bijv. Familie De Vries"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-text placeholder:text-text-muted"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Uitnodigingscode</label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Plak de code uit de uitnodigingslink"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-text placeholder:text-text-muted font-mono text-sm"
                />
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50"
            >
              <UserPlus size={18} />
              {loading ? 'Bezig...' : 'Account aanmaken'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
