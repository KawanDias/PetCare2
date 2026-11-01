import { NextRequest } from "next/server";
import { ApiError, authenticate, databaseRequest, jsonError, tokenFromRequest } from "@/lib/server-api";

type AdoptionRequest = { petId: string; petName: string; imageUrl?: string; status: "pending"; createdAt: string };

export async function GET(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (!identity) throw new ApiError(401, "Autenticação necessária.");
    const value = await databaseRequest<Record<string, Omit<AdoptionRequest, "id">> | null>(`users/${identity.uid}/adoptionRequests`, {}, tokenFromRequest(request));
    return Response.json(Object.entries(value ?? {}).map(([id, item]) => ({ id, ...item })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), { status: 200 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (!identity) throw new ApiError(401, "Autenticação necessária.");
    const payload = await request.json() as Partial<AdoptionRequest>;
    if (!payload.petId || !payload.petName) throw new ApiError(400, "Pet e nome do pet são obrigatórios.");
    const pet = await databaseRequest<Record<string, unknown> | null>(`pets/${encodeURIComponent(payload.petId)}`);
    if (!pet) throw new ApiError(404, "Pet não encontrado.");
    const item = { petId: payload.petId, petName: payload.petName, imageUrl: payload.imageUrl ?? "", status: "pending", createdAt: new Date().toISOString(), userId: identity.uid };
    const created = await databaseRequest<{ name: string }>(`users/${identity.uid}/adoptionRequests`, { method: "POST", body: JSON.stringify(item) }, tokenFromRequest(request));
    return Response.json({ id: created.name, ...item }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
