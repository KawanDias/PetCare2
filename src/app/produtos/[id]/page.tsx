"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageCircle, X } from "lucide-react";
import { use, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { LocalImage } from "@/components/LocalImage";
import { Product, formatPrice } from "@/lib/catalog-data";
import { apiFetch } from "@/lib/api";
import { whatsappLink } from "@/lib/business";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    void apiFetch<Product[]>(`/api/content/products`).then((items) => setProduct(items.find((item) => item.id === id) ?? null)).catch((error) => console.error(`Erro ao carregar produto ${id}:`, error)).finally(() => setIsLoading(false));
  }, [id]);

  const images = product?.images?.length ? product.images : product?.imageUrls?.length ? product.imageUrls : product?.image ? [product.image] : ["/samples/placeholder.svg"];
  const currentImage = images[Math.min(selectedImage, images.length - 1)];
  function moveImage(direction: number) {
    setSelectedImage((index) => (index + direction + images.length) % images.length);
  }

  function openLightbox() {
    setLightboxOpen(true);
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

  if (isLoading) return <><Header /><main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-5 md:py-10"><Link href="/produtos" className="text-sm text-gold">← Produtos</Link><div className="mt-6 grid animate-pulse gap-8 md:grid-cols-[1.05fr_0.95fr]"><div className="aspect-[4/3] rounded-xl bg-stone-100" /><div className="space-y-4 md:pt-4"><div className="h-3 w-24 rounded bg-stone-100" /><div className="h-10 w-3/4 rounded bg-stone-100" /><div className="h-8 w-32 rounded bg-stone-100" /><div className="h-28 rounded-xl bg-stone-100" /></div></div></main></>;
  if (!product) return <><Header /><main className="mx-auto min-h-screen max-w-5xl px-5 py-12"><Link href="/produtos" className="text-sm text-gold">← Produtos</Link><p className="mt-8 text-stone-600">Produto não encontrado.</p></main></>;

  return <><Header /><main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-5 md:py-10"><Link href="/produtos" className="text-sm text-gold transition-colors hover:text-amber-300">← Produtos</Link><div className="mt-6 grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-start"><section><div role="button" tabIndex={0} onClick={openLightbox} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openLightbox(); }} aria-label={`Ampliar imagem de ${product.name}`} className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-xl shadow-black/10"><div className="aspect-[4/3]"><LocalImage src={currentImage} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /></div><span className="absolute bottom-3 left-3 rounded-full bg-stone-700/80 px-3 py-1 text-xs text-white backdrop-blur">Clique para ampliar</span>{images.length > 1 && <><button type="button" aria-label="Imagem anterior" onClick={(event) => { event.stopPropagation(); moveImage(-1); }} className="absolute left-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-stone-700/70 p-2 text-white backdrop-blur transition hover:bg-white hover:text-gold sm:left-3"><ChevronLeft size={20} /></button><button type="button" aria-label="Próxima imagem" onClick={(event) => { event.stopPropagation(); moveImage(1); }} className="absolute right-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-stone-700/70 p-2 text-white backdrop-blur transition hover:bg-white hover:text-gold sm:right-3"><ChevronRight size={20} /></button></>}</div><div className="mt-3 flex gap-2 overflow-x-auto px-1 pb-1">{images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(index)} className={`h-16 w-16 min-h-11 min-w-11 shrink-0 overflow-hidden rounded-lg border transition-all duration-200 ${selectedImage === index ? "scale-105 border-amber-500" : "border-stone-200 opacity-75 hover:border-white/40 hover:opacity-100"}`}><LocalImage src={image} alt={`${product.name} - imagem ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div></section><section className="min-w-0 md:pt-2"><p className="text-xs font-medium uppercase tracking-wider text-amber-500/80">{product.category}</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-800 sm:text-3xl">{product.name}</h1><p className="mt-4 text-2xl font-semibold tracking-tight text-price">{formatPrice(product.priceCents)}</p><div className="mt-5 rounded-xl border border-stone-200 bg-white p-4"><p className="text-sm leading-6 text-stone-600">{product.description || "Produto selecionado da Barbearia do Pongo."}</p></div><a href={whatsappLink(`Olá! Quero comprar o produto ${product.name}.`)} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-stone-900 shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5 hover:bg-amber-300 sm:w-auto"><MessageCircle size={18} /> Encomendar pelo WhatsApp</a></section></div></main>{lightboxOpen && <div role="dialog" aria-modal="true" aria-label={`Galeria de ${product.name}`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-md sm:p-4" onClick={closeLightbox}><div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col items-center" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex w-full items-center justify-between text-sm text-stone-600"><span>{selectedImage + 1}/{images.length}</span><button type="button" aria-label="Fechar galeria" onClick={closeLightbox} className="min-h-11 min-w-11 rounded-full p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-800"><X size={22} /></button></div><div className="relative flex max-h-[78vh] w-full items-center justify-center"><LocalImage src={currentImage} alt={product.name} className="max-h-[78vh] max-w-full rounded-lg object-contain" />{images.length > 1 && <><button type="button" aria-label="Imagem anterior" onClick={() => moveImage(-1)} className="absolute left-0 min-h-11 min-w-11 rounded-full bg-stone-100 p-2 text-stone-800 transition hover:bg-white/20 sm:left-4"><ChevronLeft size={24} /></button><button type="button" aria-label="Próxima imagem" onClick={() => moveImage(1)} className="absolute right-0 min-h-11 min-w-11 rounded-full bg-stone-100 p-2 text-stone-800 transition hover:bg-white/20 sm:right-4"><ChevronRight size={24} /></button></>}</div><p className="mt-4 text-center text-xs text-stone-500">Deslize ou use as setas para navegar</p></div></div>}</>;
}
