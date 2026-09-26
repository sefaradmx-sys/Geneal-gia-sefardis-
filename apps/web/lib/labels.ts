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

const ROLES = ["superadmin", "analyst", "client_reader", "auditor"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function roleLabel(role: string): string {
  if (!isRole(role)) {
    return role;
  }
  switch (role) {
    case "superadmin":
      return "Súper administrador";
    case "analyst":
      return "Analista";
    case "client_reader":
      return "Lectura";
    case "auditor":
      return "Auditoría";
    default: {
      const exhaustive: never = role;
      return exhaustive;
    }
  }
}

const KINDS = ["politician", "government", "state", "party", "topic", "institution"] as const;
type TargetKind = (typeof KINDS)[number];

function isKind(value: string): value is TargetKind {
  return (KINDS as readonly string[]).includes(value);
}

export function targetKindLabel(kind: string): string {
  if (!isKind(kind)) {
    return kind;
  }
  switch (kind) {
    case "politician":
      return "Perfil";
    case "government":
      return "Gobierno";
    case "state":
      return "Estado";
    case "party":
      return "Partido";
    case "topic":
      return "Tema";
    case "institution":
      return "Institución";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

const STANCES = ["in_favor", "against", "not_applicable"] as const;
type Stance = (typeof STANCES)[number];

function isStance(value: string): value is Stance {
  return (STANCES as readonly string[]).includes(value);
}

export function stanceLabel(value: string): string {
  if (!isStance(value)) {
    return value;
  }
  switch (value) {
    case "in_favor":
      return "A favor";
    case "against":
      return "En contra";
    case "not_applicable":
      return "No aplica";
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function shortDay(value: string): string {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(value));
}

export function timeAgo(value: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(value).getTime()) / 1000));
  if (seconds < 60) {
    return "hace un momento";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `hace ${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `hace ${hours} h`;
  }
  const days = Math.round(hours / 24);
  return days === 1 ? "hace 1 día" : `hace ${days} días`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(value));
}
