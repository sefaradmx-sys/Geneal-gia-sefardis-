"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";

function apiBase(): string {
  return process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";
}

export async function askAction(
  studyId: string,
  question: string,
): Promise<{ answer: string; disclaimer: string; evidence: { id: string; text: string; source: string }[] } | { error: string }> {
  const response = await apiFetch(`/studies/${studyId}/ask`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
  if (!response.ok) {
    return { error: "No se pudo responder con las menciones guardadas." };
  }
  const data = (await response.json()) as {
    answer: string;
    disclaimer: string;
    evidence: { id: string; text: string; source: string }[];
  };
  return data;
}

export async function uploadAction(studyId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/estudios/${studyId}/carga?error=1`);
  }
  const jar = await cookies();
  const token = jar.get("lmc_token")?.value;
  if (!token) {
    redirect("/login");
  }
  const body = new FormData();
  body.set("file", file);
  const response = await fetch(`${apiBase()}/api/v1/studies/${studyId}/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
    cache: "no-store",
  });
  if (!response.ok) {
    redirect(`/estudios/${studyId}/carga?error=1`);
  }
  const data = (await response.json()) as { created: number; skipped: number; review: number };
  revalidatePath(`/estudios/${studyId}`);
  redirect(`/estudios/${studyId}/carga?created=${data.created}&skipped=${data.skipped}&review=${data.review}`);
}

export async function acknowledgeAlert(formData: FormData) {
  const studyId = String(formData.get("studyId") || "");
  const alertId = String(formData.get("alertId") || "");
  await apiFetch(`/studies/${studyId}/alerts/${alertId}/acknowledge`, { method: "POST" });
  revalidatePath(`/estudios/${studyId}/alertas`);
}

export async function createTargetAction(studyId: string, formData: FormData) {
  const response = await apiFetch(`/studies/${studyId}/targets`, {
    method: "POST",
    body: JSON.stringify({
      name: String(formData.get("name") || ""),
      kind: String(formData.get("kind") || "topic"),
      description: String(formData.get("description") || ""),
      comparable: formData.get("comparable") === "on",
    }),
  });
  if (!response.ok) {
    redirect(`/estudios/${studyId}/objetivos?error=1`);
  }
  revalidatePath(`/estudios/${studyId}`);
  redirect(`/estudios/${studyId}/objetivos`);
}
