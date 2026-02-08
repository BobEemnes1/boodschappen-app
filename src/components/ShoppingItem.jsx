import { Check, Trash2, RotateCcw } from 'lucide-react';

export function ShoppingItem({ item, onToggle, onDelete }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-surface rounded-xl shadow-sm border transition-all duration-200 ${
        item.checked
          ? 'border-border/50 opacity-60'
          : 'border-border hover:shadow-md'
      }`}
    >
      <button
        onClick={() => onToggle(item.id)}
        className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
          item.checked
            ? 'bg-accent border-accent text-white'
            : 'border-border hover:border-primary'
        }`}
      >
        {item.checked && <Check size={16} strokeWidth={3} />}
      </button>

      <span
        className={`flex-1 text-base transition-all ${
          item.checked ? 'line-through text-text-muted' : 'text-text'
        }`}
      >
        {item.text}
      </span>

      {item.checked ? (
        <button
          onClick={() => onToggle(item.id)}
          className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          title="Terugzetten"
        >
          <RotateCcw size={16} />
        </button>
      ) : null}

      <button
        onClick={() => onDelete(item.id)}
        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        title="Verwijderen"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
