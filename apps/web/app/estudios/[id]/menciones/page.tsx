import { apiFetch } from "@/lib/api";
import { formatDate, sentimentLabel, sourceLabel, stanceLabel } from "@/lib/labels";

type MentionRow = {
  id: string;
  text_original: string;
  source_kind: string;
  published_at: string;
  sentiment: string | null;
  stance: string | null;
  theme: string | null;
  geo_municipality: string | null;
  confidence: number | null;
  is_synthetic: boolean;
};

const SOURCES = [
  ["", "Todas"],
  ["x", "X"],
  ["news", "Medios"],
  ["manual_upload", "Carga de censo"],
  ["youtube", "YouTube"],
  ["reddit", "Reddit"],
  ["web_public", "Web pública"],
  ["facebook", "Facebook"],
] as const;

export default async function MencionesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string; sentiment?: string; stance?: string; offset?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const offset = Number(query.offset || 0) || 0;
  const filters = new URLSearchParams({ study_id: id, limit: "40", offset: String(offset) });
  if (query.source) {
    filters.set("source", query.source);
  }
  if (query.sentiment) {
    filters.set("sentiment", query.sentiment);
  }
  if (query.stance) {
    filters.set("stance", query.stance);
  }
  const response = await apiFetch(`/mentions?${filters.toString()}`);
  const page = response.ok ? ((await response.json()) as { items: MentionRow[]; total: number }) : { items: [], total: 0 };
  const nextOffset = offset + 40 < page.total ? offset + 40 : null;
  const prevOffset = offset > 0 ? Math.max(0, offset - 40) : null;

  return (
    <>
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Explorador</p>
      <h1 className="font-serif text-3xl text-white">Menciones</h1>
      <p className="mt-2 text-sm text-mist">{page.total.toLocaleString("es-MX")} en este filtro.</p>
      <form className="mt-4 flex flex-wrap gap-2 text-sm" action={`/estudios/${id}/menciones`}>
        <select name="source" defaultValue={query.source || ""} className="rounded-md border border-line bg-ink px-2 py-1.5">
          {SOURCES.map(([value, label]) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="sentiment" defaultValue={query.sentiment || ""} className="rounded-md border border-line bg-ink px-2 py-1.5">
          <option value="">Cualquier sentimiento</option>
          <option value="positive">Positivo</option>
          <option value="negative">Negativo</option>
          <option value="neutral">Neutro</option>
        </select>
        <select name="stance" defaultValue={query.stance || ""} className="rounded-md border border-line bg-ink px-2 py-1.5">
          <option value="">Cualquier postura</option>
          <option value="in_favor">A favor</option>
          <option value="against">En contra</option>
          <option value="mixed">Mixto</option>
          <option value="not_applicable">No aplica</option>
        </select>
        <button className="rounded-md bg-brass px-3 py-1.5 text-ink" type="submit">
          Filtrar
        </button>
      </form>
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
        {page.items.map((item) => (
          <li key={item.id} className="bg-panel px-4 py-3">
            <p className="text-sm text-white">{item.text_original}</p>
            <p className="mt-1 text-xs text-mist">
              {item.sentiment ? sentimentLabel(item.sentiment) : "Sin clasificar"}
              {item.stance ? ` · ${stanceLabel(item.stance)}` : ""} · {sourceLabel(item.source_kind)} · {item.geo_municipality || "sin municipio"} ·{" "}
              {item.theme || "sin tema"} · {formatDate(item.published_at)}
              {item.confidence !== null ? ` · confianza ${item.confidence}` : ""}
              {item.is_synthetic ? " · sintética" : ""}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-3 text-sm">
        {prevOffset !== null ? (
          <a className="text-brass" href={`/estudios/${id}/menciones?source=${query.source || ""}&sentiment=${query.sentiment || ""}&stance=${query.stance || ""}&offset=${prevOffset}`}>
            Anteriores
          </a>
        ) : null}
        {nextOffset !== null ? (
          <a className="text-brass" href={`/estudios/${id}/menciones?source=${query.source || ""}&sentiment=${query.sentiment || ""}&stance=${query.stance || ""}&offset=${nextOffset}`}>
            Siguientes
          </a>
        ) : null}
      </div>
    </>
  );
}
