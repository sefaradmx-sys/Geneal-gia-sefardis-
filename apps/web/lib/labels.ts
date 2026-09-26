const SOURCES = ["news", "x", "youtube", "reddit", "web_public", "manual_upload", "facebook"] as const;

export type SourceKind = (typeof SOURCES)[number];

function isSource(value: string): value is SourceKind {
  return (SOURCES as readonly string[]).includes(value);
}

export function sourceLabel(kind: string): string {
  if (!isSource(kind)) {
    return kind;
  }
  switch (kind) {
    case "news":
      return "Medios";
    case "x":
      return "X";
    case "youtube":
      return "YouTube";
    case "reddit":
      return "Reddit";
    case "web_public":
      return "Web pública";
    case "manual_upload":
      return "Carga de censo";
    case "facebook":
      return "Facebook";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function sentimentLabel(value: string): string {
  switch (value) {
    case "positive":
      return "Positivo";
    case "negative":
      return "Negativo";
    case "neutral":
      return "Neutro";
    default:
      return value;
  }
}

export function formatIndex(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  const rounded = Math.round(value);
  if (rounded > 0) {
    return `+${rounded}`;
  }
  return String(rounded);
}

export function formatPct(value: number): string {
  return `${value.toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(value));
}
