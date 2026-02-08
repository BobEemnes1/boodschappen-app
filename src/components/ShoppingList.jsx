import { ShoppingItem } from './ShoppingItem';
import { ShoppingBag } from 'lucide-react';

export function ShoppingList({ items, onToggle, onDelete }) {
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <ShoppingBag size={48} strokeWidth={1.5} className="mb-3 opacity-40" />
        <p className="text-lg font-medium">Lijst is leeg</p>
        <p className="text-sm mt-1">Voeg je eerste item toe!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {unchecked.map((item) => (
        <ShoppingItem
          key={item.id}
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}

      {checked.length > 0 && unchecked.length > 0 && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
            Afgevinkt ({checked.length})
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {checked.map((item) => (
        <ShoppingItem
          key={item.id}
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
