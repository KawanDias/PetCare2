"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Edit3, Inbox, MessageCircle, PawPrint, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Pet } from "@/lib/catalog-data";
import { apiFetch } from "@/lib/api";
import { NotificationBell } from "@/components/NotificationBell";
import { database } from "@/lib/firebase";
import { onValue, ref, remove } from "firebase/database";

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

const choices = {
  species: ["Cachorro", "Gato", "Aves", "Outros"],
  size: ["Pequeno", "Médio", "Grande"],
  sex: ["Fêmea", "Macho"],
  yesNo: ["Sim", "Não"]
};

type PetFormData = {
  name: string;
  species: string;
  breed: string;
  age: string;
  size: string;
  sex: string;
  coat: string;
  vaccinated: string;
  neutered: string;
  dewormed: string;
  temperament: string;
  description: string;
  emDestaque: boolean;
};

type AdoptionRequest = {
  id: string;
  excluidoPeloUsuario?: boolean;
  userId?: string;
  petId: string;
  petNome?: string;
  petFoto?: string;
  nomeAdotante?: string;
  petName?: string;
  imageUrl?: string;
  fullName?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  phone?: string;
  userEmail?: string;
  address?: string;
  cep?: string;
  street?: string;
  neighborhood?: string;
  number?: string;
  city?: string;
  state?: string;
  endereco?: { cep?: string; rua?: string; bairro?: string; numero?: string; cidade?: string; uf?: string };
  justificativa?: string;
  motivation?: string;
  status: "pendente" | "pending" | "approved" | "negado" | "completed" | "cancelled";
  dataCriacao: string;
};

type AdminTab = "pets" | "create" | "adoptions" | "adoptions-finished";

const emptyFormData: PetFormData = {
  name: "", species: "", breed: "", age: "", size: "", sex: "", coat: "",
  vaccinated: "", neutered: "", dewormed: "", temperament: "", description: "", emDestaque: false
};

function normalizeOption(value: unknown, options: string[], aliases: Record<string, string> = {}) {
  const normalized = String(value ?? "").trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const option = aliases[normalized] ?? normalized;
  return options.find((item) => item.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "") === option) ?? String(value ?? "").trim();
}

function petToFormData(pet: Pet & Record<string, unknown>): PetFormData {
  const field = (...names: string[]) => names.map((name) => pet[name]).find((value) => value !== undefined && value !== null) ?? "";
  return {
    name: String(field("name")),
    species: normalizeOption(field("species", "especie"), choices.species, { cao: "cachorro", cachorro: "cachorro" }),
    breed: String(field("breed", "raca")),
    age: String(field("age", "idade")),
    size: normalizeOption(field("size", "porte"), choices.size),
    sex: normalizeOption(field("sex", "sexo"), choices.sex),
    coat: String(field("coat", "pelagem", "cor")),
    vaccinated: normalizeOption(field("vaccinated", "vacinado"), choices.yesNo),
    neutered: normalizeOption(field("neutered", "castrado"), choices.yesNo),
    dewormed: normalizeOption(field("dewormed", "vermifugado"), choices.yesNo),
    temperament: String(field("temperament", "personalidade")),
    description: String(field("description", "historia")),
    emDestaque: Boolean(pet.emDestaque)
  };
}

function getPetId(pet: Pet & { key?: string }) {
  return String(pet.id || pet.key || "").trim();
}

