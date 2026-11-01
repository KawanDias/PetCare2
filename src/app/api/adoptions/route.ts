import { NextRequest } from "next/server";
import { ApiError, authenticate, databaseRequest, jsonError, tokenFromRequest } from "@/lib/server-api";

type AdoptionStatus = "pendente" | "approved" | "negado" | "completed";
type AdoptionRequest = {
  petId: string;
  petNome: string;
  petFoto?: string;
  nomeAdotante: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: { cep: string; rua: string; bairro: string; numero: string; cidade?: string; uf?: string };
  justificativa: string;
  status: AdoptionStatus;
  dataCriacao: string;
  userId: string;
};

function normalizeRequest(id: string, item: Partial<AdoptionRequest>) {
  const legacy = item as Partial<AdoptionRequest> & Record<string, unknown>;
  const endereco = item.endereco ?? {
    cep: String(legacy.cep ?? ""),
    rua: String(legacy.street ?? ""),
    bairro: String(legacy.neighborhood ?? ""),
    numero: String(legacy.number ?? ""),
    cidade: String(legacy.city ?? ""),
    uf: String(legacy.state ?? "")
  };
  return {
    id,
    ...item,
    petNome: item.petNome ?? String(legacy.petName ?? ""),
    petFoto: item.petFoto ?? String(legacy.imageUrl ?? ""),
    nomeAdotante: item.nomeAdotante ?? String(legacy.fullName ?? ""),
    telefone: item.telefone ?? String(legacy.phone ?? ""),
    email: item.email ?? String(legacy.userEmail ?? ""),
    endereco,
    justificativa: item.justificativa ?? String(legacy.motivation ?? ""),
    dataCriacao: item.dataCriacao ?? String(legacy.createdAt ?? ""),
    status: item.status ?? "pendente",
    petName: item.petNome ?? String(legacy.petName ?? ""),
    imageUrl: item.petFoto ?? String(legacy.imageUrl ?? ""),
    fullName: item.nomeAdotante ?? String(legacy.fullName ?? ""),
    phone: item.telefone ?? String(legacy.phone ?? ""),
    userEmail: item.email ?? String(legacy.userEmail ?? ""),
    motivation: item.justificativa ?? String(legacy.motivation ?? ""),
    address: endereco.rua ? `${endereco.rua}, ${endereco.numero} - ${endereco.bairro} - CEP ${endereco.cep}` : ""
  };
}

export async function GET(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (!identity) throw new ApiError(401, "Autenticação necessária.");
    const value = await databaseRequest<Record<string, Partial<AdoptionRequest>> | null>("solicitacoes", {}, tokenFromRequest(request));
    const requests = Object.entries(value ?? {}).map(([id, item]) => normalizeRequest(id, item));
    return Response.json(
      requests.filter((item) => identity.isAdmin || item.userId === identity.uid).sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao)),
      { status: 200 }
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (!identity) throw new ApiError(401, "Autenticação necessária.");
    const payload = await request.json() as Record<string, unknown>;
    const petId = String(payload.petId ?? "");
    const petNome = String(payload.petNome ?? payload.petName ?? "");
    const nomeAdotante = String(payload.nomeAdotante ?? payload.fullName ?? "");
    const telefone = String(payload.telefone ?? payload.phone ?? "");
    const justificativa = String(payload.justificativa ?? payload.motivation ?? "");
    const inputAddress = payload.endereco as Record<string, unknown> | undefined;
    const endereco = {
      cep: String(inputAddress?.cep ?? payload.cep ?? "").replace(/\D/g, ""),
      rua: String(inputAddress?.rua ?? payload.street ?? ""),
      bairro: String(inputAddress?.bairro ?? payload.neighborhood ?? ""),
      numero: String(inputAddress?.numero ?? payload.number ?? ""),
      cidade: String(inputAddress?.cidade ?? payload.city ?? ""),
      uf: String(inputAddress?.uf ?? payload.state ?? "").toUpperCase()
    };
    if (!petId || !petNome || !nomeAdotante || !payload.cpf || !telefone || !justificativa) {
      throw new ApiError(400, "Preencha todos os dados do adotante e do pet.");
    }
    const cpf = String(payload.cpf).replace(/\D/g, "");
    if (cpf.length !== 11) throw new ApiError(400, "Informe um CPF válido com 11 dígitos.");
    if (endereco.cep.length !== 8 || !endereco.rua || !endereco.bairro || !endereco.numero || !endereco.cidade || !endereco.uf) {
      throw new ApiError(400, "Informe um endereço completo e um CEP válido.");
    }
    const pet = await databaseRequest<Record<string, unknown> | null>(`pets/${encodeURIComponent(petId)}`);
    if (!pet) throw new ApiError(404, "Pet não encontrado.");
    const item: AdoptionRequest = {
      petId,
      petNome: petNome.trim(),
      petFoto: String(payload.petFoto ?? payload.imageUrl ?? (Array.isArray(pet.imageUrls) ? pet.imageUrls[0] : "") ?? ""),
      nomeAdotante: nomeAdotante.trim(),
      cpf,
      telefone: telefone.trim(),
      email: String(payload.email ?? identity.email ?? "").trim(),
      endereco,
      justificativa: justificativa.trim(),
      status: "pendente",
      dataCriacao: new Date().toISOString(),
      userId: identity.uid
    };
    const created = await databaseRequest<{ name: string }>("solicitacoes", { method: "POST", body: JSON.stringify(item) }, tokenFromRequest(request));
    return Response.json({ id: created.name, ...item }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (!identity?.isAdmin) throw new ApiError(403, "Apenas administradores podem atualizar solicitações.");
    const payload = await request.json() as { requestId?: string; status?: AdoptionStatus };
    if (!payload.requestId || !payload.status || !["approved", "negado", "completed"].includes(payload.status)) {
      throw new ApiError(400, "Solicitação ou status inválido.");
    }
    const token = tokenFromRequest(request);
    const path = `solicitacoes/${encodeURIComponent(payload.requestId)}`;
    const current = await databaseRequest<Partial<AdoptionRequest> | null>(path, {}, token);
    if (!current) throw new ApiError(404, "Solicitação não encontrada.");
    const updated = { ...current, status: payload.status };
    await databaseRequest(path, { method: "PUT", body: JSON.stringify(updated) }, token);
    if ((payload.status === "approved" || payload.status === "completed") && current.userId) {
      await databaseRequest(`usuarios/${encodeURIComponent(current.userId)}/historico/${encodeURIComponent(payload.requestId)}`, { method: "PUT", body: JSON.stringify(updated) }, token);
    }
    return Response.json({ id: payload.requestId, ...updated }, { status: 200 });
  } catch (error) {
    return jsonError(error);
  }
}
