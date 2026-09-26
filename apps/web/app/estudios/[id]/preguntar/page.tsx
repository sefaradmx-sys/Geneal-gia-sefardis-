import { AskForm } from "@/app/estudios/[id]/preguntar/ask-form";

export default async function PreguntarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Lectura</p>
      <h1 className="font-serif text-3xl text-white">Preguntar al estudio</h1>
      <p className="mt-2 max-w-2xl text-sm text-mist">
        La respuesta cita menciones ya guardadas. No inventa citas ni corrige el sesgo de la fuente.
      </p>
      <AskForm studyId={id} />
    </>
  );
}
