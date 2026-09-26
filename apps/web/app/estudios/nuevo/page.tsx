import { CalendarRange, FileText, Rocket, Sparkles, Target, UploadCloud } from "lucide-react";
import { createStudyAction } from "@/app/login/actions";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, PageTitle } from "@/components/ui/card";

const STEPS = [
  { icon: FileText, title: "Nombra el estudio", detail: "Qué se mide y para quién." },
  { icon: Target, title: "Agrega objetivos", detail: "Perfiles, gobierno, temas. Marca los comparables." },
  { icon: UploadCloud, title: "Carga menciones", detail: "CSV, XLSX o JSON. O activa conectores con llave." },
  { icon: Sparkles, title: "Lee el tablero", detail: "Índice, tendencia, alertas y reporte." },
] as const;

export default async function NuevoEstudioPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <Shell>
      <PageTitle eyebrow="Nuevo estudio" title="Abrir una campaña de monitoreo" description="El estudio define la ventana de tiempo. Después agregas objetivos y cargas menciones." />
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader icon={Rocket} title="Datos del estudio" />
          <form action={createStudyAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="study-name">
                Nombre
              </label>
              <input id="study-name" name="name" required minLength={3} placeholder="Sentimiento Gobierno de Coahuila — octubre" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="study-description">
                Descripción
              </label>
              <textarea id="study-description" name="description" rows={4} placeholder="Objetivo del estudio, fuentes previstas y quién lo lee." className="input" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="study-start">
                  <CalendarRange className="mr-1 inline h-3.5 w-3.5" />
                  Desde
                </label>
                <input id="study-start" name="window_start" type="date" required className="input [color-scheme:dark]" />
              </div>
              <div>
                <label className="label" htmlFor="study-end">
                  <CalendarRange className="mr-1 inline h-3.5 w-3.5" />
                  Hasta
                </label>
                <input id="study-end" name="window_end" type="date" required className="input [color-scheme:dark]" />
              </div>
            </div>
            {params.error ? <p className="text-sm text-neg">No se pudo crear el estudio. Revisa el nombre y las fechas.</p> : null}
            <Button type="submit" size="lg">
              <Rocket className="h-4 w-4" />
              Crear estudio
            </Button>
          </form>
        </Card>
        <Card className="h-fit">
          <CardHeader icon={Sparkles} title="Cómo sigue" />
          <ol className="space-y-4">
            {STEPS.map((step, position) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-elevated text-primary">
                  <step.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm text-fg">
                    <span className="mr-1 text-muted">{position + 1}.</span>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </Shell>
  );
}
