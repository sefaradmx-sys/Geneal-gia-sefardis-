import { AskForm } from "@/app/estudios/[id]/preguntar/ask-form";

export default async function PreguntarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-4xl">
      <AskForm studyId={id} />
    </div>
  );
}
