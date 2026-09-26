import { Ban, Radio, ShieldAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import type { OutletCoverage, StudyCoverage } from "@/lib/types";

function OutletCard({ outlet, tone }: { outlet: OutletCoverage; tone: "own" | "excluded" | "missing" }) {
  const border =
    tone === "own" ? "border-pos/30 bg-pos/5" : tone === "excluded" ? "border-warn/30 bg-warn/5" : "border-line bg-canvas/50";
  return (
    <article className={`rounded-xl border p-4 ${border}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {outlet.url ? (
          <a href={outlet.url} target="_blank" rel="noreferrer" className="font-medium text-fg hover:text-primary">
            {outlet.name}
          </a>
        ) : (
          <p className="font-medium text-fg">{outlet.name}</p>
        )}
        <span className="text-[11px] uppercase tracking-wider text-muted">{outlet.status.replaceAll("_", " ")}</span>
      </div>
      {outlet.note ? <p className="mt-2 text-sm leading-relaxed text-muted">{outlet.note}</p> : null}
      {tone === "own" ? (
        <p className="mt-2 text-xs text-muted">Piezas cívicas en el índice: {outlet.civic_items}</p>
      ) : null}
    </article>
  );
}

export function CoveragePanel({ coverage }: { coverage?: StudyCoverage }) {
  if (!coverage) {
    return null;
  }
  const empty = !coverage.own_outlets.length && !coverage.excluded_outlets.length && !coverage.missing_platforms.length;
  if (empty) {
    return null;
  }
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader icon={Radio} title="Medio propio" subtitle="Nueva Expresión se consulta primero" />
        <div className="space-y-3">
          {coverage.own_outlets.map((outlet) => (
            <OutletCard key={outlet.name} outlet={outlet} tone="own" />
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader icon={Ban} title="Prensa municipal excluida" subtitle="No entra al índice" />
        <div className="space-y-3">
          {coverage.excluded_outlets.map((outlet) => (
            <OutletCard key={outlet.name} outlet={outlet} tone="excluded" />
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader icon={ShieldAlert} title="Huecos de redes" subtitle="Sin API usable" />
        <div className="space-y-3">
          {coverage.missing_platforms.map((outlet) => (
            <OutletCard key={outlet.name} outlet={outlet} tone="missing" />
          ))}
        </div>
      </Card>
    </section>
  );
}
