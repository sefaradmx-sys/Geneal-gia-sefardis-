"use client";

import { useState } from "react";
import { askAction } from "@/app/estudios/[id]/actions";
import { sourceLabel } from "@/lib/labels";

type Answer = {
  answer: string;
  disclaimer: string;
  evidence: { id: string; text: string; source: string }[];
};

export function AskForm({ studyId }: { studyId: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Answer | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const question = String(formData.get("question") || "");
    const response = await askAction(studyId, question);
    setPending(false);
    if ("error" in response) {
      setResult(null);
      setError(response.error);
      return;
    }
    setResult(response);
  }

  return (
    <form action={onSubmit} className="mt-4 space-y-3">
      <textarea
        name="question"
        required
        minLength={3}
        rows={3}
        placeholder="¿Por qué subió la negatividad?"
        className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white"
      />
      <button className="rounded-md bg-brass px-3 py-2 text-sm text-ink disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Buscando menciones…" : "Preguntar"}
      </button>
      {error ? <p className="text-sm text-neg">{error}</p> : null}
      {result ? (
        <section className="rounded-lg border border-line bg-panel px-4 py-3">
          <p className="text-sm text-white">{result.answer}</p>
          <ul className="mt-3 space-y-2">
            {result.evidence.map((item) => (
              <li key={item.id} className="text-xs text-mist">
                {sourceLabel(item.source)} · {item.text}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-mist">{result.disclaimer}</p>
        </section>
      ) : null}
    </form>
  );
}
