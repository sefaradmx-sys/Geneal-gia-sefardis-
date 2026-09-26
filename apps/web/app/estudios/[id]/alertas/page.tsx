import { acknowledgeAlert } from "@/app/estudios/[id]/actions";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/labels";

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
  return (
    <>
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Operación</p>
      <h1 className="font-serif text-3xl text-white">Alertas</h1>
      <p className="mt-2 max-w-2xl text-sm text-mist">
        Se dispara cuando la negatividad de 24 horas sube al menos 15 puntos respecto al bloque anterior y ambos tienen volumen.
      </p>
      {alerts.length === 0 ? (
        <p className="mt-6 text-sm text-mist">No hay alertas guardadas en este estudio.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded-lg border border-line bg-panel px-4 py-3">
              <p className="text-sm text-white">{alert.message}</p>
              <p className="mt-1 text-xs text-mist">
                {alert.target_name} · {alert.rule} · {alert.delta_points.toLocaleString("es-MX")} puntos · {formatDate(alert.triggered_at)}
              </p>
              {alert.acknowledged_at ? (
                <p className="mt-2 text-xs text-pos">Acuse {formatDate(alert.acknowledged_at)}</p>
              ) : (
                <form className="mt-3" action={acknowledgeAlert}>
                  <input type="hidden" name="studyId" value={id} />
                  <input type="hidden" name="alertId" value={alert.id} />
                  <button className="rounded-md border border-brass/40 px-3 py-1.5 text-xs text-brass" type="submit">
                    Acusar recibo
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
