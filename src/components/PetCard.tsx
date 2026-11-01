"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Pet } from "@/lib/catalog-data";
import { PLACEHOLDER_IMAGE } from "@/lib/mockData";

export function PetCard({ pet }: { pet: Pet }) {
  const { user, toggleFavorite } = useAuth();
  const petId = pet.id || String((pet as Pet & { key?: string }).key ?? "");
  const image = pet.imageUrls?.[0] ?? pet.images?.[0] ?? pet.image ?? PLACEHOLDER_IMAGE;
  const favorite = Boolean(user?.favorites.some((item) => item.id === petId && item.type === "pet"));
  async function handleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) { window.location.href = `/login?redirect=/pets/${encodeURIComponent(petId)}`; return; }
    await toggleFavorite({ id: petId, type: "pet", name: pet.name, imageUrl: image, priceCents: 0 });
  }
  const detailHref = `/pets/${encodeURIComponent(petId)}`;
  return <div className="group relative">
    <Link href={detailHref} aria-label={`Ver detalhes de ${pet.name}`} className="block cursor-pointer overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/40">
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-panel to-gold/20"><img src={image} alt={pet.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
      <div className="p-5"><p className="text-xs uppercase tracking-widest text-gold">{pet.species} · {pet.size}</p><h3 className="mt-2 text-xl font-bold">{pet.name}</h3><p className="mt-1 text-sm text-stone-600">{pet.breed} · {pet.age}</p><p className="mt-4 text-sm text-stone-600">{pet.temperament}</p></div>
    </Link>
    <button type="button" onClick={(event) => void handleFavorite(event)} aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gold shadow-sm"><Heart size={18} fill={favorite ? "currentColor" : "none"} /></button>
  </div>;
}
