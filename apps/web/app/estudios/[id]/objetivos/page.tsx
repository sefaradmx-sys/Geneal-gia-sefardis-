import { createTargetAction } from "@/app/estudios/[id]/actions";
import { apiFetch } from "@/lib/api";
import { targetKindLabel } from "@/lib/labels";

type Target = {
  id: string;
  name: string;
  kind: string;
  comparable: boolean;
  description: string;
  aliases: { id: string; phrase: string }[];
};

export default async function ObjetivosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const response = await apiFetch(`/studies/${id}`);
  if (!response.ok) {
    return <p className="text-neg">No se pudo cargar los objetivos.</p>;
  }
  const study = (await response.json()) as { targets: Target[] };
  return (
    <>
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Monitoreo</p>
      <h1 className="font-serif text-3xl text-white">Objetivos</h1>
      <ul className="mt-4 space-y-2">
        {study.targets.map((target) => (
          <li key={target.id} className="rounded-lg border border-line bg-panel px-4 py-3">
            <p className="text-white">{target.name}</p>
            <p className="text-xs text-mist">
              {targetKindLabel(target.kind)}
              {target.comparable ? " · comparable" : ""}
              {target.aliases.length ? ` · ${target.aliases.map((alias) => alias.phrase).join(", ")}` : ""}
            </p>
          </li>
        ))}
      </ul>
      <form className="mt-6 grid max-w-lg gap-2" action={createTargetAction.bind(null, id)}>
        <h2 className="font-serif text-xl text-white">Agregar objetivo</h2>
        <input name="name" required minLength={2} placeholder="Nombre" className="rounded-md border border-line bg-ink px-3 py-2 text-sm" />
        <select name="kind" className="rounded-md border border-line bg-ink px-3 py-2 text-sm" defaultValue="topic">
          <option value="politician">Perfil</option>
          <option value="government">Gobierno</option>
          <option value="topic">Tema</option>
          <option value="institution">Institución</option>
          <option value="party">Partido</option>
          <option value="state">Estado</option>
        </select>
        <input name="description" placeholder="Descripción" className="rounded-md border border-line bg-ink px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm text-mist">
          <input name="comparable" type="checkbox" />
          Comparable con otros perfiles
        </label>
        <button className="w-fit rounded-md bg-brass px-3 py-2 text-sm text-ink" type="submit">
          Guardar
        </button>
        {query.error ? <p className="text-sm text-neg">No se pudo guardar el objetivo.</p> : null}
      </form>
    </>
  );
}
