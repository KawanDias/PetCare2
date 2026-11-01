import { NextRequest } from "next/server";
import { ApiError, authenticate, databaseRequest, jsonError, tokenFromRequest } from "@/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (!identity) throw new ApiError(401, "Autenticação necessária.");
    const value = await databaseRequest<Record<string, Record<string, unknown>> | null>("bookings", {}, tokenFromRequest(request));
    const bookings = Object.entries(value ?? {}).map(([id, item]) => ({ id, ...item } as Record<string, unknown>)).filter((item) => identity.isAdmin || item.customerId === identity.uid);
    return Response.json(bookings, { status: 200 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (!identity) throw new ApiError(401, "Autenticação necessária.");
    const payload = await request.json() as Record<string, unknown>;
    for (const field of ["customerName", "customerPhone", "serviceId", "date", "time"]) {
      if (typeof payload[field] !== "string" || !payload[field]) throw new ApiError(400, `O campo ${field} é obrigatório.`);
    }
    const booking = { ...payload, customerId: identity.uid, status: "awaiting_payment", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const created = await databaseRequest<{ name: string }>("bookings", { method: "POST", body: JSON.stringify(booking) }, tokenFromRequest(request));
    return Response.json({ id: created.name, ...booking }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
