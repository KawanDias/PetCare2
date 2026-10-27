"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Edit3, ImagePlus, Search, Settings, Star, Trash2, UserRound } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { fallbackPortfolio, fallbackProducts, formatPrice, PortfolioItem, Product } from "@/lib/catalog-data";
import { services as defaultServices } from "@/lib/services";

type Professional = { id: string; name: string; specialties: string; workSchedule: string; imageUrls: string[] };
type Service = { id: string; name: string; priceCents: number; durationMinutes: number; category: string };
type Entity = Product | PortfolioItem | Professional | Service;
type Tab = "products" | "portfolio" | "professionals" | "services";
const STORAGE_KEYS: Record<Tab, string> = { products: "pongo.admin.products", portfolio: "pongo.admin.portfolio", professionals: "pongo.admin.professionals", services: "pongo.admin.services" };
const tabLabels: Array<[Tab, string, typeof Settings]> = [["products", "Produtos", ImagePlus], ["portfolio", "Cortes / Portfólio", Star], ["professionals", "Profissionais", UserRound], ["services", "Serviços", Settings]];

const initialProfessionals: Professional[] = [{ id: "fernando", name: "Fernando", specialties: "Cortes e barba", workSchedule: "Terça a sábado, 9h às 19h", imageUrls: [] }];

