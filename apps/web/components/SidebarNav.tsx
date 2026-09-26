"use client";

import { LayoutGrid, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/estudios", label: "Estudios", icon: LayoutGrid, exact: false },
  { href: "/estudios/nuevo", label: "Nuevo estudio", icon: PlusCircle, exact: true },
  { href: "/equipo", label: "Equipo", icon: Users, exact: true },
] as const;

export function SidebarNav({ compact = false }: { compact?: boolean }) {
  const path = usePathname();
  return (
    <nav className={cn(compact ? "flex gap-1" : "space-y-1")}>
      {ITEMS.map((item) => {
        const active = item.exact
          ? path === item.href
          : path === item.href || (path.startsWith(`${item.href}/`) && !path.startsWith("/estudios/nuevo"));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
              active ? "bg-primary/15 text-fg" : "text-muted hover:bg-white/5 hover:text-fg",
            )}
          >
            {active && !compact ? <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" /> : null}
            <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted group-hover:text-fg")} />
            <span className={cn(compact && "hidden sm:inline")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
