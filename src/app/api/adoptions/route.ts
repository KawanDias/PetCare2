import { NextRequest } from "next/server";
import { ApiError, authenticate, databaseRequest, jsonError, tokenFromRequest } from "@/lib/server-api";

type AdoptionRequest = {
  petId: string;
  petName: string;
  imageUrl?: string;
  fullName: string;
  cpf: string;
  phone: string;
  address: string;
  motivation: string;
  status: "pending";
  createdAt: string;
};

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
    if (!payload.petId || !payload.petName || !payload.fullName || !payload.cpf || !payload.phone || !payload.address || !payload.motivation) {
      throw new ApiError(400, "Preencha todos os dados do adotante e do pet.");
    }
    const cpf = payload.cpf.replace(/\D/g, "");
    if (cpf.length !== 11) throw new ApiError(400, "Informe um CPF válido com 11 dígitos.");
    const pet = await databaseRequest<Record<string, unknown> | null>(`pets/${encodeURIComponent(payload.petId)}`);
    if (!pet) throw new ApiError(404, "Pet não encontrado.");
    if (!process.env.RESEND_API_KEY) throw new ApiError(503, "O envio de e-mail não está configurado.");
    const item = {
      petId: payload.petId,
      petName: payload.petName,
      imageUrl: payload.imageUrl ?? "",
      fullName: payload.fullName.trim(),
      cpf,
      phone: payload.phone.trim(),
      address: payload.address.trim(),
      motivation: payload.motivation.trim(),
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      userId: identity.uid
    };
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        to: ["kawangoleiro79@gmail.com"],
        subject: `Nova solicitação de adoção: ${item.petName}`,
        text: [
          `Pet: ${item.petName} (ID: ${item.petId})`,
          `Nome completo: ${item.fullName}`,
          `CPF: ${item.cpf}`,
          `Telefone: ${item.phone}`,
          `Endereço: ${item.address}`,
          `Motivação: ${item.motivation}`,
          `Usuário Firebase: ${identity.uid}`
        ].join("\n")
      })
    });
    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error("Resend recusou o envio da solicitação de adoção.", emailError);
      throw new ApiError(502, "Não foi possível enviar a solicitação por e-mail.");
    }
    const created = await databaseRequest<{ name: string }>(`users/${identity.uid}/adoptionRequests`, { method: "POST", body: JSON.stringify(item) }, tokenFromRequest(request));
    return Response.json({ id: created.name, ...item }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
