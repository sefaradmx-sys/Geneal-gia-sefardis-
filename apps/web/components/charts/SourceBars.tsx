"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { sourceLabel } from "@/lib/labels";
import type { Slice } from "@/lib/types";

export function SourceBars({ rows }: { rows: Slice[] }) {
  const data = rows.map((row) => ({
    label: sourceLabel(row.key),
    positive: row.pct_positive,
    negative: row.pct_negative,
    neutral: row.pct_neutral,
  }));
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted">Sin fuentes con menciones incluidas.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 52)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap={14}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey="label" width={112} tick={{ fill: "#c3c9d8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ fill: "rgba(124,92,255,0.06)" }} />
        <Bar dataKey="positive" name="Positivo" stackId="s" fill="#34d399" radius={[6, 0, 0, 6]} />
        <Bar dataKey="neutral" name="Neutro" stackId="s" fill="#475569" />
        <Bar dataKey="negative" name="Negativo" stackId="s" fill="#fb7185" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
