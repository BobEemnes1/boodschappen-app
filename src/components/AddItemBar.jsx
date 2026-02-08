import { useState } from 'react';
import { Plus, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export function AddItemBar({ onAdd }) {
  const [text, setText] = useState('');

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition(
    (transcript) => {
      // Split on commas or "en" for multiple items
      const parts = transcript
        .split(/,|\sen\s/)
        .map((s) => s.trim())
        .filter(Boolean);
      parts.forEach((part) => onAdd(part));
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky top-[52px] z-40 bg-bg px-4 pt-3 pb-2"
    >
      <div className="max-w-lg mx-auto flex gap-2">
        <div className="flex-1 flex items-center bg-surface border border-border rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Voeg item toe..."
            className="flex-1 px-4 py-3 bg-transparent outline-none text-text placeholder:text-text-muted"
          />
          {isSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-2 mr-1 rounded-full transition-colors ${
                isListening
                  ? 'bg-danger text-white animate-pulse'
                  : 'text-text-muted hover:text-primary hover:bg-primary/10'
              }`}
              title={isListening ? 'Stop luisteren' : 'Spreek je boodschap in'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-primary text-white p-3 rounded-xl shadow-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={22} />
        </button>
      </div>
      {isListening && (
        <p className="text-center text-sm text-primary mt-2 animate-pulse">
          Luisteren... Spreek je boodschap in
        </p>
      )}
    </form>
  );
}
