"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { suffix: "", label: "Resumen" },
  { suffix: "/menciones", label: "Menciones" },
  { suffix: "/comparar", label: "Comparar" },
  { suffix: "/preguntar", label: "Preguntar" },
  { suffix: "/carga", label: "Carga" },
  { suffix: "/objetivos", label: "Objetivos" },
  { suffix: "/alertas", label: "Alertas" },
  { suffix: "/reporte", label: "Reporte" },
] as const;

export function StudyNav({ studyId }: { studyId: string }) {
  const path = usePathname();
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 text-sm print:hidden">
      {LINKS.map((link) => {
        const href = `/estudios/${studyId}${link.suffix}`;
        const active = link.suffix === "" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={
              active
                ? "shrink-0 rounded-md bg-brass px-3 py-1.5 text-ink"
                : "shrink-0 rounded-md border border-line px-3 py-1.5 text-mist hover:text-white"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
