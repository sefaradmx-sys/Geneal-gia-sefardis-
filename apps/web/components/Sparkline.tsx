export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <p className="text-xs text-mist">Sin serie suficiente.</p>;
  }
  const width = 280;
  const height = 72;
  const min = Math.min(...values, -20);
  const max = Math.max(...values, 20);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" role="img" aria-label="Serie del índice">
      <polyline fill="none" stroke="#e4c27a" strokeWidth="2" points={points} />
    </svg>
  );
}
