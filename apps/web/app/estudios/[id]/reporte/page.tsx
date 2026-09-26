import { FileSpreadsheet, FileText, ShieldCheck } from "lucide-react";
import { CoveragePanel } from "@/components/CoveragePanel";
import { LogoMark } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { apiFetch } from "@/lib/api";
import { withBase } from "@/lib/base-path";
import { formatDate, formatIndex, formatPct, sentimentLabel, sourceLabel } from "@/lib/labels";
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
    <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
      <aside className="space-y-3 print:hidden">
        <ExportCard
          href={withBase(`/estudios/${id}/archivo/pdf`)}
          icon={FileText}
          tone="from-neg/20 text-neg"
          title="Reporte PDF"
          detail="Informe con portada, Nueva Expresión, prensa excluida, huecos de redes y catálogo de cada nota con URL."
        />
        <ExportCard
          href={withBase(`/estudios/${id}/archivo/xlsx`)}
          icon={FileSpreadsheet}
          tone="from-pos/20 text-pos"
          title="Menciones en Excel"
          detail="Hasta 5,000 filas con texto, fuente, fecha, sentimiento, postura, tema, lugar y confianza."
        />
        <div className="card flex items-center justify-between p-4">
          <p className="text-sm text-muted">Vista de impresión</p>
          <PrintButton />
        </div>
        <p className="flex items-start gap-2 px-1 text-xs text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pos" />
          Cada descarga queda en la auditoría con usuario, formato y hora.
        </p>
      </aside>

      <article className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] print:rounded-none print:shadow-none">
        <header className="flex items-center justify-between bg-gradient-to-r from-[#1b1340] via-[#2a1d6b] to-[#0e4f63] px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="font-display text-lg font-semibold">LA MV Census</p>
              <p className="text-xs text-white/70">Inteligencia de sentimiento cívico</p>
            </div>
          </div>
          <p className="text-right text-xs text-white/70">
            {formatDate(summary.window_start)} — {formatDate(summary.window_end)}
          </p>
        </header>
        <div className="space-y-6 px-8 py-8">
          <div>
            <h2 className="font-display text-2xl font-semibold">{summary.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{summary.description}</p>
            <p className="mt-3 inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{summary.disclaimer}</p>
            {summary.is_demo ? <p className="mt-2 text-xs text-amber-700">Las menciones de este corte son sintéticas. No son opiniones de personas reales.</p> : null}
          </div>
          <div className="print:hidden">
            <CoveragePanel coverage={summary.coverage} />
          </div>

          {hero ? (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{hero.name}</p>
              <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                <PaperStat label="Índice" value={formatIndex(hero.favorability_index)} tone="text-violet-700" />
                <PaperStat label="Positivo" value={formatPct(hero.pct_positive)} tone="text-emerald-600" />
                <PaperStat label="Negativo" value={formatPct(hero.pct_negative)} tone="text-rose-600" />
                <PaperStat label="Volumen" value={hero.volume.toLocaleString("es-MX")} tone="text-slate-900" />
              </div>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="bg-emerald-500" style={{ width: `${hero.pct_positive}%` }} />
                <div className="bg-slate-300" style={{ width: `${hero.pct_neutral}%` }} />
                <div className="bg-rose-500" style={{ width: `${hero.pct_negative}%` }} />
              </div>
            </section>
          ) : null}

          {summary.preferences[0] || summary.alerts[0] ? (
            <section className="grid gap-3 md:grid-cols-2">
              {summary.preferences[0] ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Preferencia</p>
                  <p className="mt-1">{summary.preferences[0].headline}</p>
                </div>
              ) : null}
              {summary.alerts[0] ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Alerta</p>
                  <p className="mt-1">{summary.alerts[0].message}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          <p className="break-after-page rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-slate-600">{summary.methodology.formula}</p>

          <section>
            <h3 className="font-display text-lg font-semibold">Menciones que sostienen el número</h3>
            <ul className="mt-3 divide-y divide-slate-100">
              {summary.evidence.slice(0, 8).map((item) => (
                <li key={item.id} className="py-2.5 text-sm">
                  <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                    {sentimentLabel(item.sentiment)} · {sourceLabel(item.source)}
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </section>
          {summary.known_biases.map((bias) => (
            <p key={bias} className="text-xs text-slate-500">
              {bias}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}

function ExportCard({ href, icon: Icon, tone, title, detail }: { href: string; icon: typeof FileText; tone: string; title: string; detail: string }) {
  return (
    <a href={href} className="card card-hover group flex gap-4 p-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br to-transparent ${tone}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span>
        <span className="block font-medium text-fg group-hover:text-primary">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">{detail}</span>
      </span>
    </a>
  );
}

function PaperStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`num mt-1 font-display text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
