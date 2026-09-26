import { Building2, Hash, Landmark, Plus, Tag, Target, User, Users } from "lucide-react";
import { createTargetAction } from "@/app/estudios/[id]/actions";
import { Avatar } from "@/components/ui/badges";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatIndex, formatPct, targetKindLabel } from "@/lib/labels";
import type { StudySummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type Target = {
  id: string;
  name: string;
  kind: string;
  comparable: boolean;
  description: string;
  aliases: { id: string; phrase: string }[];
};

const KIND_ICON: Record<string, typeof User> = {
  politician: User,
  government: Landmark,
  state: Building2,
  party: Users,
  topic: Hash,
  institution: Building2,
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
  const [studyResponse, summaryResponse] = await Promise.all([apiFetch(`/studies/${id}`), apiFetch(`/studies/${id}/summary`)]);
  if (!studyResponse.ok) {
    return <p className="text-neg">No se pudo cargar los objetivos.</p>;
  }
  const study = (await studyResponse.json()) as { targets: Target[] };
  const summary = summaryResponse.ok ? ((await summaryResponse.json()) as StudySummary) : null;
  const stats = new Map(summary?.targets.map((target) => [target.id, target]) || []);

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <section className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
        {study.targets.map((target) => {
          const stat = stats.get(target.id);
          const Icon = KIND_ICON[target.kind] || Target;
          const value = stat?.favorability_index ?? null;
          return (
            <article key={target.id} className="card card-hover p-5">
              <div className="flex items-start gap-3">
                <Avatar name={target.name} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base text-fg">{target.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <Icon className="h-3.5 w-3.5" />
                    {targetKindLabel(target.kind)}
                    {target.comparable ? <span className="rounded bg-primary/15 px-1.5 text-[10px] text-primary">comparable</span> : null}
                  </p>
                </div>
                <span className={cn("num font-display text-2xl font-semibold", (value ?? 0) >= 0 ? "text-pos" : "text-neg")}>{formatIndex(value)}</span>
              </div>
              {target.description ? <p className="mt-3 text-sm text-muted">{target.description}</p> : null}
              {stat ? (
                <div className="mt-4">
                  <div className="flex h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full bg-pos" style={{ width: `${stat.pct_positive}%` }} />
                    <div className="h-full bg-neu/60" style={{ width: `${stat.pct_neutral}%` }} />
                    <div className="h-full bg-neg" style={{ width: `${stat.pct_negative}%` }} />
                  </div>
                  <p className="mt-2 flex justify-between text-[11px] text-muted">
                    <span>{stat.volume.toLocaleString("es-MX")} menciones</span>
                    <span>
                      <span className="text-pos">{formatPct(stat.pct_positive)}</span> / <span className="text-neg">{formatPct(stat.pct_negative)}</span>
                    </span>
                  </p>
                </div>
              ) : null}
              {target.aliases.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {target.aliases.map((alias) => (
                    <span key={alias.id} className="chip">
                      <Tag className="h-3 w-3" />
                      {alias.phrase}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <Card className="h-fit">
        <CardHeader icon={Plus} title="Agregar objetivo" subtitle="Perfil, gobierno, tema o institución a monitorear" />
        <form className="space-y-3" action={createTargetAction.bind(null, id)}>
          <div>
            <label className="label" htmlFor="target-name">
              Nombre
            </label>
            <input id="target-name" name="name" required minLength={2} placeholder="Ej. Transporte en Torreón" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="target-kind">
              Tipo
            </label>
            <select id="target-kind" name="kind" className="input" defaultValue="topic">
              <option value="politician">Perfil</option>
              <option value="government">Gobierno</option>
              <option value="topic">Tema</option>
              <option value="institution">Institución</option>
              <option value="party">Partido</option>
              <option value="state">Estado</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="target-description">
              Descripción
            </label>
            <textarea id="target-description" name="description" rows={3} placeholder="Qué se monitorea y por qué" className="input" />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-line bg-elevated/40 p-3 text-sm text-fg">
            <input name="comparable" type="checkbox" className="h-4 w-4 accent-[#7c5cff]" />
            Comparable con otros perfiles
          </label>
          <button className={cn(buttonVariants(), "w-full")} type="submit">
            <Plus className="h-4 w-4" />
            Guardar objetivo
          </button>
          {query.error ? <p className="text-sm text-neg">No se pudo guardar el objetivo.</p> : null}
        </form>
      </Card>
    </div>
  );
}
