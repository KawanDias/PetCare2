import { NextRequest } from "next/server";
import { ApiError, databaseRequest, jsonError, requireAdmin, tokenFromRequest } from "@/lib/server-api";
import type { Pet } from "@/lib/catalog-data";

function validatePet(value: Partial<Pet>) {
  const required = ["name", "species", "breed", "age", "size", "sex", "imageUrls", "description"] as const;
  if (required.some((key) => !value[key] || (Array.isArray(value[key]) && value[key].length === 0))) {
    throw new ApiError(400, "Nome, espécie, raça, idade, porte, sexo, descrição e ao menos uma foto são obrigatórios.");
  }
  if (!Array.isArray(value.imageUrls) || value.imageUrls.length > 5) throw new ApiError(400, "Envie entre 1 e 5 fotos.");
}

export async function GET() {
  try {
    const value = await databaseRequest<Record<string, Omit<Pet, "id">> | null>("pets");
    if (value !== null && (typeof value !== "object" || Array.isArray(value))) {
      throw new ApiError(502, "Resposta inválida do Realtime Database.");
    }
    return Response.json(Object.entries(value ?? {}).map(([id, pet]) => ({ id, ...pet })), { status: 200 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const pet = await request.json() as Partial<Pet>;
    validatePet(pet);
    const token = tokenFromRequest(request);
    const created = await databaseRequest<Pet>("pets", { method: "POST", body: JSON.stringify(pet) }, token);
    return Response.json({ ...pet, id: (created as unknown as { name: string }).name }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
