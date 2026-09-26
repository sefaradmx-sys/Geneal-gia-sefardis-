import { CoveragePanel } from "@/components/CoveragePanel";
import { apiFetch } from "@/lib/api";
import type { StudySummary } from "@/lib/types";

export default async function FuentesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await apiFetch(`/studies/${id}/summary`);
  if (!response.ok) {
    return <p className="text-neg">No se pudieron cargar las fuentes.</p>;
  }
  const summary = (await response.json()) as StudySummary;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-fg">Fuentes del censo</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          Primera fuente: Nueva Expresión Nuevo León. El índice no usa páginas que el alcalde paga. Si el sitio propio aún no
          tiene notas cívicas, el tablero lo dice —no inventa artículos ni comentarios.
        </p>
      </div>
      <CoveragePanel coverage={summary.coverage} />
      <ul className="space-y-2 text-sm text-muted">
        {summary.known_biases.map((bias) => (
          <li key={bias} className="rounded-xl border border-line bg-surface/60 p-3 leading-relaxed">
            {bias}
          </li>
        ))}
      </ul>
    </div>
  );
}
