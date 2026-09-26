"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { shortDay } from "@/lib/labels";
import type { TargetSummary } from "@/lib/types";

export const COMPARE_COLORS = ["#7c5cff", "#22d3ee", "#fbbf24", "#34d399", "#f472b6"];

export function CompareTrend({ targets }: { targets: TargetSummary[] }) {
  const byDay = new Map<string, Record<string, number | string | null>>();
  for (const target of targets) {
    for (const point of target.series) {
      const row = byDay.get(point.day) || { day: point.day, label: shortDay(point.day) };
      row[target.name] = point.favorability_index === null ? null : Math.round(point.favorability_index * 10) / 10;
      byDay.set(point.day, row);
    }
  }
  const data = [...byDay.values()].sort((left, right) => String(left.day).localeCompare(String(right.day)));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid stroke="#1d2539" strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#8b95ab", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
        <YAxis tick={{ fill: "#8b95ab", fontSize: 11 }} axisLine={false} tickLine={false} domain={[-100, 100]} />
        <ReferenceLine y={0} stroke="#334155" />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#c3c9d8" }} iconType="circle" />
        {targets.map((target, position) => (
          <Line
            key={target.id}
            type="monotone"
            dataKey={target.name}
            stroke={COMPARE_COLORS[position % COMPARE_COLORS.length]}
            strokeWidth={2.5}
            dot={false}
            connectNulls
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CompareSplit({ targets }: { targets: TargetSummary[] }) {
  const data = targets.map((target) => ({
    name: target.name,
    positive: target.pct_positive,
    neutral: target.pct_neutral,
    negative: target.pct_negative,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke="#1d2539" strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#c3c9d8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#8b95ab", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ fill: "rgba(124,92,255,0.06)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#c3c9d8" }} iconType="circle" />
        <Bar dataKey="positive" name="Positivo" fill="#34d399" radius={[6, 6, 0, 0]} />
        <Bar dataKey="neutral" name="Neutro" fill="#475569" radius={[6, 6, 0, 0]} />
        <Bar dataKey="negative" name="Negativo" fill="#fb7185" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
