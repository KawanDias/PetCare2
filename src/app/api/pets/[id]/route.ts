import { NextRequest } from "next/server";
import { ApiError, databaseRequest, jsonError, requireAdmin, tokenFromRequest } from "@/lib/server-api";
import type { Pet } from "@/lib/catalog-data";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const pet = await databaseRequest<Omit<Pet, "id"> | null>(`pets/${encodeURIComponent(id)}`);
    if (!pet) throw new ApiError(404, "Pet não encontrado.");
    return Response.json({ id, ...pet }, { status: 200 });
  } catch (error) {
    return jsonError(error);
  }
}

function validatePet(value: Partial<Pet>) {
  const required = ["name", "species", "breed", "age", "size", "sex", "imageUrls", "description"] as const;
  if (required.some((key) => !value[key] || (Array.isArray(value[key]) && value[key].length === 0))) {
    throw new ApiError(400, "Nome, espécie, raça, idade, porte, sexo, descrição e ao menos uma foto são obrigatórios.");
  }
  if (!Array.isArray(value.imageUrls) || value.imageUrls.length > 5) throw new ApiError(400, "Envie entre 1 e 5 fotos.");
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const pet = await request.json() as Partial<Pet>;
    validatePet(pet);
    const token = tokenFromRequest(request);
    const current = await databaseRequest<Omit<Pet, "id"> | null>(`pets/${encodeURIComponent(id)}`, {}, token);
    if (!current) throw new ApiError(404, "Pet não encontrado.");
    await databaseRequest(`pets/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(pet) }, token);
    return Response.json({ id, ...pet }, { status: 200 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const token = tokenFromRequest(request);
    const current = await databaseRequest<Omit<Pet, "id"> | null>(`pets/${encodeURIComponent(id)}`, {}, token);
    if (!current) throw new ApiError(404, "Pet não encontrado.");
    await databaseRequest(`pets/${encodeURIComponent(id)}`, { method: "DELETE" }, token);
    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(error);
  }
}
