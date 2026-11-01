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
  cep: string;
  street: string;
  neighborhood: string;
  number: string;
  city: string;
  state: string;
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
    const cep = payload.cep?.replace(/\D/g, "") ?? "";
    if (cep.length !== 8 || !payload.street || !payload.neighborhood || !payload.number || !payload.city || !payload.state) {
      throw new ApiError(400, "Informe um endereço completo e um CEP válido.");
    }
    const pet = await databaseRequest<Record<string, unknown> | null>(`pets/${encodeURIComponent(payload.petId)}`);
    if (!pet) throw new ApiError(404, "Pet não encontrado.");
    // Configure these server-only variables in .env.local and in Vercel:
    // RESEND_API_KEY is the Resend API key and RESEND_FROM_EMAIL must be a
    // verified sender domain/address in Resend. Never expose either variable
    // with a NEXT_PUBLIC_ prefix.
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      throw new ApiError(503, "O envio de e-mail não está configurado.");
    }
    const item = {
      petId: payload.petId,
      petName: payload.petName,
      imageUrl: payload.imageUrl ?? "",
      fullName: payload.fullName.trim(),
      cpf,
      phone: payload.phone.trim(),
      address: payload.address.trim(),
      cep,
      street: payload.street.trim(),
      neighborhood: payload.neighborhood.trim(),
      number: payload.number.trim(),
      city: payload.city.trim(),
      state: payload.state.trim().toUpperCase(),
      motivation: payload.motivation.trim(),
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      userId: identity.uid
    };
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: ["kawangoleiro79@gmail.com"],
        subject: `Nova solicitação de adoção: ${item.petName}`,
        text: [
          `Pet: ${item.petName} (ID: ${item.petId})`,
          `Nome completo: ${item.fullName}`,
          `CPF: ${item.cpf}`,
          `Telefone: ${item.phone}`,
          `Endereço: ${item.address}`,
          `CEP: ${item.cep}`,
          `Rua: ${item.street}`,
          `Número: ${item.number}`,
          `Bairro: ${item.neighborhood}`,
          `Cidade/UF: ${item.city}/${item.state}`,
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
