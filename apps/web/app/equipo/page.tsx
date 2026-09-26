import { Shell } from "@/components/Shell";
import { createUserAction } from "@/app/equipo/actions";
import { apiFetch } from "@/lib/api";
import { roleLabel } from "@/lib/labels";

type Member = {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
};

export default async function EquipoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const [usersResponse, meResponse] = await Promise.all([apiFetch("/users"), apiFetch("/auth/me")]);
  const users = usersResponse.ok ? ((await usersResponse.json()) as Member[]) : [];
  const me = meResponse.ok ? ((await meResponse.json()) as Member) : null;
  return (
    <Shell>
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Organización</p>
      <h1 className="font-serif text-3xl text-white">Equipo</h1>
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
        {users.map((user) => (
          <li key={user.id} className="flex items-baseline justify-between gap-3 bg-panel px-4 py-3">
            <div>
              <p className="text-white">{user.username}</p>
              <p className="text-xs text-mist">{user.email}</p>
            </div>
            <p className="text-xs text-brass">
              {roleLabel(user.role)}
              {user.is_active ? "" : " · inactivo"}
            </p>
          </li>
        ))}
      </ul>
      {me?.role === "superadmin" ? (
        <form className="mt-6 grid max-w-lg gap-2" action={createUserAction}>
          <h2 className="font-serif text-xl text-white">Nuevo acceso</h2>
          <input name="username" required minLength={3} placeholder="Usuario" className="rounded-md border border-line bg-ink px-3 py-2 text-sm" />
          <input name="email" required type="email" placeholder="Correo" className="rounded-md border border-line bg-ink px-3 py-2 text-sm" />
          <input name="password" required minLength={8} type="password" placeholder="Contraseña" className="rounded-md border border-line bg-ink px-3 py-2 text-sm" />
          <select name="role" defaultValue="analyst" className="rounded-md border border-line bg-ink px-3 py-2 text-sm">
            <option value="analyst">Analista</option>
            <option value="client_reader">Lectura</option>
            <option value="auditor">Auditoría</option>
            <option value="superadmin">Súper administrador</option>
          </select>
          <button className="w-fit rounded-md bg-brass px-3 py-2 text-sm text-ink" type="submit">
            Crear
          </button>
          {query.error ? <p className="text-sm text-neg">No se pudo crear el acceso. Revisa usuario, correo y contraseña.</p> : null}
        </form>
      ) : (
        <p className="mt-6 text-sm text-mist">Solo el súper administrador crea accesos.</p>
      )}
    </Shell>
  );
}
