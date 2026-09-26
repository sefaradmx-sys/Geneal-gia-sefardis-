import { uploadAction } from "@/app/estudios/[id]/actions";

export default async function CargaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; skipped?: string; review?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <>
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Ingesta</p>
      <h1 className="font-serif text-3xl text-white">Cargar menciones</h1>
      <p className="mt-2 max-w-2xl text-sm text-mist">
        CSV, XLSX o JSON de hasta 5 MB. Si trae sentimiento, entra al índice de los objetivos cuyo nombre o alias aparece en el texto, o el de la columna objetivo. Si no trae sentimiento, queda en revisión.
      </p>
      <form className="mt-4 space-y-3" action={uploadAction.bind(null, id)}>
        <input
          name="file"
          type="file"
          required
          accept=".csv,.xlsx,.json,text/csv,application/json"
          className="block text-sm text-mist"
        />
        <button className="rounded-md bg-brass px-3 py-2 text-sm text-ink" type="submit">
          Cargar
        </button>
      </form>
      {query.error ? <p className="mt-4 text-sm text-neg">No se pudo leer el archivo.</p> : null}
      {query.created ? (
        <p className="mt-4 text-sm text-white">
          Nuevas {query.created}. Repetidas {query.skipped || "0"}. En revisión {query.review || "0"}.
        </p>
      ) : null}
    </>
  );
}
