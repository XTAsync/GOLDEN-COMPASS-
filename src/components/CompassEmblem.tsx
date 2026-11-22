// Flat mark: a ring, four ticks and a needle in one solid gold.
export function CompassEmblem({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" fill="none" aria-hidden="true">
      <circle cx="35" cy="35" r="30" stroke="var(--gold)" strokeWidth="1.5" />
      <g stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="35" y1="7" x2="35" y2="12" />
        <line x1="35" y1="58" x2="35" y2="63" />
        <line x1="7" y1="35" x2="12" y2="35" />
        <line x1="58" y1="35" x2="63" y2="35" />
      </g>
      <polygon points="35,14 39,35 35,56 31,35" fill="var(--gold)" opacity="0.28" />
      <polygon points="35,14 39,35 31,35" fill="var(--gold)" />
      <circle cx="35" cy="35" r="3" fill="var(--ink-1)" stroke="var(--gold)" strokeWidth="1.5" />
    </svg>
  );
}
