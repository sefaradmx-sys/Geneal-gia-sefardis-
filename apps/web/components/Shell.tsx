import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { Logo } from "@/components/Logo";
import { SidebarNav } from "@/components/SidebarNav";
import { Avatar } from "@/components/ui/badges";
import { apiFetch } from "@/lib/api";
import { roleLabel } from "@/lib/labels";

type Me = { username: string; email: string; role: string };

export async function Shell({ children }: { children: React.ReactNode }) {
  const response = await apiFetch("/auth/me");
  const me = response.ok ? ((await response.json()) as Me) : null;
  const today = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/60 px-4 py-5 backdrop-blur-xl print:hidden md:flex">
        <Link href="/estudios" className="px-2">
          <Logo />
        </Link>
        <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/70">Operación</p>
        <SidebarNav />
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-line bg-gradient-to-br from-primary/15 to-accent/5 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-fg">
              <ShieldCheck className="h-4 w-4 text-pos" />
              Recolección legal
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">APIs oficiales, RSS, web pública con robots.txt y cargas del analista.</p>
          </div>
          {me ? (
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-elevated/60 p-2.5">
              <Avatar name={me.username} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">{me.username}</p>
                <p className="truncate text-[11px] text-muted">{roleLabel(me.role)}</p>
              </div>
              <form action={logoutAction}>
                <button type="submit" title="Cerrar sesión" className="rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-neg">
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/70 backdrop-blur-xl print:hidden">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-4 md:px-8">
            <div className="flex items-center gap-3 md:hidden">
              <Link href="/estudios">
                <Logo />
              </Link>
            </div>
            <p className="hidden text-sm capitalize text-muted md:block">
              {me ? <span className="text-fg">Hola, {me.username}</span> : null} · {today}
            </p>
            <div className="flex items-center gap-2">
              <span className="chip hidden border-pos/25 bg-pos/10 text-pos sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-pos" />
                API en línea
              </span>
              <span className="chip hidden lg:inline-flex">No es encuesta representativa</span>
              <form action={logoutAction} className="md:hidden">
                <button type="submit" className="rounded-lg p-2 text-muted hover:text-neg" title="Cerrar sesión">
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-line px-3 py-2 md:hidden">
            <SidebarNav compact />
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] animate-fade-up px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
