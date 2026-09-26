"use client";

import { Bot, CornerDownLeft, Quote, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { askAction } from "@/app/estudios/[id]/actions";
import { SentimentBadge, SourceBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";

type Turn = {
  question: string;
  answer?: string;
  disclaimer?: string;
  evidence?: { id: string; text: string; source: string; sentiment?: string; municipality?: string | null }[];
  error?: string;
};

const SUGGESTIONS = [
  "¿Por qué subió la negatividad?",
  "¿Quién tiene mejor sentimiento?",
  "¿Qué se dice del agua?",
  "¿Qué pasa con la seguridad?",
];

export function AskForm({ studyId }: { studyId: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, pending]);

  async function ask(question: string) {
    const text = question.trim();
    if (text.length < 3 || pending) {
      return;
    }
    setDraft("");
    setPending(true);
    setTurns((current) => [...current, { question: text }]);
    const response = await askAction(studyId, text);
    setPending(false);
    setTurns((current) => {
      const next = [...current];
      const last = next[next.length - 1];
      next[next.length - 1] = "error" in response ? { ...last, error: response.error } : { ...last, ...response };
      return next;
    });
  }

  return (
    <div className="card flex min-h-[560px] flex-col overflow-hidden">
      <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-6">
        {turns.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_12px_32px_-8px_rgba(124,92,255,0.7)]">
              <Sparkles className="h-6 w-6" />
            </span>
            <p className="mt-4 font-display text-xl text-fg">Pregúntale al estudio</p>
            <p className="mt-1 max-w-md text-sm text-muted">La respuesta sale de los hallazgos calculados y cita menciones ya guardadas. No inventa citas.</p>
            <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  className="rounded-full border border-line bg-elevated/60 px-3.5 py-2 text-xs text-fg/90 transition hover:border-primary/50 hover:bg-primary/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {turns.map((turn, position) => (
          <div key={position} className="space-y-3 animate-fade-up">
            <div className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-primary to-[#5b3df5] px-4 py-2.5 text-sm text-white">{turn.question}</p>
            </div>
            {turn.answer || turn.error ? (
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-elevated text-primary">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="min-w-0 max-w-[88%] space-y-3">
                  <p className={turn.error ? "text-sm text-neg" : "rounded-2xl rounded-tl-md border border-line bg-elevated/60 px-4 py-3 text-sm leading-relaxed text-fg"}>
                    {turn.error || turn.answer}
                  </p>
                  {turn.evidence?.length ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      {turn.evidence.map((item) => (
                        <div key={item.id} className="rounded-xl border border-line bg-canvas/50 p-3">
                          <Quote className="h-3.5 w-3.5 text-primary/70" />
                          <p className="mt-1 text-xs leading-relaxed text-fg/85">{item.text}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.sentiment ? <SentimentBadge value={item.sentiment} /> : null}
                            <SourceBadge value={item.source} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {turn.disclaimer ? <p className="text-[11px] text-muted">{turn.disclaimer}</p> : null}
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {pending ? (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-elevated text-primary">
              <Bot className="h-4 w-4" />
            </span>
            <span className="flex gap-1 rounded-2xl border border-line bg-elevated/60 px-4 py-3">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${dot * 120}ms` }} />
              ))}
            </span>
          </div>
        ) : null}
        <div ref={bottom} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(draft);
        }}
        className="border-t border-line bg-surface/80 p-3 md:p-4"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-canvas/70 p-2 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                ask(draft);
              }
            }}
            rows={1}
            maxLength={500}
            placeholder="Escribe una pregunta sobre el estudio…"
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-fg outline-none placeholder:text-muted/60"
          />
          <Button type="submit" disabled={pending || draft.trim().length < 3}>
            Enviar
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted">Modo léxico: busca en las menciones guardadas. Enter envía, Shift+Enter agrega línea.</p>
      </form>
    </div>
  );
}
