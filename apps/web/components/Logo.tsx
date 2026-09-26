export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary via-[#6246ea] to-accent shadow-[0_8px_24px_-6px_rgba(124,92,255,0.8)] ${className}`}>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 17l5-9 4 6 3-4 6 7" />
      </svg>
    </span>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      <span>
        <span className="block font-display text-[15px] font-semibold leading-tight tracking-tight text-fg">LA MV Census</span>
        <span className="block text-[11px] leading-tight text-muted">Inteligencia de sentimiento cívico</span>
      </span>
    </span>
  );
}
