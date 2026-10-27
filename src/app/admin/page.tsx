"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Edit3, ImagePlus, Search, Settings, Star, Trash2, UserRound } from "lucide-react";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { formatPrice, PortfolioItem, Product, PRODUCT_CATEGORIES } from "@/lib/catalog-data";
import { database } from "@/lib/firebase";

type Professional = { id: string; name: string; specialties: string; workSchedule: string; imageUrls: string[] };
type Service = { id: string; name: string; priceCents: number; durationMinutes: number; category: string };
type Entity = Product | PortfolioItem | Professional | Service;
type Tab = "products" | "portfolio" | "professionals" | "services";
const tabLabels: Array<[Tab, string, typeof Settings]> = [["products", "Produtos", ImagePlus], ["portfolio", "Cortes / Portfólio", Star], ["professionals", "Profissionais", UserRound], ["services", "Serviços", Settings]];
const databasePaths: Record<Tab, string> = { products: "products", portfolio: "gallery", professionals: "professionals", services: "services" };

function toJsonObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function fileToBase64(file: File) {
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => {
    const unsubscribe = (Object.keys(databasePaths) as Tab[]).map((tabName) => onValue(
      ref(database, databasePaths[tabName]),
      (snapshot) => {
        const value = snapshot.val() as Record<string, Entity> | null;
        const entries = Object.entries(value ?? {}).map(([id, item]) => ({ ...item, id }));
        setItems((previous) => ({ ...previous, [tabName]: entries }));
      },
      (error) => {
        console.error("Erro ao ler o Realtime Database.", {
          path: databasePaths[tabName],
          tab: tabName,
          error
        });
        setMessage(`Não foi possível ler ${databasePaths[tabName]}. Verifique as regras publicadas.`);
      }
    ));
    return () => unsubscribe.forEach((stop) => stop());
  }, []);

  const currentItems = items[tab];
  const filteredItems = useMemo(() => currentItems.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [currentItems, search]);
  const editing = currentItems.find((item) => item.id === editingId);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 5) {
      setSelectedImages([]);
      setMessage("Selecione no máximo 5 imagens.");
      event.target.value = "";
      return;
    }
    if (files.some((file) => !file.type.startsWith("image/"))) {
      setSelectedImages([]);
      setMessage("Selecione apenas arquivos de imagem.");
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
    const collectionPath = databasePaths[tab];
    let path = `${collectionPath}/<novo-id>`;
    const existingImages = tab === "products" && editing
      ? (editing as Product).imageUrls ?? (editing as Product).images ?? ((editing as Product).image ? [(editing as Product).image as string] : [])
      : editing && "imageUrls" in editing ? editing.imageUrls : [];
    if (selectedImages.length > 5) {
      setMessage("Selecione no máximo 5 imagens.");
      return;
    }
    try {
      const uploadedImages = selectedImages.length
        ? await Promise.all(selectedImages.map(fileToBase64))
        : existingImages;
      const id = editingId ?? push(ref(database, collectionPath)).key;
      if (!id) throw new Error("Não foi possível gerar o identificador do cadastro.");
      path = `${collectionPath}/${id}`;
      const name = String(data.get("name")).trim();
      const base = { id, name, description: String(data.get("description") ?? "").trim() };
      let nextItem: Entity;
      if (tab === "products") {
        if (!uploadedImages.length) {
          setMessage("Adicione pelo menos 1 imagem ao produto.");
          return;
        }
        nextItem = {
          ...base,
          category: String(data.get("category") ?? ""),
          priceCents: Math.round(Number(data.get("price")) * 100),
          imageUrls: uploadedImages,
          images: uploadedImages,
          image: uploadedImages[0],
          emDestaque: data.get("emDestaque") === "on"
        } as Product;
      }
      else if (tab === "portfolio") nextItem = { ...base, serviceId: String(data.get("serviceId") ?? ""), suggestedPriceCents: Math.round(Number(data.get("price")) * 100), imageUrls: uploadedImages, emDestaque: data.get("emDestaque") === "on" } as PortfolioItem;
      else if (tab === "professionals") nextItem = { ...base, specialties: String(data.get("specialties") ?? ""), workSchedule: String(data.get("workSchedule") ?? ""), imageUrls: uploadedImages } as Professional;
      else nextItem = { id, name, category: String(data.get("category") ?? ""), priceCents: Math.round(Number(data.get("price")) * 100), durationMinutes: Number(data.get("durationMinutes")) } as Service;

      const payload = toJsonObject(nextItem);
      console.info("Gravando cadastro no Realtime Database.", { path, tab });
      await set(ref(database, path), payload);
      setEditingId(null);
      setSelectedImages([]);
      form.reset();
      setMessage(`${name} salvo com sucesso.`);
    } catch (error) {
      console.error("Erro ao gravar:", error, { path, tab });
      setMessage("Não foi possível salvar. Verifique o Console e as regras do Realtime Database.");
    }
  }

  async function removeItem(item: Entity) {
    if (!window.confirm(`Excluir "${item.name}"? Essa ação não pode ser desfeita.`)) return;
    await remove(ref(database, `${databasePaths[tab]}/${item.id}`));
    if (editingId === item.id) setEditingId(null);
    setMessage(`${item.name} removido.`);
  }

  async function toggleFeatured(item: Entity) {
    if (!("emDestaque" in item)) return;
    await update(ref(database, `${databasePaths[tab]}/${item.id}`), { emDestaque: !item.emDestaque });
  }

  if (loading) return <main className="grid min-h-screen place-items-center">Carregando...</main>;
  if (!user || role !== "admin") return <main className="grid min-h-screen place-items-center p-5"><div className="rounded-3xl border border-red-400/20 bg-panel p-8 text-center"><h1 className="font-sans text-4xl uppercase">Acesso restrito</h1><p className="mt-3 text-white/60">Entre com uma conta administrativa para continuar.</p></div></main>;

  return <main className="min-h-screen overflow-x-hidden bg-ink p-3 pb-24 sm:p-5"><div className="mx-auto min-w-0 max-w-7xl"><div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4"><div className="min-w-0"><p className="truncate text-sm text-white/50">Olá, {user.displayName}</p><h1 className="font-sans text-3xl uppercase sm:text-5xl">Painel Admin</h1></div><a href="/" className="min-h-11 inline-flex items-center text-sm text-gold transition-colors hover:text-amber-400">← Voltar ao site</a></div>
    <div className="-mx-3 mt-6 flex gap-2 overflow-x-auto border-b border-white/10 px-3 pb-2 sm:mx-0 sm:mt-8 sm:px-0">{tabLabels.map(([value, label, Icon]) => <button key={value} onClick={() => { setTab(value); setEditingId(null); setSearch(""); }} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm transition-all duration-300 ${tab === value ? "bg-gold font-bold text-ink" : "text-white/60 hover:bg-white/5 hover:text-amber-400"}`}><Icon size={17}/>{label}</button>)}</div>
    {message && <p role="status" className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold">{message}</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr]">
      <form onSubmit={save} className="grid min-w-0 content-start gap-3 rounded-3xl border border-white/10 bg-panel p-4 sm:p-5"><h2 className="font-sans text-2xl uppercase">{editing ? `Atualizar ${tab === "portfolio" ? "corte" : tab === "professionals" ? "profissional" : tab === "services" ? "serviço" : "produto"}` : `Novo ${tab === "portfolio" ? "corte" : tab === "professionals" ? "profissional" : tab === "services" ? "serviço" : "produto"}`}</h2><input name="name" required defaultValue={editing?.name} placeholder="Nome" className="field w-full" /><textarea name="description" defaultValue={editing && "description" in editing ? editing.description : ""} placeholder="Descrição" className="field min-h-24 w-full" />{(tab === "products" || tab === "portfolio" || tab === "professionals") && <><input name="images" type="file" accept="image/*" multiple onChange={handleImageChange} className="field w-full text-sm" />{selectedImages.length > 0 && <p className="text-xs text-gold">{selectedImages.length} imagem(ns) pronta(s) para envio.</p>}</>}{tab === "products" && <><select name="category" required defaultValue={editing && "category" in editing ? editing.category : ""} className="field w-full"><option value="">Selecione uma categoria</option>{PRODUCT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select><input name="price" type="number" min="0" step="0.01" required defaultValue={editing && "priceCents" in editing ? editing.priceCents / 100 : ""} placeholder="Preço" className="field w-full" /><p className="text-xs text-white/50">Selecione de 1 a 5 imagens. As imagens serão exibidas na galeria do produto.</p></>}{tab === "portfolio" && <><select name="serviceId" defaultValue={editing && "serviceId" in editing ? editing.serviceId : ""} className="field w-full"><option value="" disabled>Selecione o serviço associado...</option>{items.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select>{items.services.length === 0 && <p className="text-xs text-amber-300">Nenhum serviço cadastrado. Você pode salvar o corte sem vínculo ou cadastrar um serviço primeiro.</p>}<input name="price" type="number" step="0.01" required defaultValue={editing && "suggestedPriceCents" in editing ? editing.suggestedPriceCents / 100 : ""} placeholder="Preço sugerido" className="field w-full" /></>}{tab === "professionals" && <><input name="specialties" defaultValue={editing && "specialties" in editing ? editing.specialties : ""} placeholder="Especialidades" className="field w-full" /><input name="workSchedule" defaultValue={editing && "workSchedule" in editing ? editing.workSchedule : ""} placeholder="Horários de trabalho" className="field w-full" /></>}{tab === "services" && <><input name="category" required defaultValue={editing && "category" in editing ? editing.category : ""} placeholder="Categoria" className="field w-full" /><input name="price" type="number" step="0.01" required defaultValue={editing && "priceCents" in editing ? editing.priceCents / 100 : ""} placeholder="Preço" className="field w-full" /><input name="durationMinutes" type="number" min="5" required defaultValue={editing && "durationMinutes" in editing ? editing.durationMinutes : ""} placeholder="Duração em minutos" className="field w-full" /></>}{(tab === "products" || tab === "portfolio") && <label className="flex min-h-11 items-center gap-2 text-sm text-white/70"><input name="emDestaque" type="checkbox" defaultChecked={editing && "emDestaque" in editing ? editing.emDestaque : false} /> Em destaque na Home</label>}<Button className="min-h-11 w-full">{editing ? "Atualizar" : "Cadastrar"}</Button>{editing && <button type="button" onClick={() => setEditingId(null)} className="min-h-11 w-full rounded-xl border border-white/15 px-4 py-3 text-sm text-white/70 transition-colors hover:border-amber-400 hover:text-amber-400">Cancelar edição</button>}</form>
      <section className="min-w-0 rounded-3xl border border-white/10 bg-panel p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"><div><h2 className="font-sans text-2xl uppercase">Itens cadastrados</h2><p className="text-sm text-white/50">{filteredItems.length} resultado(s)</p></div><div className="relative w-full sm:max-w-xs"><Search size={17} className="absolute left-3 top-3 text-white/40" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome" className="field w-full pl-10" /></div></div><div className="mt-5 grid gap-3">{filteredItems.length === 0 && <p className="text-sm text-white/60">Nenhum item cadastrado.</p>}{filteredItems.map((item) => <div key={item.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-white/10 p-3 transition-all hover:border-amber-400/40 sm:flex-row sm:items-center">{("imageUrls" in item && item.imageUrls[0]) ? <img src={item.imageUrls[0]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink text-gold"><Settings size={20}/></div>}<div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.name}</p><p className="break-words text-sm text-white/50">{"specialties" in item ? item.specialties : "durationMinutes" in item ? `${formatPrice(item.priceCents)} · ${item.durationMinutes} min` : "priceCents" in item ? formatPrice(item.priceCents) : formatPrice(item.suggestedPriceCents)}</p>{("emDestaque" in item && item.emDestaque) && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-xs text-gold"><Check size={12}/> Em destaque</span>}</div><div className="flex w-full items-center justify-end gap-1 sm:w-auto">{("emDestaque" in item) && <button title="Alternar destaque" aria-label="Alternar destaque" onClick={() => toggleFeatured(item)} className={`min-h-11 min-w-11 rounded-lg p-2 transition-colors ${item.emDestaque ? "text-gold" : "text-white/30 hover:text-gold"}`}><Star size={17} fill={item.emDestaque ? "currentColor" : "none"}/></button>}<button title="Editar" aria-label="Editar" onClick={() => setEditingId(item.id)} className="min-h-11 min-w-11 rounded-lg p-2 text-white/50 transition-colors hover:text-amber-400"><Edit3 size={17}/></button><button title="Excluir" aria-label="Excluir" onClick={() => void removeItem(item)} className="min-h-11 min-w-11 rounded-lg p-2 text-white/50 transition-colors hover:text-red-300"><Trash2 size={17}/></button></div></div>)}</div></section>
    </div></div></main>;
}