function normalizeAdoptionRequest(id: string, value: Partial<AdoptionRequest> & Record<string, unknown>): AdoptionRequest {
  const address = value.endereco && typeof value.endereco === "object"
    ? value.endereco as NonNullable<AdoptionRequest["endereco"]>
    : undefined;
  const street = String(value.rua ?? address?.rua ?? value.street ?? "");
  const neighborhood = String(value.bairro ?? address?.bairro ?? value.neighborhood ?? "");
  const number = String(value.numero ?? address?.numero ?? value.number ?? "");
  const cep = String(value.cep ?? address?.cep ?? "");
  const userId = String(value.userId ?? value.usuarioId ?? value.uid ?? "");
  const petName = String(value.petNome ?? value.petName ?? "");
  const imageUrl = String(value.petFoto ?? value.imageUrl ?? "");
  const fullName = String(value.nomeAdotante ?? value.nome ?? value.fullName ?? "");
  const phone = String(value.telefone ?? value.phone ?? "");
  const email = String(value.email ?? value.userEmail ?? "");
  const motivation = String(value.justificativa ?? value.motivacao ?? value.motivation ?? "");
  return {
    ...value,
    id,
    userId,
    petId: String(value.petId ?? ""),
    petNome: petName,
    petFoto: imageUrl,
    nomeAdotante: fullName,
    petName,
    imageUrl,
    fullName,
    cpf: String(value.cpf ?? ""),
    telefone: phone,
    phone,
    email,
    userEmail: email,
    endereco: { cep, rua: street, bairro: neighborhood, numero: number, cidade: address?.cidade, uf: address?.uf },
    cep,
    street,
    neighborhood,
    number,
    address: String(value.enderecoCompleto ?? (street ? `${street}, nº ${number} - ${neighborhood} (CEP: ${cep})` : value.address ?? "")),
    justificativa: motivation,
    motivation,
    status: (value.status ?? "pendente") as AdoptionRequest["status"],
    dataCriacao: String(value.dataCriacao ?? value.createdAt ?? "")
  };
}

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("pets");
  const [pets, setPets] = useState<Pet[]>([]);
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [formData, setFormData] = useState<PetFormData>(emptyFormData);
  const editing = pets.find((pet) => getPetId(pet) === editingId);

  useEffect(() => {
    setFormData(editing ? petToFormData(editing as Pet & Record<string, unknown>) : emptyFormData);
  }, [editing, editingId]);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) router.replace("/");
  }, [loading, role, router, user]);

  useEffect(() => {
    if (!user || role !== "admin") return;
    void apiFetch<Pet[]>("/api/pets")
      .then(setPets)
      .catch((error) => { console.error("Erro ao carregar pets do painel.", error); setMessage("Não foi possível carregar os pets."); });
    const requestsRef = ref(database, "solicitacoes");
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Partial<AdoptionRequest>> | null;
      setRequests(Object.entries(data ?? {}).map(([id, request]) => normalizeAdoptionRequest(id, request as Partial<AdoptionRequest> & Record<string, unknown>)));
    }, (error) => {
      console.error("Erro ao escutar solicitações em tempo real.", error);
    });
    return unsubscribe;
  }, [role, user]);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "adoptions" || tab === "adoptions-finished" || tab === "create" || tab === "pets") setActiveTab(tab);
  }, []);

  const filteredPets = useMemo(() => pets.filter((pet) => pet.name.toLowerCase().includes(search.toLowerCase())), [pets, search]);
  const pendingRequests = requests.filter((request) => ["pending", "pendente", "em andamento"].includes(request.status.toLowerCase()));

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 5 || files.some((file) => !file.type.startsWith("image/"))) {
      setSelectedImages([]);
      setMessage(files.length > 5 ? "Selecione no máximo 5 imagens." : "Selecione apenas arquivos de imagem.");
      event.target.value = "";
      return;
    }
    setSelectedImages(files);
    setMessage(files.length ? `${files.length} imagem(ns) selecionada(s).` : "");
  }

  function startEditing(pet: Pet) {
    const petId = getPetId(pet);
    if (!petId) {
      setMessage("Não foi possível identificar o pet para edição.");
      return;
    }
    setEditingId(petId);
    setFormData(petToFormData(pet as Pet & Record<string, unknown>));
    setSelectedImages([]);
    setActiveTab("create");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const existingImages = editing?.imageUrls ?? editing?.images ?? (editing?.image ? [editing.image] : []);
    try {
      const images = selectedImages.length ? await Promise.all(selectedImages.map(fileToBase64)) : existingImages;
      if (!images.length) { setMessage("Adicione pelo menos 1 foto do pet."); return; }
      const pet: Pet = {
        id: editingId ?? "", name: String(data.get("name") ?? "").trim(),
        species: String(data.get("species") ?? ""), breed: String(data.get("breed") ?? "").trim(),
        age: String(data.get("age") ?? "").trim(), size: String(data.get("size") ?? ""),
        sex: String(data.get("sex") ?? ""), coat: String(data.get("coat") ?? "").trim(),
        vaccinated: String(data.get("vaccinated") ?? ""), neutered: String(data.get("neutered") ?? ""),
        dewormed: String(data.get("dewormed") ?? ""), temperament: String(data.get("temperament") ?? "").trim(),
        description: String(data.get("description") ?? "").trim(), imageUrls: images, images, image: images[0],
        emDestaque: data.get("emDestaque") === "on", status: editing?.status ?? "disponivel"
      };
      const selectedPetId = editingId;
      const saved = selectedPetId
        ? await apiFetch<Pet>(`/api/pets/${encodeURIComponent(selectedPetId)}`, { method: "PUT", body: JSON.stringify({ ...pet, id: selectedPetId }) })
        : await apiFetch<Pet>("/api/pets", { method: "POST", body: JSON.stringify(pet) });
      setPets((items) => selectedPetId
        ? items.map((item) => getPetId(item) === selectedPetId ? { ...saved, id: selectedPetId } : item)
        : [...items, saved]);
      setEditingId(null);
      setSelectedImages([]);
      form.reset();
      setFormData(emptyFormData);
      setActiveTab("pets");
      setMessage(`${pet.name} salvo com sucesso.`);
    } catch (error) {
      console.error("Erro ao gravar pet.", error);
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o pet.");
    }
  }

  async function removePet(pet: Pet) {
    if (!window.confirm(`Excluir "${pet.name}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await apiFetch(`/api/pets/${encodeURIComponent(pet.id)}`, { method: "DELETE" });
      setPets((items) => items.filter((item) => item.id !== pet.id));
      setMessage(`${pet.name} removido.`);
    } catch (error) {
      console.error("Erro ao excluir pet.", error);
      setMessage("Não foi possível excluir o pet.");
    }
  }

  async function markRequestAdopted(request: AdoptionRequest) {
    const pet = pets.find((item) => item.id === request.petId);
    if (!pet || !request.userId) return;
    if (!window.confirm(`Marcar "${pet.name}" como adotado? Ele deixará de aparecer na vitrine pública.`)) return;
    try {
      await apiFetch(`/api/adoptions`, { method: "PATCH", body: JSON.stringify({ requestId: request.id, status: "approved" }) });
      const saved = await apiFetch<Pet>(`/api/pets/${encodeURIComponent(pet.id)}`, { method: "PUT", body: JSON.stringify({ ...pet, status: "adotado" }) });
      setPets((items) => items.map((item) => item.id === saved.id ? saved : item));
      setRequests((items) => items.map((item) => item.id === request.id ? { ...item, status: "approved" } : item));
      setMessage(`${pet.name} foi marcado como adotado.`);
    } catch (error) {
      console.error("Erro ao marcar pet como adotado.", error);
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir a adoção.");
    }
  }

  async function updateRequestStatus(request: AdoptionRequest, status: "negado") {
      if (!request.userId) return;
      try {
        await apiFetch("/api/adoptions", { method: "PATCH", body: JSON.stringify({ requestId: request.id, status }) });
        setRequests((items) => items.map((item) => item.id === request.id ? { ...item, status } : item));
        setMessage("Solicitação negada.");
      } catch (error) {
        console.error("Erro ao atualizar solicitação.", error);
        setMessage("Não foi possível atualizar a solicitação.");
      }
    }

  async function removeRequest(request: AdoptionRequest) {
    if (!window.confirm("Excluir esta solicitação finalizada?")) return;
    const previous = requests;
    setRequests((items) => items.filter((item) => item.id !== request.id));
    try {
      await remove(ref(database, `solicitacoes/${request.id}`));
      setMessage("Solicitação finalizada excluída.");
    } catch (error) {
      console.error("Erro ao excluir solicitação finalizada.", error);
      setRequests(previous);
      setMessage("Não foi possível excluir a solicitação.");
    }
  }

  async function markAsAdopted(pet: Pet) {
    const request = requests.find((item) => item.petId === pet.id && (item.status === "pending" || item.status === "pendente"));
    if (request) {
      await markRequestAdopted(request);
      return;
    }
    if (!window.confirm(`Marcar "${pet.name}" como adotado? Ele deixará de aparecer na vitrine pública.`)) return;
    try {
      const saved = await apiFetch<Pet>(`/api/pets/${encodeURIComponent(pet.id)}`, { method: "PUT", body: JSON.stringify({ ...pet, status: "adotado" }) });
      setPets((items) => items.map((item) => item.id === saved.id ? saved : item));
      setMessage(`${pet.name} foi marcado como adotado.`);
    } catch (error) {
      console.error("Erro ao marcar pet como adotado.", error);
      setMessage("Não foi possível concluir a adoção.");
    }
  }

  if (loading) return <main className="grid min-h-screen place-items-center">Carregando...</main>;
  if (!user || role !== "admin") return <main className="grid min-h-screen place-items-center p-5"><div className="rounded-3xl border border-red-400/20 bg-stone-100 p-8 text-center"><h1 className="font-sans text-4xl uppercase">Acesso restrito</h1><p className="mt-3 text-stone-600">Entre com uma conta administrativa para continuar.</p></div></main>;

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };
  const field = (name: keyof PetFormData, placeholder: string) => <input name={name} value={String(formData[name] ?? "")} onChange={handleChange} required className="field w-full" placeholder={placeholder} />;
  const select = (name: keyof PetFormData, label: string, options: string[]) => <select name={name} value={String(formData[name] ?? "")} onChange={handleChange} required className="field w-full"><option value="">{label}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;

  return <main className="min-h-screen bg-cream p-3 pb-24 sm:p-5"><div className="mx-auto max-w-7xl">
    <header className="border-b border-stone-200 pb-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-stone-500">Olá, {user.displayName}</p><h1 className="mt-1 font-sans text-3xl uppercase sm:text-5xl">Painel PetCare</h1><Link href="/" className="mt-3 inline-flex text-sm text-gold hover:underline">← Voltar ao site</Link></div><NotificationBell /></div>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Navegação do painel"><TabButton active={activeTab === "pets"} onClick={() => setActiveTab("pets")}><PawPrint size={17} />Gerenciar pets</TabButton><TabButton active={activeTab === "create"} onClick={() => { setEditingId(null); setActiveTab("create"); }}><Plus size={17} />Cadastrar pet</TabButton><TabButton active={activeTab === "adoptions"} onClick={() => setActiveTab("adoptions")}><Inbox size={17} />Solicitações de adoção{pendingRequests.length > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{pendingRequests.length}</span>}</TabButton></nav>
    </header>
    {message && <p role="status" className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold">{message}</p>}
    {activeTab === "pets" && <section className="mt-6 rounded-3xl border border-stone-200 bg-stone-100 p-4 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-sans text-2xl uppercase">Pets cadastrados</h2><p className="text-sm text-stone-500">{filteredPets.length} resultado(s)</p></div><div className="relative sm:max-w-xs"><Search size={17} className="absolute left-3 top-3 text-stone-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome" className="field pl-10" /></div></div><div className="mt-5 grid gap-3">{filteredPets.map((pet) => { const petId = getPetId(pet); return <div key={petId} role="link" tabIndex={0} onClick={() => router.push(`/pets/${encodeURIComponent(petId)}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); router.push(`/pets/${encodeURIComponent(petId)}`); } }} className="flex cursor-pointer flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3"><img src={pet.imageUrls[0]} alt={`Foto de ${pet.name}`} className="h-14 w-14 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{pet.name}</p><p className="text-sm text-stone-500">{pet.species} · {pet.breed} · {pet.age}</p>{pet.status === "adotado" && <span className="text-xs font-semibold text-green-700">Adotado</span>}{pet.status !== "adotado" && pet.emDestaque && <span className="inline-flex items-center gap-1 text-xs text-gold"><Check size={12} /> Em destaque</span>}</div>{pet.status !== "adotado" && <button title="Marcar como adotado" onClick={(event) => { event.stopPropagation(); void markAsAdopted(pet); }} className="min-h-11 rounded-xl border border-green-300 px-3 text-xs text-green-700 hover:bg-green-50">Marcar como adotado</button>}<button title="Editar" onClick={(event) => { event.stopPropagation(); startEditing(pet); }} className="min-h-11 min-w-11 text-stone-500 hover:text-gold"><Edit3 size={17} /></button><button title="Excluir" onClick={(event) => { event.stopPropagation(); void removePet(pet); }} className="min-h-11 min-w-11 text-stone-500 hover:text-red-400"><Trash2 size={17} /></button></div>; })}{filteredPets.length === 0 && <p className="text-sm text-stone-600">Nenhum pet cadastrado.</p>}</div></section>}
    {activeTab === "create" && <form key={editingId ?? "new"} onSubmit={save} className="mx-auto mt-6 grid max-w-3xl gap-3 rounded-3xl border border-stone-200 bg-stone-100 p-4 sm:p-6"><h2 className="font-sans text-2xl uppercase">{editing ? "Atualizar pet" : "Cadastrar pet"}</h2>{field("name", "Nome do pet")}{select("species", "Espécie", choices.species)}{field("breed", "Raça (ex.: SRD / Vira-lata)")}{field("age", "Idade (ex.: 2 anos)")}{select("size", "Porte", choices.size)}{select("sex", "Sexo", choices.sex)}{field("coat", "Cor / Pelagem")}<div className="grid gap-3 sm:grid-cols-3">{select("vaccinated", "Vacinado?", choices.yesNo)}{select("neutered", "Castrado?", choices.yesNo)}{select("dewormed", "Vermifugado?", choices.yesNo)}</div>{field("temperament", "Personalidade / Temperamento")}<textarea name="description" value={formData.description} onChange={handleChange} placeholder="História / descrição detalhada" className="field min-h-28 w-full" required /><input name="images" type="file" accept="image/*" multiple onChange={handleImageChange} className="field w-full text-sm" />{selectedImages.length > 0 && <p className="text-xs text-gold">{selectedImages.length} imagem(ns) pronta(s) para envio.</p>}<p className="text-xs text-stone-500">Selecione de 1 a 5 fotos. As imagens são armazenadas em Base64.</p><label className="flex min-h-11 items-center gap-2 text-sm text-stone-600"><input name="emDestaque" type="checkbox" checked={formData.emDestaque} onChange={(event) => setFormData((current) => ({ ...current, emDestaque: event.target.checked }))} /> Em destaque na Home</label><Button className="min-h-11 w-full">{editing ? "Atualizar pet" : "Cadastrar pet"}</Button>{editing && <button type="button" onClick={() => setEditingId(null)} className="min-h-11 rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-600">Cancelar edição</button>}</form>}
    {(activeTab === "adoptions" || activeTab === "adoptions-finished") && <AdoptionsPanel initialSection={activeTab === "adoptions-finished" ? "finished" : "active"} requests={requests} pendingRequests={pendingRequests} onMarkAdopted={(request) => void markRequestAdopted(request)} onDeny={(request) => void updateRequestStatus(request, "negado")} onDelete={(request) => void removeRequest(request)} />}
  </div></main>;
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-gold text-stone-900 shadow-sm" : "border border-stone-200 bg-white text-stone-600 hover:border-gold/50 hover:text-gold"}`}>{children}</button>;
}

