import { apiFetch } from "@/lib/api";
import { formatIndex, formatPct, targetKindLabel } from "@/lib/labels";
import type { StudySummary } from "@/lib/types";

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
  const selected = new Set(
    (Array.isArray(rawIds) ? rawIds : (rawIds || "").split(",")).map((item) => item.trim()).filter(Boolean),
  );
  let compared: Compared | null = null;
  if (selected.size >= 2) {
    const response = await apiFetch(`/studies/${id}/compare?ids=${[...selected].join(",")}`);
    if (response.ok) {
      compared = (await response.json()) as Compared;
    }
  }

  return (
    <>
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Preferencia</p>
      <h1 className="font-serif text-3xl text-white">Comparar objetivos</h1>
      <p className="mt-2 max-w-2xl text-sm text-mist">
        La diferencia es de índice de sentimiento digital. El intervalo de estabilidad no es un margen de encuesta.
      </p>
      <form className="mt-4 space-y-2" action={`/estudios/${id}/comparar`}>
        {summary.targets.map((target) => (
          <label key={target.id} className="flex items-center gap-2 text-sm text-white">
            <input type="checkbox" name="ids" value={target.id} defaultChecked={selected.has(target.id)} />
            {target.name}
            <span className="text-mist">· {targetKindLabel(target.kind)} · {formatIndex(target.favorability_index)}</span>
          </label>
        ))}
        <button className="rounded-md bg-brass px-3 py-1.5 text-sm text-ink" type="submit">
          Comparar
        </button>
      </form>
      {compared ? (
        <section className="mt-6 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            {compared.targets.map((target) => (
              <article key={target.id} className="rounded-lg border border-line bg-panel px-4 py-3">
                <h2 className="text-white">{target.name}</h2>
                <p className="num mt-2 text-3xl text-brass">{formatIndex(target.favorability_index)}</p>
                <p className="text-xs text-mist">
                  {formatPct(target.pct_positive)} / {formatPct(target.pct_negative)} / {formatPct(target.pct_neutral)} · n=
                  {target.volume.toLocaleString("es-MX")}
                </p>
              </article>
            ))}
          </div>
          {compared.preferences.map((item) => (
            <p key={item.headline} className="rounded-lg border border-line bg-panel px-4 py-3 text-sm text-white">
              {item.headline}
            </p>
          ))}
          <p className="text-xs text-mist">{compared.disclaimer}</p>
        </section>
      ) : (
        <p className="mt-6 text-sm text-mist">Elige al menos dos objetivos.</p>
      )}
    </>
  );
}
