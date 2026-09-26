import { NextResponse } from "next/server";

const API_TIMEOUT_MS = 8000;

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const api = process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(`${api}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (response.status === 429) {
      return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
    }
    if (!response.ok) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }
    const data = (await response.json()) as { access_token: string };
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const result = NextResponse.json({ ok: true });
    result.cookies.set("lmc_token", data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: proto === "https",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return result;
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar el servicio. Intenta de nuevo." },
      { status: 503 },
    );
  } finally {
    clearTimeout(timer);
  }
}
