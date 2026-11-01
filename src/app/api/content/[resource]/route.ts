import { NextRequest } from "next/server";
import { ApiError, databaseRequest, jsonError } from "@/lib/server-api";

const publicResources = new Set(["services", "gallery", "products", "professionals"]);

export async function GET(_request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await context.params;
    if (!publicResources.has(resource)) throw new ApiError(404, "Recurso não encontrado.");
    const value = await databaseRequest<Record<string, unknown> | null>(resource);
    return Response.json(Object.entries(value ?? {}).map(([id, item]) => ({ id, ...(item as object) })), { status: 200 });
  } catch (error) {
    return jsonError(error);
  }
}
