import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function apiBase(): string {
  return process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const jar = await cookies();
  const token = jar.get("lmc_token")?.value;
  if (!token) {
    redirect("/login");
  }
  let response: Response;
  try {
    response = await fetch(`${apiBase()}/api/v1${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    return new Response(JSON.stringify({ detail: "servicio no disponible" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (response.status === 401) {
    redirect("/login");
  }
  return response;
}
