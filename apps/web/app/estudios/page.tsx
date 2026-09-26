import Link from "next/link";
import { Shell } from "@/components/Shell";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/labels";
import type { StudyListItem } from "@/lib/types";

export default async function EstudiosPage() {
  const response = await apiFetch("/studies");
  if (!response.ok) {
    return (
      <Shell>
        <p className="text-neg">No se pudo cargar la lista de estudios.</p>
      </Shell>
    );
  }
  const studies = (await response.json()) as StudyListItem[];
  return (
    <Shell>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brass">Estudios</p>
          <h1 className="font-serif text-3xl text-white">Campañas de monitoreo</h1>
        </div>
        <Link href="/estudios/nuevo" className="rounded-md bg-brass px-3 py-2 text-sm text-ink">
          Nuevo estudio
        </Link>
      </header>
      {studies.length === 0 ? (
        <p className="text-mist">Todavía no hay estudios en esta organización.</p>
      ) : (
        <ul className="grid gap-3">
          {studies.map((study) => (
            <li key={study.id}>
              <Link
                href={`/estudios/${study.id}`}
                className="block rounded-lg border border-line bg-panel px-5 py-4 hover:border-brass/50"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg text-white">{study.name}</h2>
                  {study.is_demo ? <span className="text-xs text-brass">Demostración</span> : null}
                </div>
                <p className="mt-1 text-sm text-mist">{study.description}</p>
                <p className="mt-3 text-xs text-mist">
                  {formatDate(study.window_start)} — {formatDate(study.window_end)} · {study.target_count} objetivos
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
