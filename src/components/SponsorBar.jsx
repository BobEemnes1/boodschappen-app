export function SponsorBar() {
  return (
    <div className="mt-auto pt-6 pb-4 px-4">
      <div className="max-w-lg mx-auto">
        <a
          href="https://bobcount.nl"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 text-xs text-text-muted/70 hover:text-primary transition-colors"
        >
          <span>Mogelijk gemaakt door</span>
          <span className="font-medium text-text-muted hover:text-primary">Bobcount.nl</span>
        </a>
      </div>
    </div>
  );
}
