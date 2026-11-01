import { NextRequest } from "next/server";
import { ApiError, authenticate, databaseRequest, jsonError, tokenFromRequest } from "@/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (!identity) throw new ApiError(401, "Autenticação necessária.");
    const profile = await databaseRequest<Record<string, unknown> | null>(`users/${identity.uid}`, {}, tokenFromRequest(request));
    return Response.json(profile ? { ...profile, uid: identity.uid, email: identity.email } : null, { status: 200 });
  } catch (error) {
    return jsonError(error);
  }
}

async function saveProfile(request: NextRequest, method: "PUT" | "PATCH") {
  const identity = await authenticate(request);
  if (!identity) throw new ApiError(401, "Autenticação necessária.");
  const payload = await request.json() as Record<string, unknown>;
  if (method === "PUT" && (!payload.displayName || !payload.email)) throw new ApiError(400, "Nome e e-mail são obrigatórios.");
  if (payload.role && payload.role !== "cliente" && !identity.isAdmin) throw new ApiError(403, "A role não pode ser alterada.");
  const safePayload = identity.isAdmin ? payload : { ...payload, uid: identity.uid, email: identity.email, role: payload.role ?? "cliente" };
  await databaseRequest(`users/${identity.uid}`, { method, body: JSON.stringify(safePayload) }, tokenFromRequest(request));
  return Response.json({ ...safePayload, uid: identity.uid, email: identity.email }, { status: method === "PUT" ? 201 : 200 });
}

export async function PUT(request: NextRequest) {
  try { return await saveProfile(request, "PUT"); } catch (error) { return jsonError(error); }
}

export async function PATCH(request: NextRequest) {
  try { return await saveProfile(request, "PATCH"); } catch (error) { return jsonError(error); }
}
