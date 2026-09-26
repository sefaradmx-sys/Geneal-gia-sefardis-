import { AlertCircle, CheckCircle2, Copy, FileCheck2, ListChecks, ShieldAlert, UploadCloud } from "lucide-react";
import { uploadAction } from "@/app/estudios/[id]/actions";
import { Dropzone } from "@/app/estudios/[id]/carga/dropzone";
import { Card, CardHeader } from "@/components/ui/card";

const COLUMNS = [
  ["texto", "Obligatoria. El texto de la mención."],
  ["fuente", "x, news, youtube, reddit, facebook, web_public o manual_upload."],
  ["fecha", "ISO 8601, por ejemplo 2026-09-20T14:00:00Z."],
  ["sentimiento", "positivo, negativo o neutro. Sin esto, va a revisión."],
  ["confianza", "0 a 1. Menor a 0.45 va a revisión."],
  ["postura", "a_favor, en_contra, mixto o no_aplica."],
  ["municipio / estado", "Para el corte geográfico."],
  ["tema, autor, url, id", "Tema para las razones, autor, enlace e identificador externo."],
  ["me_gusta, respuestas, compartidos, vistas, seguidores", "Alimentan el peso de la mención."],
] as const;

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
    <div className="grid gap-5 xl:grid-cols-5">
      <div className="space-y-5 xl:col-span-3">
        <Card>
          <CardHeader icon={UploadCloud} title="Cargar menciones" subtitle="Las filas repetidas se saltan por texto normalizado o identificador externo." />
          <form action={uploadAction.bind(null, id)}>
            <Dropzone />
          </form>
        </Card>

        {query.error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-neg/30 bg-neg/10 p-4 text-sm text-neg animate-fade-up">
            <AlertCircle className="h-5 w-5" />
            No se pudo leer el archivo. Revisa que tenga la columna texto y que pese menos de 5 MB.
          </div>
        ) : null}

        {query.created ? (
          <section className="animate-fade-up">
            <p className="mb-3 flex items-center gap-2 text-sm text-pos">
              <CheckCircle2 className="h-4 w-4" />
              Archivo procesado
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <ResultStat icon={FileCheck2} label="Nuevas" value={query.created} tone="text-pos" />
              <ResultStat icon={Copy} label="Repetidas" value={query.skipped || "0"} tone="text-muted" />
              <ResultStat icon={ShieldAlert} label="En revisión" value={query.review || "0"} tone="text-warn" />
            </div>
          </section>
        ) : null}
      </div>

      <Card className="h-fit xl:col-span-2">
        <CardHeader icon={ListChecks} title="Columnas que reconoce" subtitle="Acepta encabezados en español o inglés" />
        <ul className="divide-y divide-line">
          {COLUMNS.map(([name, detail]) => (
            <li key={name} className="py-2.5 first:pt-0">
              <code className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{name}</code>
              <p className="mt-1 text-xs text-muted">{detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl border border-warn/20 bg-warn/5 p-3 text-xs text-warn/90">
          Una mención sin sentimiento no entra al índice hasta que alguien la clasifique.
        </p>
      </Card>
    </div>
  );
}

function ResultStat({ icon: Icon, label, value, tone }: { icon: typeof Copy; label: string; value: string; tone: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-xs text-muted">
        {label}
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <p className={`num mt-2 font-display text-3xl font-semibold ${tone}`}>{Number(value).toLocaleString("es-MX")}</p>
    </div>
  );
}
