"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block text-sm">
        <span className="text-mist">Usuario o correo</span>
        <input
          name="username"
          autoComplete="username"
          required
          className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 outline-none focus:border-brass"
        />
      </label>
      <label className="block text-sm">
        <span className="text-mist">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 outline-none focus:border-brass"
        />
      </label>
      {state?.error ? <p className="text-sm text-neg">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
