"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { formatPrice, PortfolioItem } from "@/lib/catalog-data";
import { PLACEHOLDER_IMAGE } from "@/lib/mockData";
import { useAuth } from "@/components/AuthProvider";

export function PortfolioCard({ item }: { item: PortfolioItem }) {
  const { user, toggleFavorite } = useAuth();
  const source = item.fotos?.[0] ?? item.imageUrls[0] ?? PLACEHOLDER_IMAGE;
  const favorite = user?.favorites.some((favoriteItem) => favoriteItem.id === item.id && favoriteItem.type === "portfolio");
  function handleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) { if (window.confirm("Você precisa estar logado para adicionar itens aos seus favoritos. Deseja ir para a página de Login?")) window.location.href = "/login"; return; }
    toggleFavorite({ id: item.id, type: "portfolio", name: item.name, imageUrl: source, priceCents: item.suggestedPriceCents, serviceId: item.serviceId });
  }
  return <Link href={`/portfolio/${item.id}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-panel transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/10"><div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-ink to-gold/50 text-gold"><img src={source} alt={item.name} onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><button type="button" aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={handleFavorite} className="absolute right-3 top-3 rounded-full bg-ink/80 p-2 text-white transition hover:text-red-400"><Heart size={18} fill={favorite ? "currentColor" : "none"} /></button></div><div className="p-4"><h3 className="font-bold">{item.name}</h3><p className="mt-1 text-sm text-white/60">{item.description}</p><p className="mt-3 text-sm text-price">{formatPrice(item.suggestedPriceCents)}</p></div></Link>;
}
