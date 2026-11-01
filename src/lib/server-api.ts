import { NextRequest } from "next/server";

export const ADMIN_EMAIL = "kawangoleiro79@gmail.com";
const databaseUrl = (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim().replace(/^['"]|['"]$/g, "").trim() || "https://petcare-bf251-default-rtdb.firebaseio.com").replace(/\/$/, "");

type FirebaseIdentity = { localId: string; email?: string };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function authenticate(request: NextRequest, required = true) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    if (required) throw new ApiError(401, "Autenticação necessária.");
    return null;
  }
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new ApiError(500, "Configuração do Firebase incompleta.");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: header.slice(7) }),
    cache: "no-store"
  });
  if (!response.ok) throw new ApiError(401, "Sessão inválida ou expirada.");
  const data = await response.json() as { users?: FirebaseIdentity[] };
  const identity = data.users?.[0];
  if (!identity?.localId) throw new ApiError(401, "Sessão inválida ou expirada.");
  return { uid: identity.localId, email: identity.email?.toLowerCase() ?? "", isAdmin: identity.email?.toLowerCase() === ADMIN_EMAIL };
}

export async function requireAdmin(request: NextRequest) {
  const identity = await authenticate(request);
  if (!identity?.isAdmin) throw new ApiError(403, "Acesso administrativo necessário.");
  return identity;
}

export async function databaseRequest<T>(path: string, init: RequestInit = {}, token?: string) {
  if (!databaseUrl) throw new ApiError(500, "URL do Realtime Database não configurada.");
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const url = new URL(`${databaseUrl}/${path}.json`);
  if (token) url.searchParams.set("access_token", token);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const body = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) {
    const firebaseError = body && typeof body === "object" && "error" in body ? body.error : undefined;
    console.error("Firebase Realtime Database recusou a operação.", {
      status: response.status,
      path,
      error: firebaseError
    });
    const status = response.status === 401 ? 401 : response.status === 403 ? 403 : response.status;
    throw new ApiError(status, firebaseError ? `Firebase recusou a operação: ${firebaseError}` : "Operação recusada pelo banco de dados.");
  }
  return body as T;
}

export function tokenFromRequest(request: NextRequest) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Erro não tratado na API.", error);
  return Response.json({ error: "Erro interno do servidor." }, { status: 500 });
}