function readItems<T extends Entity>(tab: Tab, fallback: T[]): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEYS[tab]) ?? "null");
    return Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("products");
  const [items, setItems] = useState<Record<Tab, Entity[]>>({ products: [], portfolio: [], professionals: [], services: [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems({
      products: readItems("products", fallbackProducts),
      portfolio: readItems("portfolio", fallbackPortfolio),
      professionals: readItems("professionals", initialProfessionals),
      services: readItems("services", defaultServices)
    });
  }, []);

  const currentItems = items[tab];
  const filteredItems = useMemo(() => currentItems.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [currentItems, search]);
  const editing = currentItems.find((item) => item.id === editingId);

  function persist(next: Entity[]) {
    setItems((previous) => ({ ...previous, [tab]: next }));
    localStorage.setItem(STORAGE_KEYS[tab], JSON.stringify(next));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const existingImages = editing && "imageUrls" in editing ? editing.imageUrls : [];
    const files = data.get("images");
    const uploadedImages = files instanceof FileList && files.length ? await Promise.all(Array.from(files).slice(0, 5).map(fileToDataUrl)) : existingImages;
    const id = editingId ?? `${tab}-${crypto.randomUUID()}`;
    const name = String(data.get("name")).trim();
    const base = { id, name, description: String(data.get("description") ?? "").trim() };
    let nextItem: Entity;
    if (tab === "products") nextItem = { ...base, category: String(data.get("category")), priceCents: Math.round(Number(data.get("price")) * 100), imageUrls: uploadedImages, emDestaque: data.get("emDestaque") === "on" } as Product;
    else if (tab === "portfolio") nextItem = { ...base, serviceId: String(data.get("serviceId")), suggestedPriceCents: Math.round(Number(data.get("price")) * 100), imageUrls: uploadedImages, emDestaque: data.get("emDestaque") === "on" } as PortfolioItem;
    else if (tab === "professionals") nextItem = { ...base, specialties: String(data.get("specialties")), workSchedule: String(data.get("workSchedule")), imageUrls: uploadedImages } as Professional;
    else nextItem = { id, name, category: String(data.get("category")), priceCents: Math.round(Number(data.get("price")) * 100), durationMinutes: Number(data.get("durationMinutes")) } as Service;
    persist(editingId ? currentItems.map((item) => item.id === editingId ? nextItem : item) : [nextItem, ...currentItems]);
    setEditingId(null); event.currentTarget.reset(); setMessage(`${name} salvo com sucesso.`);
  }

  function remove(item: Entity) {
    if (!window.confirm(`Excluir "${item.name}"? Essa ação não pode ser desfeita.`)) return;
    persist(currentItems.filter((candidate) => candidate.id !== item.id));
    if (editingId === item.id) setEditingId(null);
    setMessage(`${item.name} removido.`);
  }

  function toggleFeatured(item: Entity) {
    if (!("emDestaque" in item)) return;
    persist(currentItems.map((candidate) => candidate.id === item.id ? { ...candidate, emDestaque: !item.emDestaque } : candidate));
  }

  if (loading) return <main className="grid min-h-screen place-items-center">Carregando...</main>;
  if (!user || role !== "admin") return <main className="grid min-h-screen place-items-center p-5"><div className="rounded-3xl border border-red-400/20 bg-panel p-8 text-center"><h1 className="font-sans text-4xl uppercase">Acesso restrito</h1><p className="mt-3 text-white/60">Entre com uma conta administrativa para continuar.</p></div></main>;

  return <main className="min-h-screen bg-ink p-5 pb-24"><div className="mx-auto min-w-0 max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="text-sm text-white/50">Olá, {user.displayName}</p><h1 className="font-sans text-4xl uppercase sm:text-5xl">Painel Admin</h1></div><a href="/" className="text-sm text-gold transition-colors hover:text-amber-400">← Voltar ao site</a></div>
    <div className="mt-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-2">{tabLabels.map(([value, label, Icon]) => <button key={value} onClick={() => { setTab(value); setEditingId(null); setSearch(""); }} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-300 ${tab === value ? "bg-gold font-bold text-ink" : "text-white/60 hover:bg-white/5 hover:text-amber-400"}`}><Icon size={17}/>{label}</button>)}</div>
    {message && <p role="status" className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold">{message}</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr]">
      <form onSubmit={save} className="grid content-start gap-3 rounded-3xl border border-white/10 bg-panel p-5"><h2 className="font-sans text-2xl uppercase">{editing ? `Atualizar ${tab === "portfolio" ? "corte" : tab === "professionals" ? "profissional" : tab === "services" ? "serviço" : "produto"}` : `Novo ${tab === "portfolio" ? "corte" : tab === "professionals" ? "profissional" : tab === "services" ? "serviço" : "produto"}`}</h2><input name="name" required defaultValue={editing?.name} placeholder="Nome" className="field" /><textarea name="description" defaultValue={editing && "description" in editing ? editing.description : ""} placeholder="Descrição" className="field min-h-24" />{(tab === "products" || tab === "portfolio" || tab === "professionals") && <input name="images" type="file" accept="image/*" multiple className="field" />}{tab === "products" && <input name="category" required defaultValue={editing && "category" in editing ? editing.category : ""} placeholder="Categoria" className="field" />}{tab === "portfolio" && <><input name="serviceId" required defaultValue={editing && "serviceId" in editing ? editing.serviceId : ""} placeholder="ID do serviço" className="field" /><input name="price" type="number" step="0.01" required defaultValue={editing && "suggestedPriceCents" in editing ? editing.suggestedPriceCents / 100 : ""} placeholder="Preço sugerido" className="field" /></>}{tab === "professionals" && <><input name="specialties" defaultValue={editing && "specialties" in editing ? editing.specialties : ""} placeholder="Especialidades" className="field" /><input name="workSchedule" defaultValue={editing && "workSchedule" in editing ? editing.workSchedule : ""} placeholder="Horários de trabalho" className="field" /></>}{tab === "services" && <><input name="category" required defaultValue={editing && "category" in editing ? editing.category : ""} placeholder="Categoria" className="field" /><input name="price" type="number" step="0.01" required defaultValue={editing && "priceCents" in editing ? editing.priceCents / 100 : ""} placeholder="Preço" className="field" /><input name="durationMinutes" type="number" min="5" required defaultValue={editing && "durationMinutes" in editing ? editing.durationMinutes : ""} placeholder="Duração em minutos" className="field" /></>}{(tab === "products" || tab === "portfolio") && <label className="flex items-center gap-2 text-sm text-white/70"><input name="emDestaque" type="checkbox" defaultChecked={editing && "emDestaque" in editing ? editing.emDestaque : false} /> Em destaque na Home</label>}<Button>{editing ? "Atualizar" : "Cadastrar"}</Button>{editing && <button type="button" onClick={() => setEditingId(null)} className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/70 transition-colors hover:border-amber-400 hover:text-amber-400">Cancelar edição</button>}</form>
      <section className="min-w-0 rounded-3xl border border-white/10 bg-panel p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-sans text-2xl uppercase">Itens cadastrados</h2><p className="text-sm text-white/50">{filteredItems.length} resultado(s)</p></div><div className="relative w-full sm:w-auto"><Search size={17} className="absolute left-3 top-3 text-white/40" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome" className="field pl-10" /></div></div><div className="mt-5 grid gap-3">{filteredItems.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 p-3 transition-all hover:border-amber-400/40">{("imageUrls" in item && item.imageUrls[0]) ? <img src={item.imageUrls[0]} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-xl bg-ink text-gold"><Settings size={20}/></div>}<div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.name}</p><p className="text-sm text-white/50">{"specialties" in item ? item.specialties : "durationMinutes" in item ? `${formatPrice(item.priceCents)} · ${item.durationMinutes} min` : "priceCents" in item ? formatPrice(item.priceCents) : formatPrice(item.suggestedPriceCents)}</p>{("emDestaque" in item && item.emDestaque) && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-xs text-gold"><Check size={12}/> Em destaque</span>}</div><div className="flex items-center gap-1">{("emDestaque" in item) && <button title="Alternar destaque" onClick={() => toggleFeatured(item)} className={`rounded-lg p-2 transition-colors ${item.emDestaque ? "text-gold" : "text-white/30 hover:text-gold"}`}><Star size={17} fill={item.emDestaque ? "currentColor" : "none"}/></button>}<button title="Editar" onClick={() => setEditingId(item.id)} className="rounded-lg p-2 text-white/50 transition-colors hover:text-amber-400"><Edit3 size={17}/></button><button title="Excluir" onClick={() => remove(item)} className="rounded-lg p-2 text-white/50 transition-colors hover:text-red-300"><Trash2 size={17}/></button></div></div>)}</div></section>
    </div></div></main>;
}
