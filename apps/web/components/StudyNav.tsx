"use client";

import { Bell, FileText, GitCompareArrows, LayoutDashboard, MessageSquareText, MessagesSquare, Radio, Target, UploadCloud } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { suffix: "", label: "Resumen", icon: LayoutDashboard },
  { suffix: "/menciones", label: "Menciones", icon: MessagesSquare },
  { suffix: "/comparar", label: "Comparar", icon: GitCompareArrows },
  { suffix: "/preguntar", label: "Preguntar", icon: MessageSquareText },
  { suffix: "/carga", label: "Carga", icon: UploadCloud },
  { suffix: "/fuentes", label: "Fuentes", icon: Radio },
  { suffix: "/objetivos", label: "Objetivos", icon: Target },
  { suffix: "/alertas", label: "Alertas", icon: Bell },
  { suffix: "/reporte", label: "Reporte", icon: FileText },
] as const;

export function StudyNav({ studyId, alertCount = 0 }: { studyId: string; alertCount?: number }) {
  const path = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 print:hidden">
      {LINKS.map((link) => {
        const href = `/estudios/${studyId}${link.suffix}`;
        const active = link.suffix === "" ? path === href : path.startsWith(href);
        const Icon = link.icon;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition",
              active
                ? "bg-elevated text-fg shadow-[inset_0_0_0_1px_rgba(124,92,255,0.45),0_8px_24px_-12px_rgba(124,92,255,0.6)]"
                : "text-muted hover:bg-white/5 hover:text-fg",
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-primary" : "")} />
            {link.label}
            {link.suffix === "/alertas" && alertCount > 0 ? (
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-neg px-1.5 text-[10px] font-semibold text-white">
                {alertCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
