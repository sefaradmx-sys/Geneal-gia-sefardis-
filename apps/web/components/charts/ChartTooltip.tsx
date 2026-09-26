"use client";

type Entry = { name?: string | number; value?: number | string | readonly (number | string)[]; color?: string; dataKey?: string | number };

export function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: readonly Entry[];
  label?: string | number;
  suffix?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="rounded-xl border border-line bg-elevated/95 px-3 py-2 text-xs shadow-2xl backdrop-blur">
      {label !== undefined ? <p className="mb-1 font-medium text-fg">{label}</p> : null}
      {payload.map((entry) => (
        <p key={String(entry.dataKey ?? entry.name)} className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}
          <span className="num ml-auto pl-3 font-medium text-fg">
            {typeof entry.value === "number" ? entry.value.toLocaleString("es-MX", { maximumFractionDigits: 1 }) : String(entry.value ?? "")}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  );
}
