import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Eye,
  Info,
  MapPin,
  MessagesSquare,
  Scale,
  Sigma,
  Swords,
  ThumbsDown,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoveragePanel } from "@/components/CoveragePanel";
import { MiniSpark } from "@/components/charts/MiniSpark";
import { SentimentDonut } from "@/components/charts/SentimentDonut";
import { SourceBars } from "@/components/charts/SourceBars";
import { TrendChart } from "@/components/charts/TrendChart";
import { AnimatedNumber } from "@/components/live/AnimatedNumber";
import { Avatar, SentimentBadge, SourceBadge } from "@/components/ui/badges";
import { Card, CardHeader } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatCompact, formatIndex, formatPct, targetKindLabel, timeAgo } from "@/lib/labels";
import type { SeriesPoint, StudySummary, TargetSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

function pickHero(summary: StudySummary, requested?: string): TargetSummary | undefined {
  return (
    summary.targets.find((target) => target.id === requested) ||
    summary.targets.find((target) => target.kind === "government") ||
    summary.targets[0]
  );
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function weekDelta(series: SeriesPoint[], pick: (point: SeriesPoint) => number | null, mode: "avg" | "sum" = "avg") {
  const last = series.slice(-7).map(pick).filter((value): value is number => value !== null);
  const prev = series.slice(-14, -7).map(pick).filter((value): value is number => value !== null);
  if (!last.length || !prev.length) {
    return null;
  }
  if (mode === "sum") {
    const lastSum = last.reduce((total, value) => total + value, 0);
    const prevSum = prev.reduce((total, value) => total + value, 0);
    return prevSum ? ((lastSum - prevSum) / prevSum) * 100 : null;
  }
  const lastAvg = average(last);
  const prevAvg = average(prev);
  return lastAvg === null || prevAvg === null ? null : lastAvg - prevAvg;
}

export default async function EstudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ objetivo?: string }>;
}) {
  const { id } = await params;
  const { objetivo } = await searchParams;
  const response = await apiFetch(`/studies/${id}/summary`);
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    return <p className="text-neg">No se pudo cargar el estudio.</p>;
  }
  const summary = (await response.json()) as StudySummary;
  const hero = pickHero(summary, objetivo);
  const now = new Date();

  if (!hero) {
    return (
      <Card>
        <p className="text-muted">Este estudio todavía no tiene objetivos ni menciones clasificadas. Agrega objetivos y carga un archivo para ver el tablero.</p>
      </Card>
    );
  }

  const indexDelta = weekDelta(hero.series, (point) => point.favorability_index);
  const negativeDelta = weekDelta(hero.series, (point) => point.pct_negative);
  const volumeDelta = weekDelta(hero.series, (point) => point.volume, "sum");
  const ranked = [...summary.targets].sort((left, right) => (right.favorability_index ?? -999) - (left.favorability_index ?? -999));
  const maxGeo = Math.max(...hero.by_geo.map((row) => row.volume), 1);

  return (
    <div className="space-y-5">
      {summary.alerts.map((alert) => (
        <Link
          key={alert.target_name + alert.rule}
          href={`/estudios/${id}/alertas`}
          className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-neg/30 bg-gradient-to-r from-neg/15 via-neg/5 to-transparent p-4 transition hover:border-neg/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neg/20 text-neg">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">Alerta de negatividad · {alert.target_name}</p>
            <p className="mt-0.5 text-sm text-muted">{alert.message}</p>
          </div>
          <span className="num hidden font-display text-2xl font-semibold text-neg sm:block">+{Math.round(alert.delta_points)} pts</span>
          <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-1 group-hover:text-fg" />
        </Link>
      ))}

      <CoveragePanel coverage={summary.coverage} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Objetivo en foco</span>
        {summary.targets.map((target) => {
          const active = target.id === hero.id;
          return (
            <Link
              key={target.id}
              href={`/estudios/${id}?objetivo=${target.id}`}
              scroll={false}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                active ? "border-primary/60 bg-primary/15 text-fg" : "border-line bg-surface/60 text-muted hover:border-primary/30 hover:text-fg",
              )}
            >
              {target.name}
              <span className={cn("num font-semibold", (target.favorability_index ?? 0) >= 0 ? "text-pos" : "text-neg")}>
                {formatIndex(target.favorability_index)}
              </span>
            </Link>
          );
        })}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Aprobación digital"
          hint="Índice de favorabilidad, −100 a +100"
          icon={Scale}
          value={hero.favorability_index === null ? null : Math.round(hero.favorability_index)}
          signed
          tone={(hero.favorability_index ?? 0) >= 0 ? "text-pos" : "text-neg"}
          delta={indexDelta}
          deltaUnit=" pts"
          spark={hero.series.map((point) => point.favorability_index ?? 0)}
          sparkColor="#7c5cff"
        />
        <KpiCard
          label="Negatividad"
          hint="Peso negativo sobre el total"
          icon={ThumbsDown}
          value={hero.pct_negative}
          decimals={1}
          suffix="%"
          tone="text-neg"
          delta={negativeDelta}
          deltaUnit=" pts"
          invertDelta
          spark={hero.series.map((point) => point.pct_negative)}
          sparkColor="#fb7185"
        />
        <KpiCard
          label="Volumen incluido"
          hint={`${hero.review_count.toLocaleString("es-MX")} en revisión humana`}
          icon={MessagesSquare}
          value={hero.volume}
          tone="text-fg"
          delta={volumeDelta}
          deltaUnit="%"
          spark={hero.series.map((point) => point.volume)}
          sparkColor="#22d3ee"
        />
        <KpiCard
          label="Alcance estimado"
          hint={`Voz del objetivo ${formatPct(hero.share_of_voice)}`}
          icon={Eye}
          value={hero.reach}
          compact
          tone="text-fg"
          footer={
            <div className="mt-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full bg-pos" style={{ width: `${hero.pct_positive}%` }} />
                <div className="h-full bg-neu/60" style={{ width: `${hero.pct_neutral}%` }} />
                <div className="h-full bg-neg" style={{ width: `${hero.pct_negative}%` }} />
              </div>
              <p className="mt-2 flex justify-between text-[11px] text-muted">
                <span className="text-pos">{formatPct(hero.pct_positive)} pos.</span>
                <span>{formatPct(hero.pct_neutral)} neu.</span>
                <span className="text-neg">{formatPct(hero.pct_negative)} neg.</span>
              </p>
            </div>
          }
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            icon={Activity}
            title="Tendencia del índice"
            subtitle={`${hero.name} · índice diario, % negativo y volumen`}
            action={
              <div className="hidden items-center gap-3 text-[11px] text-muted sm:flex">
                <Legend color="bg-primary" label="Índice" />
                <Legend color="bg-neg" label="% negativo" />
                <Legend color="bg-accent/50" label="Volumen" />
              </div>
            }
          />
          <TrendChart data={hero.series} />
        </Card>
        <Card>
          <CardHeader icon={BarChart3} title="Composición del sentimiento" subtitle="Ponderado por peso de cada mención" />
          <SentimentDonut positive={hero.pct_positive} negative={hero.pct_negative} neutral={hero.pct_neutral} index={hero.favorability_index} />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader icon={Trophy} title="Ranking de objetivos" subtitle="Clic en un objetivo para ponerlo en foco" />
          <ul className="space-y-2">
            {ranked.map((target, position) => {
              const value = target.favorability_index ?? 0;
              const width = Math.min(50, Math.abs(value) / 2);
              return (
                <li key={target.id}>
                  <Link
                    href={`/estudios/${id}?objetivo=${target.id}`}
                    scroll={false}
                    className={cn(
                      "grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-xl border px-3 py-3 transition md:grid-cols-[28px_minmax(0,220px)_1fr_auto]",
                      target.id === hero.id ? "border-primary/40 bg-primary/10" : "border-transparent hover:border-line hover:bg-elevated/50",
                    )}
                  >
                    <span className="num text-center font-display text-sm text-muted">{position + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-fg">{target.name}</p>
                      <p className="text-[11px] text-muted">
                        {targetKindLabel(target.kind)} · {target.volume.toLocaleString("es-MX")} menciones
                      </p>
                    </div>
                    <div className="relative hidden h-2.5 rounded-full bg-line md:block">
                      <span className="absolute left-1/2 top-[-3px] h-4 w-px bg-muted/50" />
                      <span
                        className={cn("absolute top-0 h-full origin-left animate-bar-grow rounded-full", value >= 0 ? "bg-gradient-to-r from-pos/60 to-pos" : "bg-gradient-to-l from-neg/60 to-neg")}
                        style={value >= 0 ? { left: "50%", width: `${width}%` } : { right: "50%", width: `${width}%` }}
                      />
                    </div>
                    <span className={cn("num w-14 text-right font-display text-lg font-semibold", value >= 0 ? "text-pos" : "text-neg")}>
                      {formatIndex(target.favorability_index)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardHeader icon={Swords} title="Duelo de preferencia" subtitle="Solo entre perfiles comparables" />
          {summary.preferences.length === 0 ? (
            <p className="text-sm text-muted">No hay dos perfiles comparables en este estudio.</p>
          ) : (
            <ul className="space-y-3">
              {summary.preferences.slice(0, 3).map((item) => (
                <li key={`${item.left_name}-${item.right_name}`} className="rounded-xl border border-line bg-elevated/40 p-3.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar name={item.left_name} className="h-7 w-7 text-[10px]" />
                      <span className="truncate text-fg">{item.left_name}</span>
                    </span>
                    <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">VS</span>
                    <span className="flex min-w-0 items-center justify-end gap-2">
                      <span className="truncate text-fg">{item.right_name}</span>
                      <Avatar name={item.right_name} className="h-7 w-7 text-[10px]" />
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-fg/90">{item.headline}</p>
                  <p className="mt-2 text-[11px] text-muted">
                    Diferencia {Math.round(item.delta)} pts · estabilidad ±{item.interval.toLocaleString("es-MX")} · n={item.n.toLocaleString("es-MX")}
                  </p>
                </li>
              ))}
              <Link href={`/estudios/${id}/comparar`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Comparar a detalle <ArrowRight className="h-3 w-3" />
              </Link>
            </ul>
          )}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={BarChart3} title="Sentimiento por fuente" subtitle="El índice no corrige el sesgo de cada red: lo muestra" />
          <SourceBars rows={hero.by_source} />
        </Card>
        <Card>
          <CardHeader icon={MapPin} title="Coahuila por municipio" subtitle="Volumen incluido y negatividad" />
          <ul className="space-y-3">
            {hero.by_geo.slice(0, 8).map((row) => (
              <li key={row.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-fg">{row.key}</span>
                  <span className="text-xs text-muted">
                    <span className="num text-fg">{row.volume.toLocaleString("es-MX")}</span> · <span className="text-neg">{formatPct(row.pct_negative)} neg.</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full origin-left animate-bar-grow rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${(row.volume / maxGeo) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            icon={MessagesSquare}
            title="Menciones que sostienen el número"
            subtitle="Las de mayor peso en la dirección del índice"
            action={
              <Link href={`/estudios/${id}/menciones`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {summary.evidence.slice(0, 8).map((item) => (
              <li key={item.id} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                <Avatar name={item.author_handle || item.source} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span className="font-medium text-fg">{item.author_handle ? `@${item.author_handle.replace(/^@/, "")}` : "Fuente"}</span>
                    <span>·</span>
                    <span>{timeAgo(item.published_at, now)}</span>
                    {item.municipality ? (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.municipality}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-fg/90">{item.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <SentimentBadge value={item.sentiment} />
                    <SourceBadge value={item.source} />
                    {item.theme ? <span className="chip">#{item.theme}</span> : null}
                    <span className="chip num">peso {item.weight.toLocaleString("es-MX", { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="h-fit">
          <CardHeader icon={Sigma} title="Metodología" subtitle="Cómo se calcula cada número" />
          <div className="space-y-3 text-xs text-muted">
            <p className="rounded-xl border border-line bg-canvas/60 p-3 font-mono text-[11px] leading-relaxed text-fg/80">{summary.methodology.formula}</p>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Menciones" value={summary.methodology.n.toLocaleString("es-MX")} />
              <Stat label="Vida media" value={`${summary.methodology.half_life_days} días`} />
              <Stat label="Factor neutro" value={String(summary.methodology.neutral_factor)} />
              <Stat label="Confianza mínima" value={String(summary.methodology.min_confidence)} />
            </div>
            {summary.known_biases.map((bias) => (
              <p key={bias} className="flex gap-2 rounded-xl border border-warn/20 bg-warn/5 p-3 leading-relaxed text-warn/90">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {bias}
              </p>
            ))}
            <p className="rounded-xl border border-line p-3 font-medium text-fg">{summary.disclaimer}</p>
            {summary.is_demo ? <p>Estas menciones son sintéticas y sirven para operar el tablero sin fuentes externas. No son opiniones de personas reales.</p> : null}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-elevated/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider">{label}</p>
      <p className="num mt-0.5 text-sm text-fg">{value}</p>
    </div>
  );
}

function KpiCard({
  label,
  hint,
  icon: Icon,
  value,
  decimals = 0,
  suffix = "",
  signed = false,
  compact = false,
  tone,
  delta,
  deltaUnit = "",
  invertDelta = false,
  spark,
  sparkColor,
  footer,
}: {
  label: string;
  hint: string;
  icon: typeof Scale;
  value: number | null;
  decimals?: number;
  suffix?: string;
  signed?: boolean;
  compact?: boolean;
  tone: string;
  delta?: number | null;
  deltaUnit?: string;
  invertDelta?: boolean;
  spark?: number[];
  sparkColor?: string;
  footer?: React.ReactNode;
}) {
  const good = delta === null || delta === undefined ? null : invertDelta ? delta < 0 : delta > 0;
  return (
    <article className="card card-hover relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elevated text-muted">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        {compact && value !== null ? (
          <span className={cn("num font-display text-3xl font-semibold", tone)}>{formatCompact(value)}</span>
        ) : (
          <AnimatedNumber value={value} decimals={decimals} suffix={suffix} signed={signed} className={cn("num font-display text-3xl font-semibold", tone)} />
        )}
        {delta !== null && delta !== undefined ? (
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              good ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg",
            )}
            title="Últimos 7 días contra los 7 anteriores"
          >
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta >= 0 ? "+" : ""}
            {delta.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
            {deltaUnit}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-muted">{hint}</p>
      {spark ? (
        <div className="-mx-1 mt-2">
          <MiniSpark values={spark} color={sparkColor} />
        </div>
      ) : null}
      {footer}
    </article>
  );
}
