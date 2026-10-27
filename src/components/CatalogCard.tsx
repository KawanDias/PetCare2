"use client";

import { ShoppingBag } from "lucide-react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { whatsappLink } from "@/lib/business";
import { formatPrice, Product } from "@/lib/catalog-data";
import { PLACEHOLDER_IMAGE } from "@/lib/mockData";
import { useAuth } from "@/components/AuthProvider";

export function CatalogCard({ product }: { product: Product }) {
  const { user, toggleFavorite } = useAuth();
  const source = product.fotos?.[0] ?? product.images?.[0] ?? product.imageUrls?.[0] ?? product.image ?? PLACEHOLDER_IMAGE;
  const favorite = user?.favorites.some((item) => item.id === product.id && item.type === "product");
  function handleFavorite() {
    if (!user) { if (window.confirm("Você precisa estar logado para adicionar itens aos seus favoritos. Deseja ir para a página de Login?")) window.location.href = "/login"; return; }
    toggleFavorite({ id: product.id, type: "product", name: product.name, imageUrl: source, priceCents: product.priceCents });
  }
  return <article className="relative group overflow-hidden rounded-2xl border border-white/10 bg-panel transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/10"><Link href={`/produtos/${product.id}`} className="block"><div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-panel to-gold/20 text-gold"><img src={source} alt={product.name} onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div><div className="p-5"><p className="text-xs uppercase tracking-widest text-gold">{product.category}</p><h3 className="mt-2 font-bold">{product.name}</h3><p className="mt-1 text-sm text-white/60">{product.description}</p><div className="mt-4"><strong className="text-price">{formatPrice(product.priceCents)}</strong></div></div></Link><button type="button" aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={handleFavorite} className="absolute right-3 top-3 rounded-full bg-ink/80 p-2 text-white transition hover:text-red-400"><Heart size={18} fill={favorite ? "currentColor" : "none"} /></button><div className="px-5 pb-5"><a className="inline-block rounded-lg bg-gold px-3 py-2 text-sm font-bold text-ink transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20" href={whatsappLink(`Olá! Quero comprar: ${product.name}.`)}>Pedir</a></div></article>;
}
