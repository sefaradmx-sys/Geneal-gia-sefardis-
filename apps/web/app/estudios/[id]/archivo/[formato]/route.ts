import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(_request: Request, context: { params: Promise<{ id: string; formato: string }> }) {
  const { id, formato } = await context.params;
  const media = TYPES[formato];
  if (!media) {
    return new NextResponse("Formato no disponible", { status: 404 });
  }
  const response = await apiFetch(`/studies/${id}/exports/${formato}`);
  if (!response.ok) {
    return new NextResponse("No se pudo generar el archivo", { status: response.status });
  }
  const bytes = await response.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": media,
      "Content-Disposition": `attachment; filename="la-mv-census.${formato}"`,
    },
  });
}
