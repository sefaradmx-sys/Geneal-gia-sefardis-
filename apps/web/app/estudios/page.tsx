import { AlertTriangle, ArrowUpRight, CalendarDays, FlaskConical, FolderSearch, MessagesSquare, Plus, Target } from "lucide-react";
import Link from "next/link";
import { MiniSpark } from "@/components/charts/MiniSpark";
import { Shell } from "@/components/Shell";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, PageTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatDate, formatIndex, formatPct } from "@/lib/labels";
import type { StudyListItem, StudySummary, TargetSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

function heroOf(summary: StudySummary | null): TargetSummary | undefined {
  if (!summary) return undefined;
  return summary.targets.find((target) => target.kind === "government") || summary.targets[0];
}

export default async function EstudiosPage() {
  const response = await apiFetch("/studies");
  const studies = response.ok ? ((await response.json()) as StudyListItem[]) : [];
  const summaries = await Promise.all(
    studies.map(async (study) => {
      const summaryResponse = await apiFetch(`/studies/${study.id}/summary`);
      return summaryResponse.ok ? ((await summaryResponse.json()) as StudySummary) : null;
    }),
  );
  const totalMentions = summaries.reduce((total, summary) => total + (summary?.methodology.n || 0), 0);
  const totalAlerts = summaries.reduce((total, summary) => total + (summary?.alerts.length || 0), 0);
  const totalTargets = studies.reduce((total, study) => total + study.target_count, 0);

  return (
    <Shell>
      <PageTitle
        eyebrow="Panel"
        title="Estudios de monitoreo"
        description="Cada estudio sigue a perfiles, gobiernos o temas en una ventana de tiempo."
        action={
          <Link href="/estudios/nuevo" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            Nuevo estudio
          </Link>
        }
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Overview icon={FolderSearch} label="Estudios activos" value={studies.length} />
        <Overview icon={MessagesSquare} label="Menciones analizadas" value={totalMentions} />
        <Overview icon={AlertTriangle} label="Alertas abiertas" value={totalAlerts} tone={totalAlerts ? "text-neg" : "text-fg"} extra={`${totalTargets} objetivos`} />
      </section>

      {studies.length === 0 ? (
        <EmptyState icon={FolderSearch} title="Todavía no hay estudios" description="Crea el primero para empezar a medir sentimiento digital." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {studies.map((study, position) => {
            const summary = summaries[position];
            const hero = heroOf(summary);
            const value = hero?.favorability_index ?? null;
            return (
              <li key={study.id} className="animate-fade-up" style={{ animationDelay: `${position * 60}ms` }}>
                <Link href={`/estudios/${study.id}`} className="card card-hover group relative block overflow-hidden p-5">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/20" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {study.is_demo ? (
                          <span className="chip border-warn/30 bg-warn/10 text-warn">
                            <FlaskConical className="h-3 w-3" />
                            Demostración
                          </span>
                        ) : null}
                        {summary?.alerts.length ? (
                          <span className="chip border-neg/30 bg-neg/10 text-neg">
                            <AlertTriangle className="h-3 w-3" />
                            {summary.alerts.length} alerta{summary.alerts.length > 1 ? "s" : ""}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-2 font-display text-lg font-semibold text-fg group-hover:text-white">{study.name}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{study.description}</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>

                  {hero ? (
                    <div className="mt-5 grid grid-cols-[auto_1fr] items-end gap-5">
                      <div>
                        <p className="text-[11px] text-muted">{hero.name}</p>
                        <p className={cn("num font-display text-4xl font-semibold", (value ?? 0) >= 0 ? "text-pos" : "text-neg")}>{formatIndex(value)}</p>
                        <p className="text-[11px] text-muted">{formatPct(hero.pct_negative)} negativo</p>
                      </div>
                      <MiniSpark values={hero.series.map((point) => point.favorability_index ?? 0)} height={64} color={(value ?? 0) >= 0 ? "#34d399" : "#fb7185"} />
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(study.window_start)} — {formatDate(study.window_end)}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      {study.target_count} objetivos
                    </span>
                    {summary ? (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <MessagesSquare className="h-3.5 w-3.5" />
                          {summary.methodology.n.toLocaleString("es-MX")} menciones
                        </span>
                      </>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/estudios/nuevo"
              className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line text-muted transition hover:border-primary/50 hover:bg-primary/5 hover:text-fg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-elevated">
                <Plus className="h-5 w-5" />
              </span>
              <span className="mt-3 text-sm">Abrir un estudio nuevo</span>
            </Link>
          </li>
        </ul>
      )}
    </Shell>
  );
}

function Overview({ icon: Icon, label, value, tone = "text-fg", extra }: { icon: typeof Plus; label: string; value: number; tone?: string; extra?: string }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        <Icon className="h-4 w-4 text-muted" />
      </div>
      <p className={cn("num mt-2 font-display text-3xl font-semibold", tone)}>{value.toLocaleString("es-MX")}</p>
      {extra ? <p className="mt-1 text-[11px] text-muted">{extra}</p> : null}
    </div>
  );
}
