"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label className="label" htmlFor="username">
          Usuario o correo
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input id="username" name="username" autoComplete="username" required placeholder="admin" className="input h-11 pl-10" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="password">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Escribe tu contraseña"
            className="input h-11 pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-fg"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {state?.error ? (
        <p className="flex items-center gap-2 rounded-xl border border-neg/30 bg-neg/10 px-3 py-2 text-sm text-neg animate-fade-up">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Entrando…" : "Entrar al tablero"}
        {!pending ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>
    </form>
  );
}
