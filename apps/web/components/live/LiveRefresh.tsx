"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function LiveRefresh({ intervalSeconds = 60 }: { intervalSeconds?: number }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const [pending, startTransition] = useTransition();

  const refreshNow = useCallback(() => {
    setSeconds(0);
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (seconds >= intervalSeconds) {
      refreshNow();
    }
  }, [seconds, intervalSeconds, refreshNow]);

  return (
    <button
      type="button"
      onClick={refreshNow}
      className="group inline-flex items-center gap-2 rounded-full border border-pos/25 bg-pos/10 px-3 py-1.5 text-xs text-pos transition hover:bg-pos/15"
      title="Recalcular ahora"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pos opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-pos" />
      </span>
      En vivo · {pending ? "recalculando" : seconds === 0 ? "recién calculado" : `hace ${seconds} s`}
      <RefreshCw className={cn("h-3 w-3 opacity-70 transition group-hover:opacity-100", pending && "animate-spin")} />
    </button>
  );
}
