import { Check, GitCompareArrows, LineChart, Scale, Swords } from "lucide-react";
import { COMPARE_COLORS, CompareSplit, CompareTrend } from "@/components/charts/CompareCharts";
import { IndexGauge } from "@/components/charts/IndexGauge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatIndex, formatPct, targetKindLabel } from "@/lib/labels";
import type { StudySummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type Compared = {
  disclaimer: string;
  targets: StudySummary["targets"];
  preferences: StudySummary["preferences"];
};

export default async function CompararPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const summaryResponse = await apiFetch(`/studies/${id}/summary`);
  if (!summaryResponse.ok) {
    return <p className="text-neg">No se pudo cargar la comparación.</p>;
  }
  const summary = (await summaryResponse.json()) as StudySummary;
  const rawIds = query.ids;
  const requested = (Array.isArray(rawIds) ? rawIds : (rawIds || "").split(",")).map((item) => item.trim()).filter(Boolean);
  const defaults = summary.targets.filter((target) => target.comparable).map((target) => target.id);
  const selected = new Set(requested.length ? requested : defaults);

  let compared: Compared | null = null;
  if (selected.size >= 2) {
    const response = await apiFetch(`/studies/${id}/compare?ids=${[...selected].join(",")}`);
    if (response.ok) {
      compared = (await response.json()) as Compared;
    }
  }
  const leader = compared ? [...compared.targets].sort((a, b) => (b.favorability_index ?? -999) - (a.favorability_index ?? -999))[0] : null;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          icon={GitCompareArrows}
          title="Elige qué comparar"
          subtitle="La diferencia es de índice de sentimiento digital. El intervalo de estabilidad no es un margen de encuesta."
        />
        <form action={`/estudios/${id}/comparar`}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {summary.targets.map((target) => (
              <label key={target.id} className="group relative cursor-pointer">
                <input type="checkbox" name="ids" value={target.id} defaultChecked={selected.has(target.id)} className="peer sr-only" />
                <div className="h-full rounded-xl border border-line bg-elevated/40 p-3.5 transition peer-checked:border-primary/60 peer-checked:bg-primary/10 peer-focus-visible:ring-2 peer-focus-visible:ring-primary group-hover:border-primary/30">
                  <p className="pr-6 text-sm text-fg">{target.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {targetKindLabel(target.kind)}
                    {target.comparable ? " · comparable" : ""}
                  </p>
                  <p className={cn("num mt-2 font-display text-2xl font-semibold", (target.favorability_index ?? 0) >= 0 ? "text-pos" : "text-neg")}>
                    {formatIndex(target.favorability_index)}
                  </p>
                </div>
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md border border-line text-transparent transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              </label>
            ))}
          </div>
          <button type="submit" className={cn(buttonVariants(), "mt-4")}>
            <Scale className="h-4 w-4" />
            Comparar selección
          </button>
        </form>
      </Card>

      {!compared ? (
        <EmptyState icon={Swords} title="Elige al menos dos objetivos" description="Marca dos o más tarjetas y pulsa Comparar selección." />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {compared.targets.map((target, position) => (
              <article key={target.id} className="card card-hover relative overflow-hidden p-5 text-center">
                <span className="absolute inset-x-0 top-0 h-1" style={{ background: COMPARE_COLORS[position % COMPARE_COLORS.length] }} />
                {leader?.id === target.id ? (
                  <span className="absolute right-3 top-3 rounded-full bg-warn/15 px-2 py-0.5 text-[10px] font-semibold text-warn">Líder</span>
                ) : null}
                <p className="text-sm font-medium text-fg">{target.name}</p>
                <p className="text-[11px] text-muted">{targetKindLabel(target.kind)}</p>
                <div className="mt-3 flex justify-center">
                  <IndexGauge value={target.favorability_index} size={170} />
                </div>
                <p className={cn("num -mt-1 font-display text-3xl font-semibold", (target.favorability_index ?? 0) >= 0 ? "text-pos" : "text-neg")}>
                  {formatIndex(target.favorability_index)}
                </p>
                <p className="mt-2 text-xs text-muted">
                  <span className="text-pos">{formatPct(target.pct_positive)}</span> · {formatPct(target.pct_neutral)} ·{" "}
                  <span className="text-neg">{formatPct(target.pct_negative)}</span>
                </p>
                <p className="mt-1 text-[11px] text-muted">n={target.volume.toLocaleString("es-MX")}</p>
              </article>
            ))}
          </section>

          {compared.preferences.length ? (
            <section className="grid gap-3 lg:grid-cols-2">
              {compared.preferences.map((item) => (
                <div key={item.headline} className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-surface p-5">
                  <p className="eyebrow">Preferencia del índice</p>
                  <p className="mt-2 font-display text-lg leading-snug text-fg">{item.headline}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="chip">Diferencia {Math.round(item.delta)} pts</span>
                    <span className="chip">Estabilidad ±{item.interval.toLocaleString("es-MX")}</span>
                    <span className="chip">n={item.n.toLocaleString("es-MX")}</span>
                    {item.reasons.map((reason) => (
                      <span key={reason} className="chip border-primary/30 text-primary">
                        #{reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : (
            <p className="text-xs text-muted">La frase de preferencia solo se calcula entre perfiles marcados como comparables.</p>
          )}

          <section className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader icon={LineChart} title="Índice diario lado a lado" subtitle="Cada línea es un objetivo" />
              <CompareTrend targets={compared.targets} />
            </Card>
            <Card className="xl:col-span-2">
              <CardHeader icon={Scale} title="Composición" subtitle="Positivo, neutro y negativo ponderados" />
              <CompareSplit targets={compared.targets} />
            </Card>
          </section>
          <p className="text-xs text-muted">{compared.disclaimer}</p>
        </>
      )}
    </div>
  );
}
