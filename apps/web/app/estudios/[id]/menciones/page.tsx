import { ChevronLeft, ChevronRight, Eye, ExternalLink, Filter, Heart, MapPin, MessageCircle, Repeat2, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { Avatar, SentimentBadge, SourceBadge } from "@/components/ui/badges";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { withBase } from "@/lib/base-path";
import { formatCompact, stanceLabel, timeAgo } from "@/lib/labels";
import { cn } from "@/lib/utils";

type MentionRow = {
  id: string;
  text_original: string;
  source_kind: string;
  published_at: string;
  author_handle: string | null;
  sentiment: string | null;
  stance: string | null;
  theme: string | null;
  geo_municipality: string | null;
  confidence: number | null;
  is_synthetic: boolean;
  url: string | null;
  likes: number;
  replies: number;
  shares: number;
  views: number;
};

type Query = { source?: string; sentiment?: string; q?: string; offset?: string };

const PAGE = 30;

const SOURCES = [
  ["", "Todas las fuentes"],
  ["x", "X"],
  ["news", "Medios"],
  ["manual_upload", "Carga de censo"],
  ["youtube", "YouTube"],
  ["reddit", "Reddit"],
  ["web_public", "Web pública"],
  ["facebook", "Facebook"],
] as const;

const SENTIMENTS = [
  ["", "Todas", "border-line text-muted"],
  ["positive", "Positivas", "border-pos/40 text-pos"],
  ["negative", "Negativas", "border-neg/40 text-neg"],
  ["neutral", "Neutras", "border-neu/40 text-neu"],
] as const;

function hrefWith(id: string, query: Query, patch: Partial<Query>): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) {
      params.set(key, value);
    }
  }
  const text = params.toString();
  return `/estudios/${id}/menciones${text ? `?${text}` : ""}`;
}

export default async function MencionesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const { id } = await params;
  const query = await searchParams;
  const offset = Math.max(0, Number(query.offset || 0) || 0);
  const filters = new URLSearchParams({ study_id: id, limit: String(PAGE), offset: String(offset) });
  if (query.source) filters.set("source", query.source);
  if (query.sentiment) filters.set("sentiment", query.sentiment);
  if (query.q) filters.set("q", query.q);
  const response = await apiFetch(`/mentions?${filters.toString()}`);
  const page = response.ok ? ((await response.json()) as { items: MentionRow[]; total: number }) : { items: [], total: 0 };
  const now = new Date();
  const from = page.total ? offset + 1 : 0;
  const to = Math.min(offset + PAGE, page.total);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <form action={withBase(`/estudios/${id}/menciones`)} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={query.q || ""} placeholder="Buscar palabra, municipio, tema…" className="input pl-9" />
          </div>
          <select name="source" defaultValue={query.source || ""} className="input lg:w-52">
            {SOURCES.map(([value, label]) => (
              <option key={value || "all"} value={value}>
                {label}
              </option>
            ))}
          </select>
          {query.sentiment ? <input type="hidden" name="sentiment" value={query.sentiment} /> : null}
          <button type="submit" className={buttonVariants()}>
            <Filter className="h-4 w-4" />
            Aplicar
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {SENTIMENTS.map(([value, label, style]) => {
            const active = (query.sentiment || "") === value;
            return (
              <Link
                key={value || "all"}
                href={hrefWith(id, query, { sentiment: value, offset: "" })}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  active ? cn(style, "bg-white/5 font-medium") : "border-line text-muted hover:text-fg",
                )}
              >
                {label}
              </Link>
            );
          })}
          <span className="ml-auto text-xs text-muted">
            <span className="num text-fg">{page.total.toLocaleString("es-MX")}</span> menciones{query.q ? ` con «${query.q}»` : ""}
          </span>
        </div>
      </div>

      {page.items.length === 0 ? (
        <EmptyState icon={SearchX} title="Sin resultados" description="Prueba con otra palabra o quita un filtro." />
      ) : (
        <ul className="grid gap-3">
          {page.items.map((item, position) => (
            <li
              key={item.id}
              className="card card-hover animate-fade-up p-4"
              style={{ animationDelay: `${Math.min(position, 12) * 25}ms` }}
            >
              <div className="flex gap-3">
                <Avatar name={item.author_handle || item.source_kind} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span className="font-medium text-fg">{item.author_handle ? `@${item.author_handle.replace(/^@/, "")}` : "Sin autor"}</span>
                    <span>·</span>
                    <span>{timeAgo(item.published_at, now)}</span>
                    {item.geo_municipality ? (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.geo_municipality}
                        </span>
                      </>
                    ) : null}
                    {item.is_synthetic ? <span className="ml-auto rounded bg-warn/10 px-1.5 py-0.5 text-[10px] text-warn">sintética</span> : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg/90">{item.text_original}</p>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Fuente original
                    </a>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <SentimentBadge value={item.sentiment} />
                    <SourceBadge value={item.source_kind} />
                    {item.stance ? <span className="chip">{stanceLabel(item.stance)}</span> : null}
                    {item.theme ? <span className="chip">#{item.theme}</span> : null}
                    {item.confidence !== null ? (
                      <span className="chip">
                        confianza
                        <span className="relative h-1.5 w-12 overflow-hidden rounded-full bg-line">
                          <span
                            className={cn("absolute inset-y-0 left-0 rounded-full", item.confidence < 0.45 ? "bg-warn" : "bg-primary")}
                            style={{ width: `${Math.round(item.confidence * 100)}%` }}
                          />
                        </span>
                        <span className="num text-fg">{Math.round(item.confidence * 100)}%</span>
                      </span>
                    ) : null}
                    <span className="num ml-auto hidden items-center gap-3 text-xs text-muted sm:flex">
                      <span className="inline-flex items-center gap-1" title="Me gusta">
                        <Heart className="h-3.5 w-3.5" />
                        {formatCompact(item.likes)}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Respuestas">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {formatCompact(item.replies)}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Compartidos">
                        <Repeat2 className="h-3.5 w-3.5" />
                        {formatCompact(item.shares)}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Vistas">
                        <Eye className="h-3.5 w-3.5" />
                        {formatCompact(item.views)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Mostrando <span className="num text-fg">{from}</span>–<span className="num text-fg">{to}</span> de{" "}
          <span className="num text-fg">{page.total.toLocaleString("es-MX")}</span>
        </p>
        <div className="flex gap-2">
          {offset > 0 ? (
            <Link href={hrefWith(id, query, { offset: String(Math.max(0, offset - PAGE)) })} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <ChevronLeft className="h-4 w-4" /> Anteriores
            </Link>
          ) : null}
          {offset + PAGE < page.total ? (
            <Link href={hrefWith(id, query, { offset: String(offset + PAGE) })} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Siguientes <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
