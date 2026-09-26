"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { AnimatedNumber } from "@/components/live/AnimatedNumber";

export function SentimentDonut({
  positive,
  negative,
  neutral,
  index,
}: {
  positive: number;
  negative: number;
  neutral: number;
  index: number | null;
}) {
  const data = [
    { name: "Positivo", value: positive, color: "#34d399" },
    { name: "Negativo", value: negative, color: "#fb7185" },
    { name: "Neutro", value: neutral, color: "#64748b" },
  ];
  return (
    <div>
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={3} stroke="none" cornerRadius={6} startAngle={90} endAngle={-270}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip suffix="%" />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] uppercase tracking-wider text-muted">Índice</span>
          <AnimatedNumber value={index === null ? null : Math.round(index)} signed className="num font-display text-4xl font-semibold text-fg" />
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
        {data.map((entry) => (
          <li key={entry.name} className="rounded-xl border border-line bg-elevated/50 px-2 py-2">
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              {entry.name}
            </p>
            <p className="num mt-0.5 font-display text-lg text-fg">{entry.value.toLocaleString("es-MX", { maximumFractionDigits: 1 })}%</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
