import { CalendarDays, ChevronRight, FileDown, FlaskConical, Search } from "lucide-react";
import Link from "next/link";
import { LiveRefresh } from "@/components/live/LiveRefresh";
import { Shell } from "@/components/Shell";
import { StudyNav } from "@/components/StudyNav";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { withBase } from "@/lib/base-path";
import { formatDate } from "@/lib/labels";

type StudyHead = { name: string; window_start: string; window_end: string; is_demo: boolean };

export default async function EstudioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [studyResponse, alertsResponse] = await Promise.all([apiFetch(`/studies/${id}`), apiFetch(`/studies/${id}/alert-log`)]);
  const study = studyResponse.ok ? ((await studyResponse.json()) as StudyHead) : null;
  const alerts = alertsResponse.ok ? ((await alertsResponse.json()) as { acknowledged_at: string | null }[]) : [];
  const openAlerts = alerts.filter((alert) => !alert.acknowledged_at).length;

  return (
    <Shell>
      <div className="mb-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs text-muted">
              <Link href="/estudios" className="hover:text-fg">
                Estudios
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="truncate text-fg/80">{study?.name || "Estudio"}</span>
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg md:text-3xl">{study?.name || "Estudio"}</h1>
            {study ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="chip">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(study.window_start)} — {formatDate(study.window_end)}
                </span>
                {study.is_demo ? (
                  <span className="chip border-warn/30 bg-warn/10 text-warn">
                    <FlaskConical className="h-3.5 w-3.5" />
                    Datos sintéticos de demostración
                  </span>
                ) : null}
                <LiveRefresh />
              </div>
            ) : null}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 print:hidden sm:w-auto">
            <form action={withBase(`/estudios/${id}/menciones`)} className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input name="q" placeholder="Buscar en menciones…" className="input h-10 pl-9" />
            </form>
            <a href={withBase(`/estudios/${id}/archivo/pdf`)} className={buttonVariants({ variant: "secondary" })}>
              <FileDown className="h-4 w-4" />
              PDF
            </a>
          </div>
        </div>
        <StudyNav studyId={id} alertCount={openAlerts} />
      </div>
      {children}
    </Shell>
  );
}
