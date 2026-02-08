import { Heart } from 'lucide-react';

export function SponsorBar() {
  return (
    <div className="mt-auto py-4 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-surface border border-border rounded-xl text-xs text-text-muted">
          <span>Sponsored by</span>
          <Heart size={12} className="text-danger fill-danger" />
          <span className="font-medium text-text">BoodschappenApp</span>
        </div>
      </div>
    </div>
  );
}
