import { BellOff, BellRing, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { acknowledgeAlert } from "@/app/estudios/[id]/actions";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/labels";
import { cn } from "@/lib/utils";

type AlertRow = {
  id: string;
  target_name: string;
  rule: string;
  message: string;
  delta_points: number;
  triggered_at: string;
  acknowledged_at: string | null;
};

export default async function AlertasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await apiFetch(`/studies/${id}/alert-log`);
  const alerts = response.ok ? ((await response.json()) as AlertRow[]) : [];
  const open = alerts.filter((alert) => !alert.acknowledged_at).length;
  const now = new Date();

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Abiertas" value={open} tone="text-neg" />
          <Stat label="Con acuse" value={alerts.length - open} tone="text-pos" />
          <Stat label="Total" value={alerts.length} tone="text-fg" />
        </div>
        {alerts.length === 0 ? (
          <EmptyState icon={BellOff} title="Sin alertas" description="Cuando la negatividad suba 15 puntos en 24 horas, aparecerá aquí." />
        ) : (
          <ol className="relative space-y-4 border-l border-line pl-6">
            {alerts.map((alert) => {
              const acknowledged = Boolean(alert.acknowledged_at);
              return (
                <li key={alert.id} className="relative animate-fade-up">
                  <span
                    className={cn(
                      "absolute -left-[33px] top-5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-canvas",
                      acknowledged ? "bg-pos" : "bg-neg",
                    )}
                  >
                    {!acknowledged ? <span className="absolute h-full w-full animate-ping rounded-full bg-neg opacity-60" /> : null}
                  </span>
                  <article className={cn("card p-5", !acknowledged && "border-neg/30")}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", acknowledged ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg")}>
                          {acknowledged ? <CheckCircle2 className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
                        </span>
                        <div>
                          <p className="font-medium text-fg">{alert.target_name}</p>
                          <p className="flex items-center gap-1 text-xs text-muted">
                            <Clock className="h-3 w-3" />
                            {timeAgo(alert.triggered_at, now)} · {formatDate(alert.triggered_at)}
                          </p>
                        </div>
                      </div>
                      <span className="num inline-flex items-center gap-1 rounded-lg bg-neg/10 px-2.5 py-1 font-display text-lg font-semibold text-neg">
                        <TrendingUp className="h-4 w-4" />+{Math.round(alert.delta_points)} pts
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-fg/90">{alert.message}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <code className="rounded-md bg-elevated px-2 py-1 text-[11px] text-muted">{alert.rule}</code>
                      {acknowledged ? (
                        <span className="text-xs text-pos">Acuse {formatDate(alert.acknowledged_at as string)}</span>
                      ) : (
                        <form action={acknowledgeAlert}>
                          <input type="hidden" name="studyId" value={id} />
                          <input type="hidden" name="alertId" value={alert.id} />
                          <button className={buttonVariants({ size: "sm" })} type="submit">
                            <CheckCircle2 className="h-4 w-4" />
                            Acusar recibo
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <Card className="h-fit">
        <CardHeader icon={BellRing} title="Regla activa" subtitle="negativity_spike_24h" />
        <ul className="space-y-3 text-sm text-muted">
          <li className="rounded-xl border border-line bg-elevated/40 p-3">Compara el % negativo de las últimas 24 horas contra las 24 anteriores.</li>
          <li className="rounded-xl border border-line bg-elevated/40 p-3">
            Se dispara con una subida de <span className="text-fg">15 puntos o más</span>.
          </li>
          <li className="rounded-xl border border-line bg-elevated/40 p-3">
            Cada bloque necesita al menos <span className="text-fg">15 menciones</span> para evitar falsas alarmas.
          </li>
          <li className="rounded-xl border border-line bg-elevated/40 p-3">El acuse queda registrado en la auditoría con usuario y hora.</li>
        </ul>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("num mt-1 font-display text-3xl font-semibold", tone)}>{value}</p>
    </div>
  );
}