function AdoptionsPanel({ initialSection, requests, pendingRequests, onMarkAdopted, onDeny, onDelete }: { initialSection: "active" | "finished"; requests: AdoptionRequest[]; pendingRequests: AdoptionRequest[]; onMarkAdopted: (request: AdoptionRequest) => void; onDeny: (request: AdoptionRequest) => void; onDelete: (request: AdoptionRequest) => void }) {
  const [section, setSection] = useState<"active" | "finished">(initialSection);
  useEffect(() => setSection(initialSection), [initialSection]);
  const activeRequests = requests.filter((request) => ["pending", "pendente", "em andamento"].includes(request.status.toLowerCase()));
  const finishedRequests = requests.filter((request) => ["approved", "aprovado", "adotado", "completed", "negado", "recusado", "cancelled"].includes(request.status.toLowerCase()));
  const visibleRequests = section === "active" ? activeRequests : finishedRequests;
  const statusLabel = (status: AdoptionRequest["status"]) => ["approved", "aprovado", "adotado", "completed"].includes(status.toLowerCase()) ? "Aceita" : ["negado", "recusado", "cancelled"].includes(status.toLowerCase()) ? "Negada" : "Em andamento";
  return <section className="mx-auto mt-6 max-w-5xl rounded-3xl border border-stone-200 bg-stone-100 p-4 sm:p-6"><div className="flex items-end justify-between gap-3"><div><h2 className="font-sans text-2xl uppercase">Solicitações de adoção</h2><p className="text-sm text-stone-500">{activeRequests.length} ativa(s) · {finishedRequests.length} finalizada(s)</p></div></div><div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Solicitações administrativas"><button type="button" role="tab" aria-selected={section === "active"} onClick={() => setSection("active")} className={`rounded-xl px-4 py-3 text-sm font-semibold ${section === "active" ? "bg-gold text-stone-900" : "border border-stone-200 bg-white text-stone-600"}`}>Solicitações Ativas ({activeRequests.length})</button><button type="button" role="tab" aria-selected={section === "finished"} onClick={() => setSection("finished")} className={`rounded-xl px-4 py-3 text-sm font-semibold ${section === "finished" ? "bg-gold text-stone-900" : "border border-stone-200 bg-white text-stone-600"}`}>Solicitações Finalizadas ({finishedRequests.length})</button></div><div className="mt-5 grid gap-4">{visibleRequests.map((request) => { const address = [request.street, request.number, request.neighborhood, request.city && `${request.city}/${request.state}`, request.cep].filter(Boolean).join(" · ") || request.address || "Endereço não informado"; const whatsapp = request.phone ? `https://wa.me/55${request.phone.replace(/\D/g, "").replace(/^55/, "")}?text=${encodeURIComponent(`Olá ${request.fullName || ""}, sobre sua solicitação de adoção para o pet ${request.petName}...`)}` : ""; const email = request.userEmail ? `mailto:${request.userEmail}?subject=${encodeURIComponent(`Solicitação de adoção - ${request.petName}`)}` : ""; const isActive = ["pending", "pendente", "em andamento"].includes(request.status.toLowerCase()); const isAccepted = ["approved", "aprovado", "adotado", "completed"].includes(request.status.toLowerCase()); return <article key={request.id} className="rounded-2xl border border-stone-200 bg-white p-4"><div className="flex flex-wrap items-start gap-4"><img src={request.imageUrl || "/samples/placeholder.svg"} alt="" className="h-16 w-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{request.fullName || request.petName}</h3><span className={`rounded-full px-2 py-1 text-xs ${isAccepted ? "bg-green-100 text-green-700" : isActive ? "bg-gold/15 text-gold" : "bg-red-100 text-red-700"}`}>{statusLabel(request.status)}</span></div><p className="mt-1 text-sm text-stone-700"><strong>Pet:</strong> {request.petName} · <strong>CPF:</strong> {request.cpf || "Não informado"}</p><p className="mt-1 text-sm text-stone-600"><strong>Telefone:</strong> {request.phone || "Não informado"} · <strong>E-mail:</strong> {request.userEmail || "Não informado"}</p><p className="mt-1 text-xs text-stone-500"><strong>Endereço:</strong> {address}</p><p className="mt-3 text-sm text-stone-600"><strong>Motivação:</strong> {request.motivation || "Não informada."}</p></div></div><div className="mt-4 flex flex-wrap gap-2">{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white"><MessageCircle size={16} /> WhatsApp</a>}{email && <a href={email} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">✉ E-mail</a>}{isActive && <><button type="button" onClick={() => onMarkAdopted(request)} className="inline-flex items-center gap-2 rounded-xl border border-green-300 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50">✓ Aceitar / marcar como adotado</button><button type="button" onClick={() => onDeny(request)} className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">✕ Negar solicitação</button></>}{section === "finished" && <button type="button" onClick={() => onDelete(request)} className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">× Excluir</button>}</div></article>; })}{visibleRequests.length === 0 && <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500"><Inbox className="mx-auto mb-2" />{section === "active" ? "Nenhuma solicitação ativa." : "Nenhuma solicitação finalizada."}</div>}</div></section>;
}
