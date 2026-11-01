"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit3, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Pet } from "@/lib/catalog-data";
import { apiFetch } from "@/lib/api";

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

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const editing = pets.find((pet) => pet.id === editingId);
  const [formData, setFormData] = useState<PetFormData>(emptyFormData);

  useEffect(() => {
    setFormData(editing ? petToFormData(editing as Pet & Record<string, unknown>) : emptyFormData);
  }, [editingId, pets]);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) router.replace("/");
  }, [loading, role, router, user]);

  useEffect(() => { void apiFetch<Pet[]>("/api/pets").then(setPets).catch((error) => { console.error("Erro ao carregar pets pela API.", error); setMessage("Não foi possível carregar os pets."); }); }, []);

  const filteredPets = useMemo(() => pets.filter((pet) => pet.name.toLowerCase().includes(search.toLowerCase())), [pets, search]);

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
        id: editingId ?? "",
        name: String(data.get("name") ?? "").trim(),
        species: String(data.get("species") ?? ""), breed: String(data.get("breed") ?? "").trim(),
        age: String(data.get("age") ?? "").trim(), size: String(data.get("size") ?? ""),
        sex: String(data.get("sex") ?? ""), coat: String(data.get("coat") ?? "").trim(),
        vaccinated: String(data.get("vaccinated") ?? ""), neutered: String(data.get("neutered") ?? ""),
        dewormed: String(data.get("dewormed") ?? ""), temperament: String(data.get("temperament") ?? "").trim(),
        description: String(data.get("description") ?? "").trim(), imageUrls: images, images, image: images[0],
        emDestaque: data.get("emDestaque") === "on"
      };
      const saved = editingId
        ? await apiFetch<Pet>(`/api/pets/${encodeURIComponent(editingId)}`, { method: "PUT", body: JSON.stringify(pet) })
        : await apiFetch<Pet>("/api/pets", { method: "POST", body: JSON.stringify(pet) });
      setPets((items) => editingId ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved]);
      setEditingId(null); setSelectedImages([]); form.reset(); setFormData(emptyFormData); setMessage(`${pet.name} salvo com sucesso.`);
    } catch (error) {
      console.error("Erro ao gravar pet.", error);
      setMessage("Não foi possível salvar o pet. Verifique o Console e as regras do banco.");
    }
  }

  async function removePet(pet: Pet) {
    if (!window.confirm(`Excluir "${pet.name}"? Essa ação não pode ser desfeita.`)) return;
    try { await apiFetch(`/api/pets/${encodeURIComponent(pet.id)}`, { method: "DELETE" }); setPets((items) => items.filter((item) => item.id !== pet.id)); setMessage(`${pet.name} removido.`); }
    catch (error) { console.error("Erro ao excluir pet.", error); setMessage("Não foi possível excluir o pet."); }
  }

  if (loading) return <main className="grid min-h-screen place-items-center">Carregando...</main>;
  if (!user || role !== "admin") return <main className="grid min-h-screen place-items-center p-5"><div className="rounded-3xl border border-red-400/20 bg-stone-100 p-8 text-center"><h1 className="font-sans text-4xl uppercase">Acesso restrito</h1><p className="mt-3 text-stone-600">Entre com uma conta administrativa para continuar.</p></div></main>;

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };
  const field = (name: keyof PetFormData, placeholder: string) => <input name={name} value={String(formData[name] ?? "")} onChange={handleChange} required className="field w-full" placeholder={placeholder} />;
  const select = (name: keyof PetFormData, label: string, options: string[]) => <select name={name} value={String(formData[name] ?? "")} onChange={handleChange} required className="field w-full"><option value=""> {label} </option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  return <main className="min-h-screen overflow-x-hidden bg-cream p-3 pb-24 sm:p-5"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-4"><div><h1 className="font-sans text-3xl uppercase sm:text-5xl">Painel PetCare</h1></div><a href="/" className="text-sm text-gold">← Voltar ao site</a></div>
    {message && <p role="status" className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold">{message}</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <form key={editingId ?? "new"} onSubmit={save} className="grid content-start gap-3 rounded-3xl border border-stone-200 bg-stone-100 p-4 sm:p-5"><h2 className="font-sans text-2xl uppercase">{editing ? "Atualizar pet" : "Cadastrar pet"}</h2>{field("name", "Nome do pet")}{select("species", "Espécie", choices.species)}{field("breed", "Raça (ex.: SRD / Vira-lata)")}{field("age", "Idade (ex.: 2 anos)")}{select("size", "Porte", choices.size)}{select("sex", "Sexo", choices.sex)}{field("coat", "Cor / Pelagem")}<div className="grid gap-3 sm:grid-cols-3">{select("vaccinated", "Vacinado?", choices.yesNo)}{select("neutered", "Castrado?", choices.yesNo)}{select("dewormed", "Vermifugado?", choices.yesNo)}</div>{field("temperament", "Personalidade / Temperamento")}<textarea name="description" value={formData.description} onChange={handleChange} placeholder="História / descrição detalhada" className="field min-h-28 w-full" required /><input name="images" type="file" accept="image/*" multiple onChange={handleImageChange} className="field w-full text-sm" />{selectedImages.length > 0 && <p className="text-xs text-gold">{selectedImages.length} imagem(ns) pronta(s) para envio.</p>}<p className="text-xs text-stone-500">Selecione de 1 a 5 fotos. As imagens são armazenadas em Base64.</p><label className="flex min-h-11 items-center gap-2 text-sm text-stone-600"><input name="emDestaque" type="checkbox" checked={formData.emDestaque} onChange={(event) => setFormData((current) => ({ ...current, emDestaque: event.target.checked }))} /> Em destaque na Home</label><Button className="min-h-11 w-full">{editing ? "Atualizar pet" : "Cadastrar pet"}</Button>{editing && <button type="button" onClick={() => setEditingId(null)} className="min-h-11 rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-600">Cancelar edição</button>}</form>
      <section className="rounded-3xl border border-stone-200 bg-stone-100 p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-sans text-2xl uppercase">Pets cadastrados</h2><p className="text-sm text-stone-500">{filteredPets.length} resultado(s)</p></div><div className="relative sm:max-w-xs"><Search size={17} className="absolute left-3 top-3 text-stone-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome" className="field pl-10" /></div></div><div className="mt-5 grid gap-3">{filteredPets.map((pet) => <div key={pet.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 p-3"><img src={pet.imageUrls[0]} alt="" className="h-14 w-14 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{pet.name}</p><p className="text-sm text-stone-500">{pet.species} · {pet.breed} · {pet.age}</p>{pet.emDestaque && <span className="inline-flex items-center gap-1 text-xs text-gold"><Check size={12} /> Em destaque</span>}</div><button title="Editar" aria-label="Editar" onClick={() => setEditingId(pet.id)} className="min-h-11 min-w-11 text-stone-500 hover:text-gold"><Edit3 size={17} /></button><button title="Excluir" aria-label="Excluir" onClick={() => void removePet(pet)} className="min-h-11 min-w-11 text-stone-500 hover:text-red-400"><Trash2 size={17} /></button></div>)}{filteredPets.length === 0 && <p className="text-sm text-stone-600">Nenhum pet cadastrado.</p>}</div></section>
    </div></div></main>;
}
