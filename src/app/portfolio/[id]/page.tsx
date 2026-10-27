"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { use, useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { Header } from "@/components/Header";
import { PortfolioItem, formatPrice } from "@/lib/catalog-data";
import { database } from "@/lib/firebase";
import { LocalImage } from "@/components/LocalImage";

export default function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<PortfolioItem | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => onValue(ref(database, `gallery/${id}`), (snapshot) => {
    setItem(snapshot.exists() ? { id, ...snapshot.val() as Omit<PortfolioItem, "id"> } : null);
  }), [id]);

  const photos = (item?.fotos?.length ? item.fotos : item?.imageUrls ?? []).slice(0, 5);
  const images = photos.length > 0 ? photos : ["/samples/placeholder.svg"];
  const currentImage = images[Math.min(selectedImage, images.length - 1)];

  function moveImage(direction: number) {
    setSelectedImage((index) => (index + direction + images.length) % images.length);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") moveImage(-1);
      if (event.key === "ArrowRight") moveImage(1);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  if (!item) return <><Header /><main className="mx-auto min-h-screen max-w-5xl px-5 py-12"><Link href="/portfolio" className="text-sm text-gold">← Portfólio</Link><p className="mt-8 text-white/60">Corte não encontrado.</p></main></>;

  return <><Header /><main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-5 md:py-10"><Link href="/portfolio" className="text-sm text-gold transition-colors hover:text-amber-300">← Portfólio</Link><div className="mt-6 grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-start"><section><div role="button" tabIndex={0} onClick={() => setLightboxOpen(true)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setLightboxOpen(true); }} aria-label={`Ampliar imagem de ${item.name}`} className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/10 bg-panel shadow-xl shadow-black/10"><div className="aspect-[4/3]"><LocalImage src={currentImage} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /></div><span className="absolute bottom-3 left-3 rounded-full bg-ink/65 px-3 py-1 text-xs text-white/80 backdrop-blur">Clique para ampliar</span>{images.length > 1 && <><button type="button" aria-label="Imagem anterior" onClick={(event) => { event.stopPropagation(); moveImage(-1); }}   className="absolute left-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-ink/45 p-2 text-white/85 backdrop-blur transition hover:bg-ink/70 hover:text-gold"><ChevronLeft size={20} /></button><button type="button" aria-label="Próxima imagem" onClick={(event) => { event.stopPropagation(); moveImage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-ink/45 p-2 text-white/85 backdrop-blur transition hover:bg-ink/70 hover:text-gold"><ChevronRight size={20} /></button></>}</div><div className="mt-3 flex gap-2 overflow-x-auto px-1 pb-1">{images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(index)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-all duration-200 ${selectedImage === index ? "scale-105 border-amber-500" : "border-white/10 opacity-75 hover:border-white/40 hover:opacity-100"}`}><LocalImage src={image} alt={`${item.name} - imagem ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div></section><section className="min-w-0 md:pt-2"><p className="text-xs font-medium uppercase tracking-wider text-amber-500/80">Detalhes do corte</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{item.name}</h1><p className="mt-4 text-2xl font-semibold tracking-tight text-price">{formatPrice(item.suggestedPriceCents)}</p><div className="mt-5 rounded-xl border border-white/10 bg-panel/70 p-4"><p className="text-sm leading-6 text-white/70">{item.description || "Corte realizado pela Barbearia do Pongo."}</p></div><Link href={`/agendar?service=${item.serviceId}`} className="mt-6 inline-flex rounded-xl bg-gold px-4 py-3 text-sm font-bold text-ink shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5 hover:bg-amber-300">Agendar este corte</Link></section></div></main>{lightboxOpen && <div role="dialog" aria-modal="true" aria-label={`Galeria de ${item.name}`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md" onClick={closeLightbox}><div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col items-center" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex w-full items-center justify-between text-sm text-white/70"><span>{selectedImage + 1}/{images.length}</span><button type="button" aria-label="Fechar galeria" onClick={closeLightbox} className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"><X size={22} /></button></div><div className="relative flex max-h-[78vh] w-full items-center justify-center"><LocalImage src={currentImage} alt={item.name} className="max-h-[78vh] max-w-full rounded-lg object-contain" />{images.length > 1 && <><button type="button" aria-label="Imagem anterior" onClick={() => moveImage(-1)} className="absolute left-1 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:left-4"><ChevronLeft size={24} /></button><button type="button" aria-label="Próxima imagem" onClick={() => moveImage(1)} className="absolute right-1 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:right-4"><ChevronRight size={24} /></button></>}</div><p className="mt-4 text-center text-xs text-white/50">Deslize ou use as setas para navegar</p></div></div>}</>;
}
