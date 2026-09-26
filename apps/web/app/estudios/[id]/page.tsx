import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Sparkline } from "@/components/Sparkline";
import { apiFetch } from "@/lib/api";
import { formatDate, formatIndex, formatPct, sentimentLabel, sourceLabel } from "@/lib/labels";
import type { StudySummary, TargetSummary } from "@/lib/types";

function heroOf(summary: StudySummary): TargetSummary | undefined {
  return summary.targets.find((target) => target.kind === "government") || summary.targets[0];
}

export default async function EstudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await apiFetch(`/studies/${id}/summary`);
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    return (
      <Shell>
        <p className="text-neg">No se pudo cargar el estudio.</p>
      </Shell>
    );
  }
  const summary = (await response.json()) as StudySummary;
  const hero = heroOf(summary);
  return (
    <Shell>
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Resumen</p>
      <h1 className="max-w-3xl font-serif text-3xl text-white md:text-4xl">{summary.name}</h1>
      <p className="mt-2 max-w-3xl text-sm text-mist">
        {formatDate(summary.window_start)} — {formatDate(summary.window_end)}. {summary.description}
      </p>
      {summary.is_demo ? (
        <p className="mt-4 rounded-md border border-brass/30 bg-brass/10 px-3 py-2 text-sm text-brass">
          Estas menciones son sintéticas y sirven para operar el tablero sin fuentes externas. No son opiniones de personas reales.
        </p>
      ) : null}
      {summary.alerts.map((alert) => (
        <p key={alert.target_name} className="mt-3 rounded-md border border-neg/40 bg-neg/10 px-3 py-2 text-sm text-neg">
          {alert.message}
        </p>
      ))}

      {hero ? (
        <>
          <section className="mt-6 grid gap-3 md:grid-cols-5">
            <Kpi label="Positivo" value={formatPct(hero.pct_positive)} tone="text-pos" />
            <Kpi label="Negativo" value={formatPct(hero.pct_negative)} tone="text-neg" />
            <Kpi label="Neutro" value={formatPct(hero.pct_neutral)} tone="text-mist" />
            <Kpi label="Aprobación digital" value={formatIndex(hero.favorability_index)} tone="text-brass" hint="Índice de favorabilidad" />
            <Kpi label="Volumen" value={hero.volume.toLocaleString("es-MX")} hint={`${hero.review_count} en revisión`} />
          </section>
          <p className="mt-2 text-xs text-mist">
            Alcance estimado {hero.reach.toLocaleString("es-MX")} · voz {formatPct(hero.share_of_voice)} · {hero.name}
          </p>
          <section className="mt-4 rounded-lg border border-line bg-panel p-4">
            <p className="text-xs text-mist">Tendencia diaria del índice</p>
            <Sparkline values={hero.series.map((point) => point.favorability_index ?? 0)} />
          </section>
        </>
      ) : (
        <p className="mt-6 text-mist">Este estudio todavía no tiene menciones clasificadas.</p>
      )}

      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {summary.targets.map((target) => (
          <article key={target.id} className="rounded-lg border border-line bg-panel px-4 py-3">
            <p className="text-xs text-mist">{target.kind === "government" ? "Gobierno" : target.kind === "topic" ? "Tema" : "Perfil"}</p>
            <h2 className="mt-1 text-sm text-white">{target.name}</h2>
            <p className="num mt-2 text-3xl text-brass">{formatIndex(target.favorability_index)}</p>
            <p className="text-xs text-mist">
              {formatPct(target.pct_positive)} / {formatPct(target.pct_negative)} / {formatPct(target.pct_neutral)}
            </p>
          </article>
        ))}
      </section>

      {summary.preferences.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-serif text-2xl text-white">Preferencia</h2>
          <ul className="mt-3 space-y-3">
            {summary.preferences.map((item) => (
              <li key={`${item.left_name}-${item.right_name}`} className="rounded-lg border border-line bg-panel px-4 py-3">
                <p className="text-white">{item.headline}</p>
                <p className="mt-1 text-xs text-mist">
                  n={item.n.toLocaleString("es-MX")} · intervalo de estabilidad ±{item.interval.toLocaleString("es-MX")} puntos
                  {item.reasons.length ? ` · temas: ${item.reasons.join(", ")}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hero ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Bars title="Por fuente" rows={hero.by_source.map((row) => ({ label: sourceLabel(row.key), value: row.pct_negative }))} />
          <Bars title="Coahuila por municipio" rows={hero.by_geo.map((row) => ({ label: row.key, value: row.volume }))} />
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="font-serif text-2xl text-white">Menciones que sostienen el número</h2>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {summary.evidence.map((item) => (
            <li key={item.id} className="bg-panel px-4 py-3">
              <p className="text-sm text-white">{item.text}</p>
              <p className="mt-1 text-xs text-mist">
                {sentimentLabel(item.sentiment)} · {sourceLabel(item.source)} · {item.municipality} · {item.theme} · peso {item.weight}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-line px-4 py-3 text-xs text-mist">
        <p>{summary.disclaimer}</p>
        {summary.known_biases.map((bias) => (
          <p key={bias} className="mt-2">
            {bias}
          </p>
        ))}
        <p className="mt-2">
          n={summary.methodology.n.toLocaleString("es-MX")} · vida media {summary.methodology.half_life_days} días · factor neutro{" "}
          {summary.methodology.neutral_factor} · confianza mínima {summary.methodology.min_confidence} · {summary.methodology.formula}
        </p>
      </section>
    </Shell>
  );
}

function Kpi({ label, value, tone = "text-white", hint }: { label: string; value: string; tone?: string; hint?: string }) {
  return (
    <article className="rounded-lg border border-line bg-panel px-4 py-3">
      <p className="text-xs text-mist">{label}</p>
      <p className={`num mt-2 text-4xl ${tone}`}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-mist">{hint}</p> : null}
    </article>
  );
}

function Bars({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <h2 className="text-sm text-white">{title}</h2>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex justify-between text-xs text-mist">
              <span>{row.label}</span>
              <span>{row.value.toLocaleString("es-MX")}</span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-white/5">
              <div className="h-1.5 rounded bg-brass" style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
