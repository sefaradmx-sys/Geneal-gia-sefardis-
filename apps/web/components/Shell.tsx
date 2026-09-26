import Link from "next/link";
import { logoutAction } from "@/app/login/actions";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-b border-line bg-panel/80 px-5 py-6 print:hidden md:min-h-screen md:border-b-0 md:border-r">
        <Link href="/estudios" className="block">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md border border-brass/40 font-serif text-brass">
            MV
          </div>
          <div className="font-serif text-xl tracking-wide text-white">LA MV Census</div>
          <p className="mt-1 text-xs text-mist">Inteligencia de sentimiento cívico</p>
        </Link>
        <nav className="mt-8 space-y-1 text-sm">
          <Link href="/estudios" className="block rounded-md px-2 py-1.5 text-white/90 hover:bg-white/5">
            Estudios
          </Link>
          <Link href="/estudios/nuevo" className="block rounded-md px-2 py-1.5 text-mist hover:bg-white/5 hover:text-white">
            Nuevo estudio
          </Link>
          <Link href="/equipo" className="block rounded-md px-2 py-1.5 text-mist hover:bg-white/5 hover:text-white">
            Equipo
          </Link>
        </nav>
        <form action={logoutAction} className="mt-auto pt-8">
          <button className="text-xs text-mist hover:text-white" type="submit">
            Cerrar sesión
          </button>
          <p className="mt-4 text-[11px] text-mist">LA MV Census · uso interno</p>
        </form>
      </aside>
      <main className="px-5 py-6 md:px-8">{children}</main>
    </div>
  );
}
