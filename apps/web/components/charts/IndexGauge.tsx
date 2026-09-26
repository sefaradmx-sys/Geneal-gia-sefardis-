export function IndexGauge({ value, size = 180 }: { value: number | null; size?: number }) {
  const radius = 80;
  const arc = Math.PI * radius;
  const normalized = value === null ? 0 : Math.min(1, Math.max(0, (value + 100) / 200));
  const angle = Math.PI * (1 - normalized);
  const needleX = 100 + Math.cos(angle) * (radius - 18);
  const needleY = 100 - Math.sin(angle) * (radius - 18);
  return (
    <svg viewBox="0 0 200 118" width={size} height={(size * 118) / 200} role="img" aria-label="Índice de favorabilidad">
      <defs>
        <linearGradient id="gauge-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1d2539" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke="url(#gauge-stroke)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${arc * normalized} ${arc}`}
      />
      {value !== null ? (
        <>
          <line x1="100" y1="100" x2={needleX} y2={needleY} stroke="#e6e9f2" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="6" fill="#e6e9f2" />
        </>
      ) : null}
      <text x="20" y="116" fill="#8b95ab" fontSize="10" textAnchor="middle">
        −100
      </text>
      <text x="180" y="116" fill="#8b95ab" fontSize="10" textAnchor="middle">
        +100
      </text>
    </svg>
  );
}
