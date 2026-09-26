import { KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import { createUserAction } from "@/app/equipo/actions";
import { Shell } from "@/components/Shell";
import { Avatar } from "@/components/ui/badges";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, PageTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { roleLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
};

const ROLE_STYLE: Record<string, string> = {
  superadmin: "border-primary/40 bg-primary/10 text-primary",
  analyst: "border-accent/40 bg-accent/10 text-accent",
  client_reader: "border-line bg-elevated text-muted",
  auditor: "border-warn/40 bg-warn/10 text-warn",
};

const ROLE_HELP = [
  ["superadmin", "Crea accesos, estudios y objetivos."],
  ["analyst", "Crea estudios, carga menciones y acusa alertas."],
  ["client_reader", "Consulta tableros y descarga reportes."],
  ["auditor", "Consulta todo, no modifica."],
] as const;

export default async function EquipoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const [usersResponse, meResponse] = await Promise.all([apiFetch("/users"), apiFetch("/auth/me")]);
  const users = usersResponse.ok ? ((await usersResponse.json()) as Member[]) : [];
  const me = meResponse.ok ? ((await meResponse.json()) as Member) : null;

  return (
    <Shell>
      <PageTitle eyebrow="Organización" title="Equipo y accesos" description="Quién entra a LA MV Census y qué puede hacer." />
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader icon={Users} title={`${users.length} ${users.length === 1 ? "acceso" : "accesos"}`} subtitle="Contraseñas guardadas con Argon2id" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted">
                <tr className="border-b border-line">
                  <th className="pb-3 font-medium">Usuario</th>
                  <th className="pb-3 font-medium">Rol</th>
                  <th className="pb-3 text-right font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => (
                  <tr key={user.id} className="transition hover:bg-white/[0.02]">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.username} />
                        <div>
                          <p className="text-fg">
                            {user.username}
                            {me?.id === user.id ? <span className="ml-2 text-[10px] text-muted">(tú)</span> : null}
                          </p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={cn("chip", ROLE_STYLE[user.role])}>{roleLabel(user.role)}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={cn("chip", user.is_active ? "border-pos/30 bg-pos/10 text-pos" : "border-neg/30 bg-neg/10 text-neg")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", user.is_active ? "bg-pos" : "bg-neg")} />
                        {user.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {ROLE_HELP.map(([role, detail]) => (
              <div key={role} className="rounded-xl border border-line bg-elevated/30 p-3">
                <span className={cn("chip", ROLE_STYLE[role])}>{roleLabel(role)}</span>
                <p className="mt-2 text-xs text-muted">{detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader icon={UserPlus} title="Nuevo acceso" subtitle="Solo el súper administrador crea accesos" />
          {me?.role === "superadmin" ? (
            <form className="space-y-3" action={createUserAction}>
              <div>
                <label className="label" htmlFor="new-username">
                  Usuario
                </label>
                <input id="new-username" name="username" required minLength={3} placeholder="analista.saltillo" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="new-email">
                  Correo
                </label>
                <input id="new-email" name="email" required type="email" placeholder="nombre@empresa.mx" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="new-password">
                  Contraseña
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input id="new-password" name="password" required minLength={8} type="password" placeholder="Mínimo 8 caracteres" className="input pl-9" />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="new-role">
                  Rol
                </label>
                <select id="new-role" name="role" defaultValue="analyst" className="input">
                  <option value="analyst">Analista</option>
                  <option value="client_reader">Lectura</option>
                  <option value="auditor">Auditoría</option>
                  <option value="superadmin">Súper administrador</option>
                </select>
              </div>
              <button className={cn(buttonVariants(), "w-full")} type="submit">
                <UserPlus className="h-4 w-4" />
                Crear acceso
              </button>
              {query.error ? <p className="text-sm text-neg">No se pudo crear el acceso. Revisa usuario, correo y contraseña.</p> : null}
            </form>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted">
              <ShieldCheck className="h-4 w-4" />
              Tu rol puede consultar el equipo, no modificarlo.
            </p>
          )}
        </Card>
      </div>
    </Shell>
  );
}
