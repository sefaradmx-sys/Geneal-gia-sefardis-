"use client";

import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { shortDay } from "@/lib/labels";
import type { SeriesPoint } from "@/lib/types";

export function TrendChart({ data, height = 300 }: { data: SeriesPoint[]; height?: number }) {
  const rows = data.map((point) => ({
    label: shortDay(point.day),
    index: point.favorability_index === null ? null : Math.round(point.favorability_index * 10) / 10,
    negative: Math.round(point.pct_negative * 10) / 10,
    volume: point.volume,
  }));
  if (rows.length < 2) {
    return <p className="py-16 text-center text-sm text-muted">Todavía no hay serie suficiente para dibujar la tendencia.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="trend-index" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1d2539" strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#8b95ab", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
        <YAxis
          yAxisId="index"
          tick={{ fill: "#8b95ab", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          domain={[(min: number) => Math.max(-100, Math.floor((min - 5) / 20) * 20), (max: number) => Math.min(100, Math.ceil((max + 5) / 20) * 20)]}
        />
        <YAxis yAxisId="volume" orientation="right" hide />
        <ReferenceLine yAxisId="index" y={0} stroke="#334155" />
        <Bar yAxisId="volume" dataKey="volume" name="Volumen" fill="#22d3ee" fillOpacity={0.16} radius={[4, 4, 0, 0]} />
        <Line yAxisId="index" type="monotone" dataKey="negative" name="% negativo" stroke="#fb7185" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        <Area
          yAxisId="index"
          type="monotone"
          dataKey="index"
          name="Índice"
          stroke="#7c5cff"
          strokeWidth={2.5}
          fill="url(#trend-index)"
          connectNulls
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#0c1120" }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#7c5cff", strokeOpacity: 0.3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
