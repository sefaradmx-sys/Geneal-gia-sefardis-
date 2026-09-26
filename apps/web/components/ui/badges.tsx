import { Minus, ThumbsDown, ThumbsUp } from "lucide-react";
import { sentimentLabel, sourceLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

const SENTIMENT_STYLE: Record<string, string> = {
  positive: "border-pos/30 bg-pos/10 text-pos",
  negative: "border-neg/30 bg-neg/10 text-neg",
  neutral: "border-neu/30 bg-neu/10 text-neu",
};

export function SentimentBadge({ value }: { value: string | null }) {
  if (!value) {
    return <span className="chip border-warn/30 bg-warn/10 text-warn">En revisión</span>;
  }
  const Icon = value === "positive" ? ThumbsUp : value === "negative" ? ThumbsDown : Minus;
  return (
    <span className={cn("chip", SENTIMENT_STYLE[value] || "")}>
      <Icon className="h-3 w-3" />
      {sentimentLabel(value)}
    </span>
  );
}

const SOURCE_DOT: Record<string, string> = {
  x: "bg-fg",
  news: "bg-accent",
  manual_upload: "bg-primary",
  youtube: "bg-neg",
  reddit: "bg-warn",
  web_public: "bg-pos",
  facebook: "bg-[#60a5fa]",
};

export function SourceBadge({ value }: { value: string }) {
  return (
    <span className="chip">
      <span className={cn("h-1.5 w-1.5 rounded-full", SOURCE_DOT[value] || "bg-muted")} />
      {sourceLabel(value)}
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const clean = name.replace(/^@/, "").trim() || "?";
  const letters = clean
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  let hash = 0;
  for (const char of clean) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }
  return (
    <span
      className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white", className)}
      style={{ background: `linear-gradient(135deg, hsl(${hash} 70% 55%), hsl(${(hash + 60) % 360} 70% 45%))` }}
    >
      {letters || "?"}
    </span>
  );
}
