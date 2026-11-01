"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, X } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { LocalImage } from "@/components/LocalImage";
import { Pet } from "@/lib/catalog-data";
import { apiFetch } from "@/lib/api";
import { whatsappLink } from "@/lib/business";

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { user, toggleFavorite } = useAuth();
  useEffect(() => {
    setLoading(true);
    setPet(null);
    void apiFetch<Pet>(`/api/pets/${encodeURIComponent(id)}`)
      .then(setPet)
      .catch((error) => { if (error instanceof Error && error.message !== "Pet não encontrado.") console.error("Erro ao carregar pet.", error); })
      .finally(() => setLoading(false));
  }, [id]);
  const images = pet?.imageUrls?.length ? pet.imageUrls : pet?.images?.length ? pet.images : pet?.image ? [pet.image] : ["/samples/placeholder.svg"];
  const currentImage = images[Math.min(selectedImage, images.length - 1)];
  const moveImage = (direction: number) => setSelectedImage((index) => (index + direction + images.length) % images.length);
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setLightboxOpen(false); if (event.key === "ArrowLeft") moveImage(-1); if (event.key === "ArrowRight") moveImage(1); };
    document.addEventListener("keydown", handleKeyDown); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = ""; };
  }, [lightboxOpen]);
  if (loading) return <><Header /><main className="mx-auto min-h-screen max-w-5xl px-5 py-12"><Link href="/pets" className="text-sm text-gold">← Pets para adoção</Link><div className="mt-8 animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-stone-200" /><div className="h-4 w-72 rounded bg-stone-200" /><div className="h-48 rounded-xl bg-stone-200" /></div></main></>;
  if (!pet) return <><Header /><main className="mx-auto min-h-screen max-w-5xl px-5 py-12"><Link href="/pets" className="text-sm text-gold">← Pets para adoção</Link><p className="mt-8 text-stone-600">Pet não encontrado.</p></main></>;
  const petData = pet;
  const favorite = Boolean(user?.favorites.some((item) => item.id === pet.id && item.type === "pet"));
  const detail = [["Espécie", pet.species], ["Raça", pet.breed], ["Idade", pet.age], ["Porte", pet.size], ["Sexo", pet.sex], ["Cor / Pelagem", pet.coat], ["Vacinado", pet.vaccinated], ["Castrado", pet.neutered], ["Vermifugado", pet.dewormed]];
  async function requestAdoption() {
    window.location.href = `/pets/${encodeURIComponent(id)}/adocao`;
  }
  async function handleFavorite() {
    if (!user) { window.location.href = `/login?redirect=/pets/${encodeURIComponent(id)}`; return; }
    await toggleFavorite({ id: petData.id, type: "pet", name: petData.name, imageUrl: currentImage, priceCents: 0 });
  }
  return <><Header /><main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-5"><Link href="/pets" className="text-sm text-gold">← Pets para adoção</Link><div className="mt-6 grid gap-8 md:grid-cols-[1.05fr_0.95fr]"><section><button type="button" onClick={() => setLightboxOpen(true)} className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-stone-200 bg-stone-100"><div className="aspect-[4/3]"><LocalImage src={currentImage} alt={pet.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /></div><span className="absolute bottom-3 left-3 rounded-full bg-stone-700/80 px-3 py-1 text-xs text-white">Clique para ampliar</span>{images.length > 1 && <><button type="button" aria-label="Imagem anterior" onClick={(event) => { event.stopPropagation(); moveImage(-1); }} className="absolute left-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-stone-700/70 p-2 text-white"><ChevronLeft size={20} /></button><button type="button" aria-label="Próxima imagem" onClick={(event) => { event.stopPropagation(); moveImage(1); }} className="absolute right-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-stone-700/70 p-2 text-white"><ChevronRight size={20} /></button></>}</button><div className="mt-3 flex gap-2 overflow-x-auto px-1 pb-1">{images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(index)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${selectedImage === index ? "border-amber-500" : "border-stone-200"}`}><LocalImage src={image} alt={`${pet.name} - imagem ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div></section><section><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-wider text-amber-500/80">{pet.species}</p><h1 className="mt-2 text-3xl font-bold text-stone-800">{pet.name}</h1></div><button type="button" onClick={() => void handleFavorite()} aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} className="rounded-full border border-stone-200 p-3 text-gold">{favorite ? <Heart fill="currentColor" /> : <Heart />}</button></div><div className="mt-5 grid grid-cols-2 gap-3">{detail.map(([label, value]) => <div key={label} className="rounded-xl border border-stone-200 bg-white p-3"><p className="text-xs text-stone-500">{label}</p><p className="mt-1 text-sm font-medium text-stone-800">{value || "Não informado"}</p></div>)}</div><div className="mt-4 rounded-xl border border-stone-200 bg-white p-4"><p className="text-xs uppercase tracking-wider text-gold">Personalidade</p><p className="mt-2 text-sm leading-6 text-stone-600">{pet.temperament}</p><p className="mt-4 text-xs uppercase tracking-wider text-gold">História e descrição</p><p className="mt-2 text-sm leading-6 text-stone-600">{pet.description}</p></div>  <button type="button" onClick={() => void requestAdoption()} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gold px-4 py-3 text-sm font-bold text-gold">Solicitar adoção</button><a href={whatsappLink(`Olá! Tenho interesse em adotar o pet ${pet.name} que vi no PetCare.`)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-white"><MessageCircle size={18} /> Quero Adotar / Falar via WhatsApp</a></section></div></main>{lightboxOpen && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3" onClick={() => setLightboxOpen(false)}><div className="relative max-h-[92vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Fechar galeria" onClick={() => setLightboxOpen(false)} className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-3 text-white"><X size={22} /></button><LocalImage src={currentImage} alt={pet.name} className="max-h-[90vh] w-full rounded-lg object-contain" /></div></div>}</>;
}
