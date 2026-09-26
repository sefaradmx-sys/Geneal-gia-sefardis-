"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";

export async function createUserAction(formData: FormData) {
  const response = await apiFetch("/users", {
    method: "POST",
    body: JSON.stringify({
      username: String(formData.get("username") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      role: String(formData.get("role") || "analyst"),
    }),
  });
  if (!response.ok) {
    redirect("/equipo?error=1");
  }
  redirect("/equipo");
}
