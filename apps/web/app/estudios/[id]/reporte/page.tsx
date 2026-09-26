import { apiFetch } from "@/lib/api";
import { formatDate, formatIndex, formatPct, sourceLabel } from "@/lib/labels";
import type { StudySummary, TargetSummary } from "@/lib/types";

function heroOf(summary: StudySummary): TargetSummary | undefined {
  return summary.targets.find((target) => target.kind === "government") || summary.targets[0];
}

export default async function ReportePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await apiFetch(`/studies/${id}/summary`);
  if (!response.ok) {
    return <p className="text-neg">No se pudo armar el reporte.</p>;
  }
  const summary = (await response.json()) as StudySummary;
  const hero = heroOf(summary);
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <a className="rounded-md bg-brass px-3 py-2 text-sm text-ink" href={`/estudios/${id}/archivo/pdf`}>
          Descargar PDF
        </a>
        <a className="rounded-md border border-line px-3 py-2 text-sm text-white" href={`/estudios/${id}/archivo/xlsx`}>
          Descargar XLSX
        </a>
      </div>
      <article className="rounded-lg border border-line bg-white px-6 py-6 text-ink print:border-0">
        <p className="text-xs uppercase tracking-[0.16em]">LA MV Census</p>
        <h1 className="mt-1 font-serif text-3xl">{summary.name}</h1>
        <p className="mt-2 text-sm">
          {formatDate(summary.window_start)} — {formatDate(summary.window_end)}
        </p>
        <p className="mt-4 text-sm">{summary.disclaimer}</p>
        {summary.is_demo ? (
          <p className="mt-2 text-sm">Las menciones de este corte son sintéticas. No son opiniones de personas reales.</p>
        ) : null}
        {hero ? (
          <section className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <p>Positivo {formatPct(hero.pct_positive)}</p>
            <p>Negativo {formatPct(hero.pct_negative)}</p>
            <p>Neutro {formatPct(hero.pct_neutral)}</p>
            <p>Índice {formatIndex(hero.favorability_index)}</p>
          </section>
        ) : null}
        {summary.preferences[0] ? <p className="mt-4 text-sm">{summary.preferences[0].headline}</p> : null}
        <p className="mt-4 break-after-page text-xs">{summary.methodology.formula}</p>
        <h2 className="mt-8 font-serif text-2xl">Menciones que sostienen el número</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {summary.evidence.slice(0, 8).map((item) => (
            <li key={item.id}>
              {sourceLabel(item.source)} · {item.text}
            </li>
          ))}
        </ul>
        {summary.known_biases.map((bias) => (
          <p key={bias} className="mt-3 text-xs">
            {bias}
          </p>
        ))}
        <p className="mt-4 text-xs">{summary.disclaimer}</p>
      </article>
    </>
  );
}
