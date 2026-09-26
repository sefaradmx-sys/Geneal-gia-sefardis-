import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { createStudyAction } from "@/app/login/actions";

export default async function NuevoEstudioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <Shell>
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Nuevo estudio</p>
      <h1 className="font-serif text-3xl text-white">Abrir una campaña</h1>
      <form action={createStudyAction} className="mt-6 max-w-xl space-y-4">
        <label className="block text-sm">
          <span className="text-mist">Nombre</span>
          <input name="name" required minLength={3} className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="text-mist">Descripción</span>
          <textarea name="description" className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2" rows={3} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-mist">Desde</span>
            <input name="window_start" type="date" required className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-mist">Hasta</span>
            <input name="window_end" type="date" required className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2" />
          </label>
        </div>
        {params.error ? <p className="text-sm text-neg">No se pudo crear el estudio.</p> : null}
        <Button type="submit">Crear estudio</Button>
      </form>
    </Shell>
  );
}
