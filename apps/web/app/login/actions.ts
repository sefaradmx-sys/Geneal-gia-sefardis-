"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";

function apiBase(): string {
  return process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";
}

export async function loginAction(
  _state: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const response = await fetch(`${apiBase()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });
  if (response.status === 429) {
    return { error: "Demasiados intentos. Espera unos minutos." };
  }
  if (!response.ok) {
    return { error: "Credenciales inválidas" };
  }
  const data = (await response.json()) as { access_token: string };
  const jar = await cookies();
  jar.set("lmc_token", data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect("/estudios");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete("lmc_token");
  redirect("/login");
}

export async function createStudyAction(formData: FormData) {
  const response = await apiFetch("/studies", {
    method: "POST",
    body: JSON.stringify({
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      window_start: String(formData.get("window_start") || ""),
      window_end: String(formData.get("window_end") || ""),
    }),
  });
  if (!response.ok) {
    redirect("/estudios/nuevo?error=1");
  }
  const study = (await response.json()) as { id: string };
  redirect(`/estudios/${study.id}`);
}
